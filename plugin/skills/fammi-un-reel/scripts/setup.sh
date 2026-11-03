#!/bin/sh
# fammi-un-reel: installa (la prima volta) o aggiorna tutto quello che serve per fare i reel.
#   sh setup.sh            controlla gli strumenti, scarica le librerie, installa i pacchetti, scrive ~/.fammi-un-reel/percorsi.sh
#   sh setup.sh controlla  solo il controllo, non scarica niente
# Librerie pubbliche usate (scaricate dai loro GitHub, non copiate qui):
#   Lemo-Opuscar (MIT / CC BY 4.0)   https://github.com/lemomo-ai/lemo-opuscar        → render, campionatore musicale
#   opus-sound-layer (MIT, suoni CC0) https://github.com/Bodila51/opus-sound-layer    → suoni veri sul fotogramma
#   motionmaxxing (Apache-2.0)        https://github.com/Tejashmakwana/motionmaxxing  → controlli del video finito
# Cartelle: variabili LIB / SL / MM se gia' impostate, altrimenti cartelle esistenti trovate, altrimenti nella home.
set -e
CONF="$HOME/.fammi-un-reel"
mkdir -p "$CONF"
[ -f "$CONF/percorsi.sh" ] && . "$CONF/percorsi.sh"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

# --- 1. strumenti di sistema (non li installiamo da soli: li elenchiamo) ---
manca=""
command -v git >/dev/null || manca="$manca git"
command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || manca="$manca node(20+)"
if command -v ffmpeg >/dev/null; then
  v=$(ffmpeg -version | head -1 | sed -E 's/^ffmpeg version n?([0-9]+).*/\1/')
  case "$v" in ''|*[!0-9]*) ;; *) [ "$v" -ge 7 ] || manca="$manca ffmpeg(7+, ora $v)";; esac
else manca="$manca ffmpeg(7+)"; fi
command -v uv >/dev/null || manca="$manca uv"
command -v python3 >/dev/null || manca="$manca python3"
if [ -n "$manca" ]; then
  echo "✗ mancano:$manca"
  echo "  Mac:   brew install git node ffmpeg uv python@3.12"
  echo "  Linux: vedi README (ffmpeg 7+ statico da johnvansickle.com/ffmpeg)"
  exit 1
fi
echo "✓ strumenti di sistema ok"
[ "$1" = controlla ] && exit 0

# --- 2. Lemo-Opuscar: usa l'installatore della libreria stessa ---
trova() { for c in "$@"; do [ -d "$c" ] && { echo "$c"; return; }; done; echo "$1"; }
LIB=${LIB:-$(trova "$HOME/lemo-opuscar")}
if [ ! -f "$LIB/AGENTS.md" ]; then
  echo "↓ scarico Lemo-Opuscar in $LIB"
  git clone --quiet --depth 1 --filter=blob:none --sparse --branch main https://github.com/lemomo-ai/lemo-opuscar.git "$LIB"
fi
LEMO_OPUSCAR_HOME="$LIB" sh "$LIB/plugin/skills/lemo-opuscar/scripts/setup.sh" >/dev/null   # aggiorna + sparse
LEMO_OPUSCAR_HOME="$LIB" sh "$LIB/plugin/skills/lemo-opuscar/scripts/setup.sh" deps music
# strumenti musicali usati dalle partiture dei pacchetti (~350 MB, una volta sola)
for s in karoryfer vcsl; do
  [ -d "$LIB/core/audio/instruments/$s" ] || (cd "$LIB" && sh tools/fetch.sh instruments "$s")
done
echo "✓ Lemo-Opuscar: $LIB"

# --- 3. opus-sound-layer + libreria di suoni CC0 ---
SL=${SL:-$(trova "$HOME/opus-sound-layer" "$HOME/strumenti-esterni/opus-sound-layer")}
[ -d "$SL/.git" ] || git clone --quiet --depth 1 https://github.com/Bodila51/opus-sound-layer.git "$SL"
git -C "$SL" pull --quiet --ff-only 2>/dev/null || true
if [ ! -f "$SL/audio/kit/catalog.json" ]; then
  echo "↓ costruisco la libreria di suoni (qualche minuto, una volta sola)"
  (cd "$SL" && uv run scripts/sfx.py kit)
fi
echo "✓ suoni: $SL ($(ls "$SL/audio/kit" | wc -l | tr -d ' ') cartelle nel kit)"

# --- 4. motionmaxxing (controlli del video finito) ---
MM=${MM:-$(trova "$HOME/motionmaxxing")}
[ -d "$MM/.git" ] || git clone --quiet --depth 1 https://github.com/Tejashmakwana/motionmaxxing.git "$MM"
git -C "$MM" pull --quiet --ff-only 2>/dev/null || true
echo "✓ controlli: $MM"

# --- 5. percorsi per tutti gli script ---
QUI=$(cd "$(dirname "$0")" && pwd)
cat > "$CONF/percorsi.sh" <<EOF
# scritto da fammi-un-reel/scripts/setup.sh — si puo' modificare a mano
LIB="$LIB"
SL="$SL"
SOUND="$SL"
MM="$MM"
CTRL="$QUI/controlla.sh"
REEL_DIR="\${REEL_DIR:-$HOME/Downloads/reel}"
export LIB SL SOUND MM CTRL REEL_DIR
EOF
cp "$QUI/controlla.sh" "$CONF/controlla.sh"
echo "✓ percorsi in $CONF/percorsi.sh"

# --- 6. voce ---
if [ -n "$ELEVENLABS_API_KEY" ] || grep -q '^ELEVENLABS_API_KEY=.' "$CONF/chiavi.env" 2>/dev/null; then
  echo "✓ chiave voce presente"
else
  echo "! manca la chiave ElevenLabs per la voce: mettila in $CONF/chiavi.env come"
  echo "    ELEVENLABS_API_KEY=..."
  echo "    VOCE_ID=...        (facoltativo: la tua voce, anche clonata)"
  echo "  oppure usa la tua registrazione con --voce-da (vedi SKILL.md)."
fi
echo "PRONTO"
