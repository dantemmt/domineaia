#!/usr/bin/env bash
# Gera um vídeo para cada tema (pt). Ex.: ./make-all.sh  ou  ./make-all.sh melancia kiwi
set -e
cd "$(dirname "$0")"
THEMES=${@:-pitaya morango cebola bolo melancia laranja limao kiwi maca manga pessego abacate tomate beterraba chocolate ovo queijo sabao}
for t in $THEMES; do node render.mjs --theme "$t"; done
