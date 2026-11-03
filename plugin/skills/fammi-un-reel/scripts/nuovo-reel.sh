#!/bin/sh
# Crea il progetto di un reel da un PACCHETTO DI STILE + voce.
#   sh nuovo-reel.sh <stile> <nome> <copione.txt> [--voce <voice_id>] [--modello <model_id>] [--voce-da <cartella>]
# Copione: una frase per riga (ogni riga = una battuta della voce).
# Voce: ElevenLabs con la TUA chiave (ELEVENLABS_API_KEY nell'ambiente o in ~/.fammi-un-reel/chiavi.env, mai stampata).
#   --voce-da <cartella>: usa vo.mp3 + vo-timing.json gia' fatti (per esempio una tua registrazione allineata).
# Uscita: $REEL_DIR/<nome>/  (predefinito ~/Downloads/reel/<nome>/)
set -e
QUI=$(cd "$(dirname "$0")" && pwd); SKILL=$(cd "$QUI/.." && pwd)
CONF="$HOME/.fammi-un-reel"
[ -f "$CONF/percorsi.sh" ] || { echo "Prima l'installazione: sh \"$QUI/setup.sh\""; exit 1; }
. "$CONF/percorsi.sh"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
[ $# -ge 3 ] || { echo "uso: nuovo-reel.sh <stile> <nome> <copione.txt> [--voce id] [--modello id] [--voce-da dir]"; exit 1; }
STILE=$1; NOME=$2; COPIONE=$3; shift 3
VOCE_DA=""; VOCE=""; MODELLO="eleven_multilingual_v2"
while [ $# -gt 0 ]; do case "$1" in --voce-da) VOCE_DA=$2; shift 2;; --voce) VOCE=$2; shift 2;; --modello) MODELLO=$2; shift 2;; *) shift;; esac; done
PACK="$SKILL/pacchetti/$STILE"
[ -f "$PACK/SCHEDA.md" ] || PACK="$CONF/pacchetti/$STILE"   # pacchetti fatti da te
[ -f "$PACK/SCHEDA.md" ] || { echo "Lo stile '$STILE' non ha un pacchetto. Pacchetti: $(ls "$SKILL/pacchetti" "$CONF/pacchetti" 2>/dev/null | grep -v : | tr '\n' ' ')"; echo "→ altri stili arrivano con gli aggiornamenti del plugin"; exit 2; }
PROG="$REEL_DIR/$NOME"
[ -e "$PROG" ] && { echo "esiste gia': $PROG"; exit 1; }
mkdir -p "$PROG"; cp -R "$PACK/." "$PROG/"; cp "$COPIONE" "$PROG/COPIONE.txt"

if [ -n "$VOCE_DA" ]; then
  cp "$VOCE_DA/vo.mp3" "$VOCE_DA/vo-timing.json" "$PROG/"
else
  # chiave e voce: ambiente, poi chiavi.env (la chiave non viene mai scritta nel progetto)
  [ -f "$CONF/chiavi.env" ] && { set -a; . "$CONF/chiavi.env"; set +a; }
  [ -n "$ELEVENLABS_API_KEY" ] || { echo "✗ manca ELEVENLABS_API_KEY (mettila in $CONF/chiavi.env) oppure usa --voce-da"; rm -rf "$PROG"; exit 1; }
  VOCE=${VOCE:-${VOCE_ID:-JBFqnCBsd6RMkjVDRZzb}}   # predefinita: voce standard di ElevenLabs, disponibile su ogni account
  W="$PROG/.voce"; mkdir -p "$W/src/v"
  python3 - "$COPIONE" "$VOCE" "$MODELLO" "$W/src/v/script.json" <<'PY'
import json, sys
righe = [r.strip() for r in open(sys.argv[1], encoding="utf-8") if r.strip()]
n = len(righe)
json.dump({"voice": sys.argv[2], "model": sys.argv[3], "fps": 30,
           "settings": {"stability": 0.5, "similarity_boost": 0.8},
           "lines": [{"id": f"S{i+1:02d}", "label": t[:40], "text": t, "lead": 0.25 if i == 0 else 0.1,
                      "tail": 1.4 if i == n - 1 else 0.18} for i, t in enumerate(righe)]},
          open(sys.argv[4], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
PY
  (cd "$W" && ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY" node "$QUI/vo.mjs" --slug v)
  cp "$W/src/v/vo-timing.json" "$PROG/"; cp "$W/public/v/vo.mp3" "$PROG/"
fi
echo "progetto: $PROG"
python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print('voce: %.1f s, %d frasi, %d parole' % (d['totalSeconds'], len(d['scenes']), len(d['words'])))" "$PROG/vo-timing.json"
