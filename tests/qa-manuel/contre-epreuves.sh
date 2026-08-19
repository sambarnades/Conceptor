#!/bin/zsh
# =============================================================================
# Contre-épreuves des correctifs d'éditeur de la 6.3.0.
#
# Principe : un correctif que RIEN ne fait échouer n'est pas couvert. Chaque entrée
# DÉSARME un correctif (édition temporaire du source), relance la suite ciblée, et
# attend qu'elle passe au ROUGE. Le source est restauré par `git checkout` après
# chaque passe — le script refuse de démarrer si l'arbre n'est pas propre, pour ne
# jamais écraser du travail en cours.
#
# Les désarmements sont des remplacements de chaîne LITTÉRAUX (aucune regex) : si la
# ligne visée change dans le source, le patch échoue bruyamment au lieu de faire un
# no-op silencieux qui se lirait à tort comme « correctif non couvert ».
#
# Usage : tests/qa-manuel/contre-epreuves.sh [filtre]     (sans argument : toutes)
# Attendu : chaque contre-épreuve ROUGE. Une VERTE = correctif non couvert.
# =============================================================================
set -u
cd "$(dirname "$0")/../.." || exit 1
FICHIERS=(js/editor/editor-core.js js/editor/array-manager.js js/h5p/json-healer.js
          js/editor/content-detector.js js/editor/validators.js)

# Restauration par SNAPSHOT, pas par `git checkout` : le script doit pouvoir contre-
# éprouver un correctif encore NON COMMITÉ (c'est le cas normal quand on vient de
# l'écrire), et un `git checkout` le jetterait. Le snapshot rend aussi la restauration
# indépendante de l'état de l'index.
INSTANTANE=$(mktemp -d)
for f in $FICHIERS; do mkdir -p "$INSTANTANE/$(dirname $f)"; cp "$f" "$INSTANTANE/$f"; done
restaurer() { for f in $FICHIERS; do cp "$INSTANTANE/$f" "$f"; done }
trap 'restaurer; rm -rf "$INSTANTANE"' EXIT INT TERM

# sub <fichier> <ancien> <nouveau> — remplacement littéral, sort 1 si l'ancien est absent
sub() {
  python3 - "$1" "$2" "$3" <<'PY'
import sys
f, vieux, neuf = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(f, encoding='utf-8').read()
if vieux not in s:
    print(f"    !! chaîne introuvable dans {f} : {vieux[:70]}…"); sys.exit(1)
open(f, 'w', encoding='utf-8').write(s.replace(vieux, neuf, 1))
PY
}

FILTRE="${1:-}"
passe() {   # passe <nom> <suite> <corps de désarmement…>
  local nom="$1" suite="$2"; shift 2
  [[ -z "$FILTRE" || "$nom" == *"$FILTRE"* ]] || return 0
  echo "\n########## $nom ##########"
  if ! "$@"; then echo "  ❌ patch de désarmement non appliqué"; restaurer; return 1; fi
  if diff -rq "$INSTANTANE" . >/dev/null 2>&1; then echo "  ❌ le patch n'a RIEN changé"; restaurer; return 1; fi
  echo "  [désarmé]"
  local out rouge=1
  case "$suite" in
    complete)            out=$(node tests/run_browser_suite.mjs 2>&1) ;;
    oracle-validateurs)  out=$(node tests/run_validators_oracle.mjs 2>&1) ;;
    *)                   out=$(node tests/run_browser_suite.mjs --suite="$suite" 2>&1) ;;
  esac
  echo "$out" | /usr/bin/grep -E "PASS  \||↳ FAIL|de PLUS que la référence|Suite navigateur conforme|écart\(s\)|Comportement identique" | cut -c1-190 | sed 's/^/  /'
  echo "$out" | /usr/bin/grep -qE "de PLUS que la référence|écart\(s\) BLOQUANT" || rouge=0
  if [[ $rouge == 1 ]]; then echo "  ✅ ROUGE — correctif couvert par $suite"
  else echo "  ⚠️  VERT — RIEN dans $suite ne détecte ce désarmement"; fi
  restaurer
}

C1() { sub js/editor/editor-core.js \
  "} else if (input.dataset.timelineDate === 'true') {" \
  "} else if (false && input.dataset.timelineDate === 'true') {" }

C2() { sub js/editor/array-manager.js \
        "    remapperRenvoisDIndice(operation) {" \
        "    remapperRenvoisDIndice(operation) {
        if (true) return;" &&
      sub js/editor/editor-core.js \
        "function remapperRenvoisDIndice(cheminTableau, config, operation) {" \
        "function remapperRenvoisDIndice(cheminTableau, config, operation) {
    if (true) return;" }

C3() { sub js/editor/array-manager.js \
  "export function refreshArrayManagerAt(path) {" \
  "export function refreshArrayManagerAt(path) {
    if (true) return false;" }

C4a() { sub js/h5p/json-healer.js "    healDragQuestionsDeep(healed);" "    /* désarmé */" }

C4b() { sub js/h5p/json-healer.js \
  '    if (!healed.graphMode) healed.graphMode = "barChart";' "    /* désarmé */" }

C5() { sub js/editor/content-detector.js "    if (zonesRenseignees) {" "    if (true) {" }

C6a() { sub js/editor/validators.js \
  "    if (config.type === 'dynamicObject' && config.schemas && value && typeof value === 'object') {" \
  "    if (false) {" }

C7a() { sub js/editor/validators.js \
  "    if (!validators.required(value) && !config.required && !exigeDesElements) {" \
  "    if (!validators.required(value) && !config.required) {" }

C7b() { sub js/editor/validators.js \
  "    if (config.type === 'array') {
        if (config.minItems" \
  "    if (config.type === 'array' && Array.isArray(value)) {
        if (config.minItems" }

C6b() { sub js/editor/validators.js \
  "    const label = translateLabel(config.label) || translateLabel(config.itemLabel) || path;" \
  "    const label = translateLabel(config.label) || path;" }

passe "C1  — editor-core.js : branche timelineDate de collectInputValues" editor-activities C1
passe "C2  — remapperRenvoisDIndice (array-manager + editor-core)"        editor-activities C2
passe "C3  — array-manager.js : refreshArrayManagerAt"                    editor-activities C3
passe "C4a — json-healer.js : appel healDragQuestionsDeep(healed)"        editor-activities C4a
# NB : le défaut graphMode n'est PAS couvert par editor-activities — il l'est par
# test-edit-export-flow.js, donc seulement par la suite COMPLÈTE.
passe "C4b — json-healer.js : défaut graphMode « barChart »"              complete         C4b
passe "C5  — content-detector.js : garde zonesRenseignees"                editor-activities C5
passe "C6a — validators.js : descente dans les dynamicObject"             editor-activities C6a
passe "C6b — validators.js : repli itemLabel"                             editor-activities C6b
# C7 = correctif « QCM sans réponses » (cardinalité mesurée à zéro). Aucune suite
# navigateur ne l'assertait : c'est l'ORACLE des validateurs qui le tient (14 cellules
# array-min2), plus le scénario tests/qa-manuel/f-qcm-sans-reponses.mjs.
passe "C7a — validators.js : exception exigeDesElements"                  oracle-validateurs C7a
passe "C7b — validators.js : garde Array.isArray du bloc tableau"         oracle-validateurs C7b

restaurer
echo "\n=== sources restaurées à leur état de départ ==="
ecart=0
for f in $FICHIERS; do cmp -s "$INSTANTANE/$f" "$f" || { echo "❌ DIVERGENT : $f"; ecart=1; }; done
[[ $ecart == 0 ]] && echo "✅ identiques au snapshot de départ" 
