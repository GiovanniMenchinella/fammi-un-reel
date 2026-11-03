#!/bin/sh
# Stile Risograph (1080x1920, 24 fps): ricostruisce tutto con un comando.
#   sh build.sh <cartella-progetto> <nome-uscita>      es.  sh build.sh ~/reel/prova prova-v1
# La cartella-progetto = copia del pacchetto + vo.mp3 + vo-timing.json (+ scene.js, music/ancore.json, sottotitoli.json del nuovo reel).
# Serve: libreria Lemo-Opuscar (LIB), opus-sound-layer con libreria suoni gia' costruita (SOUND), ffmpeg 7+, uv.
set -e
HERE=$(cd "${1:?cartella del progetto}" && pwd)
NOME=${2:?nome dell uscita (senza .mp4)}
[ -f "$HOME/.fammi-un-reel/percorsi.sh" ] && . "$HOME/.fammi-un-reel/percorsi.sh"   # percorsi scritti da setup.sh
LIB=${LIB:-$HOME/lemo-opuscar}
SOUND=${SOUND:-${SL:-$HOME/opus-sound-layer}}
export SL="${SL:-$SOUND}" LIB PATH="/opt/homebrew/bin:$HOME/.cargo/bin:$PATH"
[ -f "$LIB/core/render/video.mjs" ] || { echo "imposta LIB sulla cartella della libreria"; exit 1; }
[ -f "$HERE/vo-timing.json" ] || { echo "manca vo-timing.json nel progetto"; exit 1; }
cd "$HERE"; mkdir -p out audio
python3 tools/subs.py                                                     # 1. sottotitoli dai tempi parola della voce
"$LIB/.venv/bin/python" "$LIB/core/render/srt.py" subs.json "$NOME.srt"
"$LIB/.venv/bin/python" music/score.py                                    # 2. partitura originale -> music/score.wav
cd "$LIB"
node core/render/readcheck.mjs "$HERE" --size 1080x1920                   # 3. tempi di lettura dei titoli
node core/render/events.mjs "$HERE" --size 1080x1920                      # 4. eventi della pagina (cue sonori) -> events.json
cd "$HERE"
python3 tools/cues.py                                                     # 5. audio/cues.json (fotogrammi dai tempi del film)
node tools/video_png.mjs "$HERE" --fps 24 --workers 2 --size 1080x1920 --out "$HERE/out/video.mp4"   # 6. render a blocchi
ffmpeg -y -loglevel error -i out/video.mp4 -vf format=yuv420p -c:v libx264 -preset medium -crf 17 -tune grain \
  -maxrate 16M -bufsize 32M -r 24 -an -movflags +faststart out/picture.mp4 && rm -rf out/video.mp4 out/chunks
cd "$SOUND" && uv run scripts/mix.py "$HERE/audio/cues.json" --out "$HERE/audio"   # 7. suoni veri + musica + voce, -14 LUFS
cd "$HERE"
ffmpeg -y -loglevel error -i out/picture.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest \
  -movflags +faststart "$NOME.mp4"                                        # 8. film finale
cd "$SOUND" && uv run scripts/qa.py "$HERE/$NOME.mp4" --audio "$HERE/audio" || true      # 9. controllo dei suoni
DURF=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$HERE/$NOME.mp4")
ffmpeg -y -loglevel error -ss "$(echo "$DURF * 0.67" | bc -l)" -i "$HERE/$NOME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "$HERE/$NOME.mp4"
