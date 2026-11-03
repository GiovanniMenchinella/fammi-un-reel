"""Original score for «Ci devo pensare» (70.07 s), cued to the words of the voice (timings read from events.json → marks).
Guqin = core/audio/pluck.py 'guqin' (open strings, slides, vibrato, harmonics, sweeps); xiao = synthesised breathy end-blown flute;
big drum = gran_cassa (VCSL), low toms for the banners, frame drum for the pulse, gong2 small for the seal. D gong pentatonic (D E F# A B).
Run from the library root: .venv/bin/python <project>/music/score.py  → music/score.wav (48 kHz stereo) + stems/."""
import sys, os, json
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

HERE = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(os.path.join(HERE, '..', 'events.json')))
T = [e for e in EV['ev'] if e['type'] == 'marks'][0]['T']
DUR = EV['dur']; N = int(DUR * SR) + SR
S.seed(5); np.random.seed(5); rng = np.random.default_rng(5)
st = {k: np.zeros((N, 2), np.float32) for k in ('guqin', 'xiao', 'drums', 'low')}

def G(t, pitch, dur=None, vel=.6, pan=0., gain=1., **kw):
    add(st['guqin'], P.pluck('guqin', pitch, dur, vel, **kw), t, gain, pan)
def H(t, pitch, vel=.5, pan=0., gain=1., dur=1.4, **kw):
    G(t, pitch, dur, vel, pan, gain, harmonic=True, **kw)
def SW(t, pitches, dur=3., vel=.8, gain=1., spread=.012, up=False):
    add(st['guqin'], P.strum('guqin', pitches, dur, vel, spread=spread, up=up), t, gain, 0)
def D(t, inst, var, vel=.8, gain=1., pan=0., dur=None, env=None):
    x = S.hit(inst, var, vel, dur).astype(np.float64)
    if env is not None: x = x[:len(env)] * env[:len(x)]
    add(st['drums'], x.astype(np.float32), t, gain, pan)
def hz(p): return 440 * 2 ** ((S.midi(p) - 69) / 12)
def xiao(t, pitch, dur, vel=.5, pan=-.15, gain=1., att=.45, vib=.0):
    """breathy end-blown flute: soft fundamental + weak 2nd/3rd partials + band-passed breath following the envelope"""
    n = int((dur + .6) * SR); tt = np.arange(n) / SR; f = hz(pitch)
    vibr = 1 + (.006 + vib) * np.sin(2 * np.pi * 4.8 * tt) * np.clip((tt - .5) / .6, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vibr) / SR
    env = np.clip(tt / att, 0, 1) ** 1.6 * np.clip((dur + .6 - tt) / .6, 0, 1)
    tone = np.sin(ph) + .22 * np.sin(2 * ph + .3) + .08 * np.sin(3 * ph + .7)
    br = sosfilt(butter(2, [max(200, f * .8), min(9000, f * 4)], 'band', fs=SR, output='sos'), rng.standard_normal(n))
    y = (tone * .55 + br * .5 * (.6 + .4 * env)) * env * vel
    y = sosfilt(butter(2, 3200, 'low', fs=SR, output='sos'), y)
    add(st['xiao'], y.astype(np.float32), t, gain, pan)
def boom(t, f0=48, dur=2.6, gain=1.):
    n = int(dur * SR); tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * (f0 + 40 * np.exp(-tt / .06)) * tt) * np.exp(-tt / (dur * .35))
    y += .35 * np.sin(2 * np.pi * 2 * f0 * tt) * np.exp(-tt / (dur * .2))      # 2nd harmonic so it speaks on phones
    add(st['low'], y.astype(np.float32), t, gain, 0)

