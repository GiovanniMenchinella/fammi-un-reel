#!/bin/sh
# Costruisce il reel (1080x1920, 30 fps) dal progetto: sottotitoli → partitura → readcheck → eventi → cue suoni → render → mix suoni veri → mux → controlli.
# Uso: sh build.sh <cartella-progetto> <nome-uscita>      (es. sh build.sh ~/Downloads/reel/mio mio  → <progetto>/mio.mp4)
# Richiede nel progetto: vo.mp3 + vo-timing.json (voce) e contenuto.js scritto. Cancella out/part_*.mp4 per rifare il render.
set -e
[ -n "$2" ] || { echo "uso: sh build.sh <cartella-progetto> <nome-uscita>"; exit 1; }
HERE=$(cd "$1" && pwd); NOME=$2
[ -f "$HOME/.fammi-un-reel/percorsi.sh" ] && . "$HOME/.fammi-un-reel/percorsi.sh"   # percorsi scritti da setup.sh
LIB=${LIB:-$HOME/lemo-opuscar}
SL=${SL:-$HOME/opus-sound-layer}
CTRL=${CTRL:-$HOME/.fammi-un-reel/controlla.sh}
export SL="${SL:-$SOUND}" LIB PATH="/opt/homebrew/bin:$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
cd "$LIB"
echo "1/9 eventi + sottotitoli"; node core/render/events.mjs "$HERE" --size 1080x1920
python3 "$HERE/tools/srt_da_eventi.py" "$HERE" "$HERE/$NOME.srt"
echo "2/9 partitura";           .venv/bin/python "$HERE/music/score.py"
echo "3/9 musica + ambiente";   .venv/bin/python "$HERE/music/make_bed.py"
echo "4/9 readcheck (testi leggibili)"; node core/render/readcheck.mjs "$HERE" --size 1080x1920
echo "5/9 eventi (di nuovo, dopo eventuali correzioni)"; node core/render/events.mjs "$HERE" --size 1080x1920
echo "6/9 cue dei suoni";       python3 "$HERE/audio/make_cues.py"
echo "7/9 render immagine";     bash "$HERE/tools/render_parti.sh" "$HERE"
echo "8/9 mix suoni veri";      (cd "$SL" && uv run scripts/mix.py "$HERE/audio/cues.json" --out "$HERE/audio")
cd "$HERE"
echo "9/9 mux + controlli"
ffmpeg -v error -y -i out/video.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -maxrate 16M -bufsize 32M \
  -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart "$NOME.mp4"
(cd "$SL" && uv run scripts/qa.py "$HERE/$NOME.mp4" --audio "$HERE/audio")
DUR=$(python3 -c "import json;print(round(json.load(open('events.json'))['dur'],2))")
bash "$CTRL" "$HERE/$NOME.mp4" "$DUR" --audio
echo "FATTO: $HERE/$NOME.mp4"
