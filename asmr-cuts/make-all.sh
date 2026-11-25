#!/usr/bin/env bash
# Gera um vídeo para cada tema (pt). Ex.: ./make-all.sh  ou  ./make-all.sh melancia kiwi
set -e
cd "$(dirname "$0")"
THEMES=${@:-abacate melancia laranja limao kiwi tomate ovo sabao queijo}
for t in $THEMES; do node render.mjs --theme "$t"; done