# ---------------- 1 the mist (free time) ----------------
G(0.0, 'D2', None, .55, 0, .9)
H(.45, 'A5', .4, .25, .7)
G(.56, 'A3', 1.2, .45, .1, .8)
G(T['hookMist'], 'A3', 1.6, .55, -.05, .95, bend=[(0, 0), (.25, 0), (1.2, -3)])       # «ci devo pensare»: sinking slide
H(T['gone'], 'B5', .35, -.3, .6, dur=2.0)
xiao(2.2, 'F#4', 2.3, .38, -.2, .8, att=.8)
G(T['coin1'], 'D2', 1.6, .6, 0, .9); G(T['coin1'], 'E3', .5, .45, .1, .6)
# ---------------- 2 incense: the hard cut, time rewinds ----------------
D(T['cut2'], 'gran_cassa', 'hit', .55, .55)
G(T['cut2'], 'D2', 1.8, .7, 0, 1.0)
H(T['ashFall'] + .05, 'E6', .3, .3, .45, dur=.8)
for i, p in enumerate(['A4', 'B4', 'D5', 'E5', 'F#5', 'A5']):
    H(T['rewind'] + i * .13, p, .38 + i * .03, -.3 + i * .12, .7, dur=1.0)
xiao(T['x3a'] - .1, 'A4', 2.2, .4, -.1, .8, att=.7)
# ---------------- 3–4 the tries, the dry brush ----------------
for (tt, p, b) in [(T['try1'], 'E3', -1), (T['try2'], 'F#3', -1), (T['try3'], 'A3', -2)]:
    G(tt, p, .9, .48, .15, .85, bend=[(0, 0), (.3, 0), (.8, b)])
G(T['dip'] - .25, 'D2', 1.4, .55, 0, .85)
G(T['dry'], 'B2', .35, .5, 0, .7, pos=.05)                                      # muted, dull: no ink left
# ---------------- 5 the title, ONE stroke ----------------
H(T['title'], 'D5', .42, -.2, .7, dur=1.6); H(T['title'] + .45, 'F#5', .38, .2, .6, dur=1.4)
SW(T['one'] + .4, ['D2', 'A2', 'D3', 'E3', 'F#3', 'A3', 'D4'], 3.5, .7, .9, spread=.008)
# (the stroke's impact is a real recording in the sound layer)
# ---------------- 6–7 the client, the empty ring, advertising ----------------
G(T['client'], 'A3', 1.4, .45, .05, .8, bend=[(0, -2), (.25, 0)])
xiao(T['client'] + .2, 'D4', 3.6, .36, -.25, .75, att=1.0)
H(T['ring'], 'B4', .42, .3, .75, dur=2.2)
G(T['why6'], 'F#3', 1.6, .42, 0, .75, vib=(4.5, .2, .4))
b = 60 / 84
tt, i = T['finche'], 0
while tt < T['pubEnd']:
    k = (tt - T['finche']) / (T['pubEnd'] - T['finche'])
    D(tt, 'frame_drum', 'large_muted', .35 + .4 * k, .45 + .4 * k, .1 * (1 if i % 2 else -1))
    G(tt, ['D2', 'A2'][i % 2], .4, .3 + .25 * k, 0, .55 + .3 * k)
    tt += b / (1 + k); i += 1
nr = int((T['pubEnd'] - T['tu'] + .2) * SR)
D(T['tu'] - .2, 'gran_cassa', 'roll', .8, 1.0, 0, env=np.linspace(.05, 1, nr) ** 2)
D(T['pubEnd'], 'gran_cassa', 'hit', .9, .9)
# ---------------- 8–9 Quindi: emptiness, two drops, the first question ----------------
H(T['lift'], 'D6', .42, 0, .7, dur=2.2)
G(T['lift'] + .05, 'A2', 2.5, .35, 0, .6)
H(T['lit'], 'A5', .32, -.3, .55, dur=1.2)
G(T['drop1'] + .26, 'D4', 1.2, .55, -.15, .9); G(T['drop2'] + .38, 'A4', 1.2, .55, .15, .9)
bq = 60 / 70
tt = T['q1']
while tt < T['x10a'] - .1:
    D(tt, 'frame_drum', 'small_muted', .3, .38, .1); tt += bq
for tt, p in [(T['q1'], 'D4'), (T['q1text'], 'E4'), (T['q1text'] + .73, 'F#4'), (T['q1text'] + 1.31, 'A4'), (T['q1text'] + 1.85, 'F#4'), (T['q1text'] + 2.24, 'E4')]:
    G(tt, p, .8, .5, .1, .8)
