#!/bin/sh
# Build a swiss-motion reel (1080x1920, 30 fps):  sh build.sh [PROJECT_DIR=this folder] [NAME=reel]   ->  PROJECT_DIR/NAME.mp4 (+ NAME.srt, poster.jpg)
# PROJECT_DIR holds engine.js, scene.js, vo.mp3, vo-timing.json, tools/, music/, fonts/. Optional env: LIB, SL, VOICE (default vo.mp3), POSTER_T (poster second, default 3)
set -e
HERE=$(cd "${1:-$(dirname "$0")}" && pwd); NAME=${2:-reel}
[ -f "$HOME/.fammi-un-reel/percorsi.sh" ] && . "$HOME/.fammi-un-reel/percorsi.sh"   # percorsi scritti da setup.sh
LIB=${LIB:-$HOME/lemo-opuscar}
SL=${SL:-$HOME/opus-sound-layer}
VOICE=${VOICE:-vo.mp3}; POSTER_T=${POSTER_T:-3}
export SL="${SL:-$SOUND}" LIB PATH="/opt/homebrew/bin:$HOME/.cargo/bin:$PATH"          # ffmpeg 7+, uv
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; SZ="--size 1080x1920"
mkdir -p "$HERE/out"; cd "$LIB"
node core/render/events.mjs "$HERE" $SZ                                   # 1. timeline -> events.json (sound cues, music data, subtitle cues)
"$PY" "$HERE/tools/subs.py" "$HERE"                                       # 2. subtitle holds asserted -> out/subs.json
"$PY" core/render/srt.py "$HERE/out/subs.json" "$HERE/$NAME.srt"
node core/render/readcheck.mjs "$HERE" $SZ                                # 3. every label stays long enough to read
"$PY" "$HERE/music/score.py"                                              # 4. original score (numpy) -> music/score.wav
python3 "$HERE/tools/cues.py" "$HERE" "$VOICE"                            # 5. sound cues -> audio/cues.json (ids in sounds.json)
node core/render/video.mjs "$HERE" --fps 30 --workers 2 $SZ --out "$HERE/out/video.mp4"   # 6. frames -> video (muted)
(cd "$SL" && uv run scripts/mix.py "$HERE/audio/cues.json" --out "$HERE/audio")          # 7. voice + ducked score + real sounds, -14 LUFS
ffmpeg -y -loglevel error -i "$HERE/out/video.mp4" -i "$HERE/audio/mix.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -b:v 12M -maxrate 16M -bufsize 24M \
  -pix_fmt yuv420p -r 30 -c:a aac -b:a 256k -shortest -movflags +faststart "$HERE/$NAME.mp4"
(cd "$SL" && uv run scripts/qa.py "$HERE/$NAME.mp4" --audio "$HERE/audio")    # 8. sound QA on the final file
node core/render/still.mjs "$HERE" "$POSTER_T" $SZ --out "$HERE/out/poster" --prefix p_ && cp "$HERE/out/poster/p_$POSTER_T.jpg" "$HERE/poster.jpg"
