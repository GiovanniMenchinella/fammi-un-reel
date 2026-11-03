#!/bin/bash
# Render dell'immagine in parti da ~17,5 s (browser fresco per ognuna, 3 tentativi), poi unione senza perdite → out/video.mp4
# Uso: tools/render_parti.sh <progetto>   (da lanciare con LIB = libreria lemo-opuscar)
set -u
P=$(cd "$1" && pwd); LIB=${LIB:-$HOME/lemo-opuscar}; export PATH="/opt/homebrew/bin:$PATH"
cd "$LIB"; mkdir -p "$P/out"
DUR=$(python3 -c "import json;print(json.load(open('$P/events.json'))['dur'])")
N=$(python3 -c "import math;print(max(1,math.ceil($DUR/17.5)))")
: > "$P/out/parts.txt"
for ((i=0;i<N;i++)); do
  a=$(python3 -c "print(round($i*$DUR/$N,3))"); Q="t0=$a"
  [ $i -lt $((N-1)) ] && Q="$Q&t1=$(python3 -c "print(round(($i+1)*$DUR/$N,3))")"
  out="$P/out/part_$i.mp4"
  if [ ! -s "$out" ]; then
    for try in 1 2 3; do
      echo "parte $i ($Q) tentativo $try"
      node core/render/video.mjs "$P" --fps 30 --workers 2 --size 1080x1920 --q "$Q" --out "$out" && break
      rm -f "$out"
    done
  fi
  [ -s "$out" ] || { echo "PARTE $i FALLITA"; exit 1; }
  echo "file 'part_$i.mp4'" >> "$P/out/parts.txt"
done
ffmpeg -v error -y -f concat -safe 0 -i "$P/out/parts.txt" -c copy "$P/out/video.mp4" && echo "UNITO $(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$P/out/video.mp4") fotogrammi"