xiao(T['q1text'], 'A4', 2.6, .3, -.25, .6, att=1.2)
# ---------------- 10 the bridge breaks; the story paints itself ----------------
G(T['crack'], 'D2', 1.0, .5, 0, .7, bend=[(0, 0), (.2, 0), (.8, -4)])
# (the bridge breaking is a real recording in the sound layer)
for i, (dt, p) in enumerate([(0, 'A3'), (.45, 'B3'), (.9, 'D4'), (1.35, 'B3')]):
    G(T['tell'] + dt, p, .9, .45, .1 * (-1) ** i, .75)
G(T['succ'] + .4, 'D2', 1.6, .5, 0, .8, bend=[(0, 0), (.3, 0), (1.4, -3)])
# ---------------- 11 second question; six months; the flood ----------------
G(T['q2'], 'D4', .9, .5, -.1, .85); G(T['q2'] + .3, 'A4', 1.0, .5, .1, .85)
H(T['six'], 'F#5', .42, -.25, .7, dur=1.4); H(T['six'] + .3, 'A5', .38, 0, .6, dur=1.2)
H(T['same'], 'B5', .42, .25, .7, dur=1.2); H(T['same'] + .3, 'D6', .38, 0, .6, dur=1.0)
nf = int((T['sil0'] - T['what'] + .1) * SR)
D(T['what'] - .05, 'gran_cassa', 'roll_fast', .85, 1.1, 0, env=np.linspace(.15, 1, nf) ** 1.5)
for k in range(3): D(T['what'] + k * .27, 'toms', 'low_mallet', .6 + .1 * k, .5, (-.3, .3, 0)[k])
G(T['what'], 'D2', 1.0, .7, 0, .9, bend=[(0, 0), (.5, -2)])
# ---------------- 12 silence → «stai»: the strong moment ----------------
# (the full stop's impact is a real recording in the sound layer; the score gives the strings and the gong tail)
SW(T['slam'] + .32, ['D2', 'A2', 'D3', 'E3', 'F#3', 'A3', 'D4'], 4.0, .85, 1.1, spread=.006)
D(T['slam'] + .35, 'gong2', 'big', .5, .4)
# ---------------- 13 the ink moves by itself: harmonics, then the chord on «servi» ----------------
for tt, p in [(T['self'], 'D5'), (T['spread'], 'F#5'), (T['explain'], 'A5'), (T['explain'] + .49, 'B5'), (T['serve'] - .44, 'D6')]:
    H(tt, p, .45, (S.midi(p) - 80) * .05, .8, dur=1.8)
xiao(T['self'], 'A4', 3.0, .3, -.2, .6, att=1.0)
SW(T['serve'], ['D3', 'A3', 'D4', 'F#4', 'A4'], 3.2, .55, .9, spread=.03, up=True)
G(T['serve'], 'D2', 2.5, .5, 0, .8)
# ---------------- 14 incense, later ----------------
G(T['cut14'], 'A2', 1.6, .5, 0, .8)
xiao(T['cut14'] + .2, 'E4', 2.8, .34, -.2, .7, att=.9)
G(T['later'] - .2, 'B2', 1.6, .42, 0, .7)
H(T['dopo'], 'E5', .35, .2, .6, dur=1.2)
# ---------------- 15–17 the price; the repeat (the client's motif played back); the step ----------------
G(T['price'], 'D3', 1.2, .55, 0, .85); G(T['price'] + .42, 'A3', .3, .35, .1, .5, pos=.05)
G(T['nodef'], 'E3', .4, .35, 0, .5, pos=.05)
for i, p in enumerate(['D4', 'F#4', 'A4', 'B4', 'D5']):
    G(T['repeat'] + i * .29, p, .9, .5, -.2 + i * .1, .8)
