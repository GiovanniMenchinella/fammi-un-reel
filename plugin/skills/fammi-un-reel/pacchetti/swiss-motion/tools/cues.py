"""events.json (type 'sfx', timed by film.js from the picture's own curves) → audio/cues.json for opus-sound-layer mix.py.
Every sound id below was chosen by looking at `sfx.py browse` sheets (audio/browse/*.png). Frames are never typed: frame = round(t · fps).
Sonic family (swiss-motion): the print room (paper, typewriter keys, clock ticks, a short blade, cloth and wood thumps, a rubber stamp)
plus glass for the red (the client's own words). Heroes add a dry hit and a sub."""
import json, os, sys
# usage: python3 cues.py [project_dir] [voice_file=vo.mp3]   (project_dir defaults to the folder above tools/)
D = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__)) + '/..'
PROJ = D
VOICE = sys.argv[2] if len(sys.argv) > 2 else 'vo.mp3'
SL = os.environ.get('SL', os.path.expanduser('~/opus-sound-layer'))
KIT = SL + '/audio/kit'
FPS = 30
ev = json.load(open(f'{D}/events.json'))

ROT = {
    'whoosh': ['whoosh/fs-147285-fh-paper-swipe-surface2-shor-1'],
    'swish': ['swish/fs-14193-45-wav-1', 'swish/fs-14175-27-wav-2'],
    'swishSoft': ['swish/fs-14171-23-wav-1', 'swish/fs-14176-28-wav-3'],
    'key': ['key/fs-194795-vintage-keyboard-1-1', 'key/fs-194797-vintage-keyboard-3-1', 'key/fs-194796-vintage-keyboard-2-1', 'key/fs-194795-vintage-keyboard-1-2'],
    'tick': ['tick/fs-130388-clock-ticking-1', 'tick/fs-130388-clock-ticking-2', 'tick/fs-130388-clock-ticking-3'],
    'paper': ['paper/fs-151221-page-turn-2-2', 'paper/fs-442857-page-turn-1'],
    'paperSlide': ['paper/fs-484920-page-slides-1-3', 'paper/fs-397551-page-turn-04-wav-3'],
    'thump': ['thump/fs-389999-thump-cloth-1', 'thump/fs-264879-three-dull-thumps-with-hamme-3'],
    'tap': ['tap/fs-369710-wood-knock'],
    'tickMetal': ['tick/fs-185611-metal-tick-1-1'],
    'chime': ['chime/fs-404104-glass-ding-2', 'chime/fs-404104-glass-ding-1', 'chime/fs-127149-ding-wav-1'],
    'shimmer': ['chime/fs-404104-glass-ding-1'],
    'chimeThump': ['chime/fs-404104-glass-ding-3+thump/fs-389999-thump-cloth-1'],
    'thumpTap': ['thump/fs-389665-thump-close-wav-2+tap/fs-369710-wood-knock'],
    'stamp': ['tap/own-ov-c154424d+thump/fs-454222-thud-pint-glass-beer-down-on-1'],
    'hitBoom': ['hit/fs-266823-punch-impact-sound-wav-1+boom/fs-197462-kick-dubstep-kick-1'],
    'hit': ['swish/fs-14193-45-wav-1+hit/fs-241950-punches-and-hits-3'],
    'hitChime': ['hit/fs-266823-punch-impact-sound-wav-1+chime/fs-404104-glass-ding-3'],
}
SJ = json.load(open(f'{PROJ}/sounds.json')) if os.path.exists(f'{PROJ}/sounds.json') else {}
BY_ID = SJ.get('by_id', {})   # the big hits, each its own (content: sounds.json)
count = {}
cues = []
for e in ev['ev']:
    if e['type'] != 'sfx': continue
    k = e['kind']; i = count.get(k, 0); count[k] = i + 1
    snd = BY_ID.get(e['id']) or ROT[k][i % len(ROT[k])]
    c = {'id': e['id'], 'frame': int(round(e['t'] * FPS)), 'sound': snd, 'weight': e.get('w', 'support'), 'align': 'peak'}
    if e.get('vis'): c['visual'] = e['vis']
    if e.get('stop'): c['stop_before'] = True
    if e.get('build'): c['build'] = True
    if k in ('whoosh', 'swishSoft'): c['pan'] = -0.25 if i % 2 else 0.25
    cues.append(c)
    if e['id'] == 'dopo':   # a real reverse riser peaking on the drop
        cues.append({'id': 'riser', 'frame': c['frame'], 'sound': 'riser/fs-503801-reverse-fx-3-wav-1', 'weight': 'support', 'align': 'peak'})

out = {
    'fps': FPS, 'duration_s': round(ev['dur'], 3), 'energy': 'punchy', 'lufs': -14, 'kit': KIT,
    'room': False,                                   # the style wants dry, close foley: no shared reverb
    'music': {'file': os.path.abspath(f'{D}/music/score.wav'), 'start_s': 0, 'loop': False, 'fade_out_s': 0.3},
    'voice': [{'file': os.path.abspath(f'{D}/{VOICE}'), 'start_s': 0}],
    'duck_db': 10,
    'silence_ok': SJ.get('silence_ok', []),
    'cues': cues,
}
os.makedirs(f'{D}/audio', exist_ok=True)
json.dump(out, open(f'{D}/audio/cues.json', 'w'), indent=1)
print(len(cues), 'cues →', os.path.abspath(f'{D}/audio/cues.json'))
