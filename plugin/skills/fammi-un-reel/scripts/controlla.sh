#!/usr/bin/env bash
# Controlli automatici (0 token) su un reel finito, con look.py di motionmaxxing (Apache-2.0).
#   bash controlla.sh <reel.mp4> [secondi attesi] [--audio]
# Scrive <reel>-look/ (sheet.jpg, cuts.txt, still.txt, gates.json) e stampa i GATES: G0 video valido, G2 niente fotogrammi
# piatti > 3 di fila, G3 schermata finale <= 1,4 s, piu' il volume. Un FAIL si corregge.
set -euo pipefail
[ -f "$HOME/.fammi-un-reel/percorsi.sh" ] && . "$HOME/.fammi-un-reel/percorsi.sh"
MM=${MM:-$HOME/motionmaxxing}
REEL="${1:?uso: controlla.sh <reel.mp4> [secondi] [--audio]}"; SEC="${2:-}"; AUD="${3:-}"
OUT="${REEL%.*}-look"
ARGS=(--out "$OUT"); [ -n "$SEC" ] && ARGS+=(--expect "$SEC"); [ "$AUD" = "--audio" ] && ARGS+=(--expect-audio)
# look.py scrive le etichette con drawtext: usa il primo ffmpeg che lo ha
for d in "$HOME/.local/bin" /opt/homebrew/bin /usr/local/bin /usr/bin; do
  if [ -x "$d/ffmpeg" ] && "$d/ffmpeg" -hide_banner -filters 2>/dev/null | grep -q drawtext; then PATH="$d:$PATH"; break; fi
done
python3 "$MM/scripts/look.py" "$REEL" "${ARGS[@]}"