G(T['ask'] + .26, 'A4', 1.2, .5, -.1, .85)
D(T['decide'] - .05, 'frame_drum', 'small_muted', .3, .35); D(T['decide'] + .45, 'frame_drum', 'small_muted', .3, .35)
G(T['decide'], 'F#3', .8, .45, 0, .75); G(T['decide'] + .5, 'A3', 1.2, .45, 0, .75)
# ---------------- 18 the phrase returns and evaporates ----------------
G(T['end18'], 'A3', 1.6, .5, -.05, .85, bend=[(0, 0), (.25, 0), (1.2, -3)])
xiao(T['end18'] + .3, 'F#4', 2.2, .32, -.2, .65, att=.8)
for i, p in enumerate(['A5', 'F#5', 'E5', 'D5']):
    H(T['evap'] + .3 + i * .3, p, .36 - i * .05, .3 - i * .2, .6, dur=1.0)
G(T['fine18'], 'B2', 1.2, .45, 0, .75)
# ---------------- 19 the seal on «all'inizio» ----------------
D(T['seal'] + .25, 'gong2', 'small', .4, .4, .1)
G(T['seal'] + .3, 'D2', 2.5, .55, 0, .85); H(T['seal'] + .3, 'D5', .45, 0, .8, dur=3.0)
# ---------------- 20 resolution ----------------
mel = [(T['cta'], 'A3'), (T['cta'] + .73, 'B3'), (T['cta'] + 1.41, 'D4'), (T['cta'] + 2.21, 'E4'), (T['commenta'], 'F#4'), (T['domande'], 'A4'), (T['domande'] + .92, 'F#4'), (T['privato'], 'E4'), (T['privato'] + .55, 'D4')]
for tt, p in mel: G(tt, p, 1.2, .5, .05, .82, vib=(4.2, .15, .5) if p in ('A4', 'D4') else None)
H(T['domande'], 'A5', .45, .2, .7, dur=2.0)
xiao(T['cta'] + .2, 'D4', 2.6, .3, -.25, .6, att=1.2); xiao(T['commenta'], 'A4', 2.4, .3, -.25, .6, att=1.0)
G(T['privato'] + .55, 'D2', 3.0, .5, 0, .8)
H(T['privato'] + .9, 'D6', .35, 0, .6, dur=2.2)

# ---------------- reverb, silences, bus ----------------
st['guqin'] = S.room(st['guqin'], size=.5, mix=.2); st['xiao'] = S.room(st['xiao'], size=.62, mix=.3)
st['drums'] = S.room(st['drums'], size=.55, mix=.16)
def gate(x, a, b2, fade=.03):
    ia, ib, nf2 = int(a * SR), int(b2 * SR), int(fade * SR)
    x[ia - nf2:ia] *= np.linspace(1, 0, nf2, dtype=np.float32)[:, None]; x[ia:ib] = 0
for e in EV['ev']:
    if e['type'] == 'silence':
        for k in st: gate(st[k], e['t0'], e['t1'])
BUS = {'guqin': 1.0, 'xiao': 1.4, 'drums': .9, 'low': .7}
mix = sum(st[k] * g for k, g in BUS.items())[:int(DUR * SR)]
mix[-int(.3 * SR):] *= np.linspace(1, 0, int(.3 * SR), dtype=np.float32)[:, None]
pk = np.abs(mix).max(); sc = 10 ** (-1.2 / 20) / pk if pk > 0 else 1
mix *= sc
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
for k, g in BUS.items(): sf.write(os.path.join(HERE, 'stems', f'{k}.wav'), (st[k][:int(DUR * SR)] * g * sc).astype(np.float32), SR, subtype='FLOAT')
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
def rms_db(a, b2): s = mix[int(a * SR):int(b2 * SR)]; return round(float(20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-12)), 1)
print('score.wav', round(len(mix) / SR, 2), 's  peak', round(float(20 * np.log10(np.abs(mix).max())), 2), 'dBFS')
for n, (a, b2) in {'mist': (0, 4.8), 'tries': (7.9, 12.7), 'title/one': (13.4, 16.5), 'banners': (21.5, 25.6), 'q1': (29, 33), 'flood': (40.6, 41.5), 'silence': (41.6, 42.15), 'slam': (42.9, 44.4), 'end': (63.4, 70)}.items():
    print(f'{n:10s} {rms_db(a, b2):7.1f} dB')
