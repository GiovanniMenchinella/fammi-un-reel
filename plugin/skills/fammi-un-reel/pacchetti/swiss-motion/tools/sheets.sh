#!/bin/sh
# contact sheets from stills: sheets.sh <stills dir> <prefix-out> <first> <last> <step> [cols]
D=$1; OUT=$2; A=$3; B=$4; S=$5; COLS=${6:-8}
LIB=${LIB:-$HOME/lemo-opuscar}
F=""; for t in $(python3 -c "import sys;a,b,s=map(float,sys.argv[1:]);n=int(round((b-a)/s));print(' '.join(('%g'%round(a+i*s,3)) for i in range(n+1)))" $A $B $S); do f=$(ls $D/t_$t*.jpg 2>/dev/null | head -1); [ -n "$f" ] && F="$F $f"; done
$LIB/.venv/bin/python $LIB/core/render/sheet.py $OUT $F --cols $COLS --w 300 | tail -1
