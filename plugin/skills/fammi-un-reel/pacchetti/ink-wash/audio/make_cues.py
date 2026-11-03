"""Write audio/cues.json for opus-sound-layer from the picture's own timing (events.json, exported by the page).
Frames are computed from the film's event times, never typed. One sonic family: paper, brush (bamboo air), wood, cloth, water, breath.
Run: python3 audio/make_cues.py"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.dirname(HERE)
KIT = os.path.join(os.environ.get('SL', os.path.expanduser('~/opus-sound-layer')), 'audio', 'kit')
EV = json.load(open(os.path.join(P, 'events.json')))
T = [e for e in EV['ev'] if e['type'] == 'marks'][0]['T']
FPS = 30
cat = {s['id'] for s in json.load(open(os.path.join(KIT, 'catalog.json')))['sounds']}

# ---- the sounds, chosen one by one with sfx.py browse (waveforms checked on browse.png) ----
STROKE = ['paper/fs-428338-underlining-stroke-on-paper-1']          # brush on paper
RUB = 'paper/fs-140463-packaging-paper-rub-sliding-1'                # the dry, scratchy stroke
PAGE = ['paper/fs-151221-page-turn-2-2', 'paper/fs-442857-page-turn-1']   # hard cuts = a page turned
AIR_PAPER = 'paper/fs-389442-paper-throw-into-air-fuller-3'          # ink lifting, a sheet of air
TINY = 'paper/fs-484920-page-slides-1-3'                            # ash flake
BAMBOO = ['whoosh/fs-60010-multi-swing-bamboo-staff-wea-1', 'whoosh/fs-60010-multi-swing-bamboo-staff-wea-2', 'whoosh/fs-60022-swosh-35-flac-1']   # the bamboo brush moving
BREATH = ['whoosh/fs-30241-swoop2g-flac-1', 'whoosh/fs-30240-swoop1-flac-1']   # mist, blooms
CLOTH = ['swish/fs-14176-28-wav-2', 'swish/fs-14176-28-wav-3', 'swish/fs-14179-31-wav-2']   # banners unfurling
CLOTH_THUMP = 'thump/fs-389999-thump-cloth-1'
SOFT = 'thump/fs-133282-thump-on-carpet-2'                           # steps
CLOSE = 'thump/fs-389665-thump-close-wav-2'
WOOD = 'tap/fs-369710-wood-knock'                                   # coin set down, keystone locking, seal
BODY_WOOD = 'thump/fs-675927-s03-22-two-body-falls-on-woo-2'         # the full stop (hero body)
STONE = 'thump/fs-264879-three-dull-thumps-with-hamme-1'             # the crack
TRUNK = 'hit/fs-550918-fxsa-sc-wood-tree-trunk-impa-3'               # the bridge breaks: wood on the ground (hero body)
STAMP = 'tap/own-ov-c154424d'                                       # a real rubber stamp on a desk (the seal)
BOOM_DEEP = 'boom/fs-636624-deep-hit-2'
BOOM_LOW = 'boom/fs-13862-10-wav-1'
REVERSE = 'reverse/fs-503805-reverse-fx-7-wav-1'                     # time rewinding
DROP = json.load(open(os.path.join(HERE, 'chosen.json')))['drop']     # water drops (Openverse CC0, added with sfx.py add)
SPLASH = json.load(open(os.path.join(HERE, 'chosen.json')))['splash']

cues = []; k = {}
def rot(lst, key): k[key] = k.get(key, -1) + 1; return lst[k[key] % len(lst)] if isinstance(lst, list) else lst
def cue(cid, t, sound, weight='support', visual=None, align='peak', pan=0.0, **kw):
    for s in sound.split('+'):
        if s not in cat and not os.path.exists(s): raise SystemExit(f'unknown sound {s}')
    c = dict(id=cid, frame=int(round(t * FPS)), sound=sound, weight=weight, align=align, pan=pan, **kw)
    if visual: c['visual'] = visual
    cues.append(c)

SLIDE = 'paper/fs-397550-page-turn-03-wav-2'                         # short bright paper slide (the coin, the fence, the underline)
n = 0; bn = -1
for e in EV['ev']:
    ty, t = e['type'], e.get('t')
    n += 1; cid = f'{ty}{n}'
    if ty == 'step': pass                                                      # steps sit under the voice: no sound
    elif ty == 'mist':
        if t > 49: cue(cid, t, AIR_PAPER)                                      # incense smoke → the river (in the pause after «dopo»)
        elif t > 7: cue(cid, t, rot(BREATH, 'br'))                             # smoke → mist (the first dissolve is carried by the score)
    elif ty == 'brush':
        tt = t + min(.12, e.get('dur', .3) * .4)
        if abs(t - T['title']) < .05 or abs(t - T['end18'] - .1) < .05: pass   # the titles soak in: no brush
        elif abs(t - T['price']) < .05: cue(cid, T['price'] + .45, WOOD, visual=None)              # the coin lands in the pause after «prezzo»
        elif abs(t - T['coin1']) < .05 or t > 66: cue(cid, tt, SLIDE, pan=.1)
        elif abs(t - T['try1']) < .05 or t > T['try3'] - .3 and t < 11: cue(cid, tt, RUB, pan=.15)   # first and last failed try (the second is under the voice)
        elif abs(t - T['ring']) < .05 or abs(t - T['repeat'] + .05) < .06: cue(cid, tt, STROKE[0], pan=.1)   # the empty ring, the retrace
        # other strokes sit under the narration and cannot be heard: no sound
    elif ty == 'tick':
        if t < 10: cue(cid, t, WOOD)                                           # the coin set down on the rock
    elif ty == 'cut':
        if abs(t - T['cut12']) > .05: cue(cid, t + .03, rot(PAGE, 'pg'), visual='cut')   # the cut into the silence stays silent
    elif ty == 'rewind': cue(cid, t + e.get('dur', .9) * .95, REVERSE)
    elif ty == 'scratch': cue(cid, t + .15, f'{STROKE[0]}+{RUB}', pan=.1)
    elif ty == 'bloom':
        if abs(t - T['lift']) < .1: cue(cid, t + .1, AIR_PAPER)                # «Quindi»: the ink lifts off the paper
        elif abs(t - T['x10a']) < .1: cue(cid, t + .3, 'transition/fs-234533-wet-transition-1')   # the story blooms out of the ring
        else: cue(cid, T['x5a'], DROP[0])                                     # the one sound inside the first silence: a drop
    elif ty == 'onestroke': cue('one', t + .1, f"{BOOM_LOW}+{BAMBOO[0]}+{STROKE[0]}", weight='hero', visual='move', stop_before=True)
    elif ty == 'air': cue(cid, t + .3, rot(BAMBOO, 'bb'), pan=.3)
    elif ty == 'banner':
        bn += 1
        if bn % 2 == 0: cue(cid, t + .1, f"{CLOTH_THUMP}+{rot(CLOTH, 'cl')}", pan=((bn // 2) % 3 - 1) * .35)   # every other banner, no cluster
    elif ty == 'drip':
        if t < 68: cue(cid, t, DROP[0])                                        # (the last drop sits under «privato»: picture only)
    elif ty == 'crack': cue(cid, t + .2, STONE)
    elif ty == 'collapse': cue('split', t + .02, f"{TRUNK}+{BOOM_DEEP}", weight='hero', visual='move', stop_before=True)
    elif ty == 'splash': cue(cid, t, SPLASH)
    elif ty == 'slam': cue('zitto', t + .02, f"{BODY_WOOD}+{BOOM_DEEP}", weight='hero', visual='move', stop_before=True)
    elif ty == 'spread': cue(cid, t + .2, 'transition/fs-234533-wet-transition-1')   # the ink spreads by itself, wet
    elif ty == 'join': cue(cid, t, TRUNK)                                      # the keystone locks: wood on wood
    elif ty == 'dissolve' and t > 58: cue(cid, T['fine18'] + .45, AIR_PAPER)   # the phrase evaporates (after the word «fine»)
    elif ty == 'dissolve' and t > 50: cue(cid, t + .2, rot(BREATH, 'br'))
    elif ty == 'seal': cue('sigillo', t + .03, f"hit/fs-550918-fxsa-sc-wood-tree-trunk-impa-2+{STAMP}+{WOOD}", weight='hero', visual='move', stop_before=True)
    # ignite, ash, ashland, splatter, paper, flood: carried by the score and the bed (no extra sound)

C = {
    'fps': FPS, 'duration_s': round(EV['dur'], 3), 'energy': 'calm', 'lufs': -14, 'kit': KIT,
    'room': {'decay_s': 0.6, 'wet_db': -16},
    'music': {'file': os.path.join(P, 'music', 'bed.wav'), 'start_s': 0, 'loop': False, 'fade_out_s': 0.4},
    'voice': [{'file': os.path.join(P, 'vo.mp3'), 'start_s': 0}],
    'duck_db': 4,
    'silence_ok': [[round(T['hush0'] - .05, 2), round(T['x5a'] + .25, 2)], [round(T['sil0'] - .05, 2), round(T['cut12'] + .1, 2)]],
    'cues': sorted(cues, key=lambda c: c['frame']),
}
json.dump(C, open(os.path.join(HERE, 'cues.json'), 'w'), indent=1)
print(len(cues), 'cues →', os.path.join(HERE, 'cues.json'))
