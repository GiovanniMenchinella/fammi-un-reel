"""Cue sheet per opus-sound-layer dai tempi del film: legge events.json (esportato dalla pagina con core/render/events.mjs:
ogni cue 'sfx' nasce in film.js dal tempo dell'azione che lo provoca) e scrive audio/cues.json. Nessun fotogramma scritto a mano."""
import json, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = json.load(open(os.path.join(D, 'events.json')))
FPS = 24
KIT = os.path.join(os.environ.get('SL', os.path.expanduser('~/opus-sound-layer')), 'audio', 'kit')
cues = []
for e in E['ev']:
    if e['type'] != 'sfx': continue
    c = {'id': e['id'], 'frame': int(round(e['t'] * FPS)), 'sound': e['sound'], 'weight': e.get('weight', 'support'), 'align': 'peak'}
    for k in ('visual', 'pan', 'stop_before', 'build'):
        if k in e: c[k] = e[k]
    cues.append(c)
# silenzio voluto: il cue che ha 'silence_from' (secondo d'inizio) fissa la finestra [silence_from, quel cue - 0.9 s]
sil = [(e['silence_from'], next(c for c in cues if c['id'] == e['id'])) for e in E['ev'] if e.get('silence_from') is not None]
C = {
    'fps': FPS, 'duration_s': E['dur'], 'energy': 'punchy', 'lufs': -14, 'kit': KIT,
    'room': {'decay_s': .35, 'wet_db': -20},
    'music': {'file': os.path.join(D, 'music', 'score.wav'), 'start_s': 0, 'loop': False, 'fade_out_s': .3},
    'voice': [{'file': next(os.path.join(D, f) for f in ('vo.mp3', 'vo.wav', 'vo.m4a') if os.path.exists(os.path.join(D, f))), 'start_s': 0}],
    'duck_db': 7,
    'silence_ok': [[round(a, 2), round(c['frame'] / FPS - .9, 2)] for a, c in sil],
    'cues': cues,
}
json.dump(C, open(os.path.join(D, 'audio', 'cues.json'), 'w'), indent=1, ensure_ascii=False)
print(len(cues), 'cue →', os.path.join(D, 'audio', 'cues.json'), '| eroi:', [c['id'] for c in cues if c['weight'] == 'hero'])
