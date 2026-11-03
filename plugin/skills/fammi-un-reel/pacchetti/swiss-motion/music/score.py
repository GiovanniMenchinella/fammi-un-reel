"""Original score, all synthesised with numpy (no samples). 120 BPM, D dorian, minimal / motorik. EDIT the section times (A0, B0, STOP, C0, D0...) to the new voice.
Sections follow the voice: A «il problema» (beat at 0.23 + k·0.5, hard hit on «tardi»), silence, B «la regola» (beat at 13.43),
hard stop at 41.93, «zitto» (foley only), riser, D (beat at 49.74, drop on «dopo») until the last frame.
Run: <LIB>/.venv/bin/python music/score.py  → music/score.wav
"""
import os, sys, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, add, lp, hp, bp, limit

rng = np.random.default_rng(2026)
_EV = json.load(open(os.path.join(HERE, '..', 'events.json')))
DUR = _EV['dur'] + .533; N = int(DUR * SR)   # film length + tail
ST = {k: np.zeros((N, 2)) for k in ['kick', 'perc', 'bass', 'mar', 'glk', 'fx', 'red']}
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
tt = lambda d: np.arange(int(d * SR)) / SR

# ---------------- instruments ----------------
def kick(v=1.0):
    t = tt(.42); f = 48 + 92 * np.exp(-t / .035); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / .16) + .35 * np.sin(2 * ph) * np.exp(-t / .06)
    x += hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / .002) * .25
    return x * v
def hat(v=1.0, open_=False):
    d = .22 if open_ else .05; t = tt(d)
    return hp(rng.standard_normal(len(t)), 7000, 4) * np.exp(-t / (.07 if open_ else .012)) * v
def clap(v=1.0):
    t = tt(.2); n = bp(rng.standard_normal(len(t)), 900, 3800); e = np.zeros(len(t))
    for o in (0, .009, .018): i = int(o * SR); e[i:] += np.exp(-(t[:len(t) - i]) / (.006 if o < .018 else .06))
    return n * e * .8 * v
def rim(v=1.0):
    t = tt(.06); return (np.sin(2 * np.pi * 1750 * t) * np.exp(-t / .012) + bp(rng.standard_normal(len(t)), 1500, 5000) * np.exp(-t / .004) * .5) * v
def crash(v=1.0):
    t = tt(1.6); return hp(rng.standard_normal(len(t)), 4500, 2) * np.exp(-t / .45) * .5 * v
def bass(m, d, v=1.0):
    t = tt(d + .06); f = hz(m); y = np.zeros(len(t))
    for k in range(1, 14):
        if k * f > 3200: break
        y += np.sin(2 * np.pi * k * f * t + .3 * k) / k * (1 / (1 + (k / 5.0) ** 2))
    y += .25 * np.sin(2 * np.pi * f * t)            # body
    env = np.minimum(1, t / .004) * (np.exp(-t / .22) * .6 + .4)
    env[t > d] *= np.exp(-(t[t > d] - d) / .02)
    return y * env * .5 * v
def marimba(m, v=1.0, d=None):
    f = hz(m); dec = .55 * (440 / f) ** .5; L = min(1.4, dec * 3); t = tt(L)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / dec) + .3 * np.sin(2 * np.pi * 3.93 * f * t) * np.exp(-t / (dec * .18)) \
        + .1 * np.sin(2 * np.pi * 9.2 * f * t) * np.exp(-t / (dec * .06))
    y += bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / .002) * .15
    return y * np.minimum(1, t / .0015) * v
def glock(m, v=1.0):
    f = hz(m); t = tt(2.2)
    y = sum(a * np.sin(2 * np.pi * r * f * t) * np.exp(-t / dd) for r, a, dd in [(1, 1, 1.3), (2.76, .45, .45), (5.4, .2, .2), (8.93, .08, .1)])
    return y * np.minimum(1, t / .001) * v
def riser(d, v=1.0):
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); hop = 512
    for i in range(0, len(t), hop):
        f = 400 + 6000 * (i / len(t)) ** 2
        s = bp(n[max(0, i - 2048):i + hop], f * .7, min(f * 1.4, 20000))[-min(hop, len(t) - i):]; out[i:i + len(s)] = s
    return out * (t / d) ** 2 * v

def put(stem, x, t, g=1.0, pan=0.0):
    if 0 <= t < DUR: add(ST[stem], x.astype(np.float64), t, g, pan)

# chord loop (2 bars each): Dm, Bb, F, C — bass roots and marimba ostinato tones
LOOP = [(38, [62, 69, 65, 69, 72, 69, 65, 69]), (34, [62, 70, 65, 70, 74, 70, 65, 70]), (41, [60, 69, 65, 69, 72, 69, 65, 69]), (36, [60, 67, 64, 67, 72, 67, 64, 67])]
def chord_at(t, t0):   # which loop entry at time t for a section starting at t0
    return LOOP[int((t - t0) // 4.0) % 4]

def groove(t0, t1, beat0, kick_on=True, clap_on=True, hats=2, bass_on=True, mar=True, kv=1.0, mv=1.0, bv=1.0):
    """bars from beat0, only events inside [t0, t1)"""
    nb = int(np.ceil((t1 - beat0) / .5)) + 1
    for b in range(-8, nb):
        tb = beat0 + b * .5
        bar_pos = b % 4
        for s16 in range(4):
            t = tb + s16 * .125
            if not (t0 <= t < t1): continue
            root, ost = chord_at(t, beat0)
            if s16 == 0 and kick_on and (bar_pos in (0, 2) or (bar_pos == 1 and b % 8 == 7)): put('kick', kick(.95 * kv), t, 1.0)
            if s16 == 2 and kick_on and bar_pos == 2: put('kick', kick(.6 * kv), t, 1.0)
            if s16 == 0 and clap_on and bar_pos in (1, 3): put('perc', clap(.7), t, .8, .05)
            if hats == 2 and s16 in (0, 2): put('perc', hat(.5 if s16 == 2 else .32), t, .55, .25)
            if hats == 4: put('perc', hat([.32, .2, .5, .22][s16]), t, .5, .25)
            if hats == 1 and s16 == 0: put('perc', hat(.25), t, .4, .25)
            if bass_on and s16 in (0, 2):
                m = root + (12 if (s16 == 2 and bar_pos == 3) else 0)
                put('bass', bass(m, .2, .85 if s16 == 0 else .7), t, .9 * bv, -.05)
            if mar:
                n = ost[(b * 2 + s16 // 2) % 8] if s16 % 2 == 0 else None
                if n: put('mar', marimba(n, .55 if s16 == 0 else .38), t, .55 * mv, .2 if (b % 2) else -.2)

# ---------------- A «il problema» : beat at 0.23 ----------------
A0, A1 = .23, 12.23
groove(A0, A1, A0, clap_on=False, hats=2, bass_on=False, mar=False, kv=.9)
for b in range(0, 24):   # rim on 2 and 4
    t = A0 + b * .5
    if b % 2 == 1 and t < A1: put('perc', rim(.8), t, .45, -.1)
groove(4.23, A1, A0, kick_on=False, clap_on=False, hats=0, bass_on=True, mar=False)
groove(8.23, A1, A0, kick_on=False, clap_on=False, hats=4, bass_on=False, mar=False)
# «tardi»: one hard hit, then nothing
put('kick', kick(1.2), A1, 1.1); put('bass', bass(26, 1.2, 1.0), A1, 1.2); put('perc', crash(.9), A1, .6, -.1)

# ---------------- B «la regola» : beat at 13.43 → hard stop 41.93 ----------------
B0, STOP = 13.43, 41.93
groove(B0, STOP, B0, kick_on=False, clap_on=False, hats=1, bass_on=False, mar=True, mv=.8)          # marimba alone
groove(17.43, STOP, B0, kick_on=True, clap_on=False, hats=0, bass_on=False, mar=False, kv=.7)
groove(21.43, STOP, B0, kick_on=False, clap_on=False, hats=2, bass_on=True, mar=False)
groove(25.43, STOP, B0, kick_on=False, clap_on=True, hats=0, bass_on=False, mar=False)
groove(29.43, STOP, B0, kick_on=False, clap_on=False, hats=4, bass_on=False, mar=False)
put('perc', crash(.7), 25.43, .5, .2); put('perc', crash(.6), 29.43, .4, -.2)
# glockenspiel on the questions (sparse, from the chord tones)
for t, m in [(29.98, 81), (30.71, 77), (31.29, 76), (32.22, 74), (33.50, 81), (34.99, 79), (37.10, 81), (38.84, 77), (39.50, 76), (40.12, 74), (40.91, 72)]:
    put('glk', glock(m, .7), t, .38, .3)
# hard stop: cut every stem at 41.93 with a 8 ms fade
i0 = int(STOP * SR); fade = np.linspace(1, 0, int(.008 * SR))
for k in ST:
    ST[k][i0:i0 + len(fade)] *= fade[:, None]; ST[k][i0 + len(fade):int(43.2 * SR)] = 0

# ---------------- C: after «zitto» the music is silent; a soft clock, then a riser into «dopo» ----------------
# after «zitto»: a soft bed while the client explains himself (bass pedal, sparse marimba, a quiet clock)
C0 = 43.27
for i in range(int((49.74 - 44.0) / .5)):
    t = 44.0 + i * .5
    put('perc', rim(.35), t, .22, .2)
    if i % 2 == 0: put('bass', bass(38 if t < 47.5 else 34, .9, .55), t, .8, -.05)
    put('mar', marimba([62, 69, 65, 69][i % 4], .32), t, .5, .2 if i % 2 else -.2)
D0 = 49.74
for i in range(8): put('perc', clap(.25 + .08 * i), D0 - 1.0 + i * .125, .25 + .04 * i, .05)

# ---------------- D: beat at 49.74 ----------------
END = DUR
groove(D0, 61.74, D0, kick_on=True, clap_on=True, hats=4, bass_on=True, mar=True)
put('kick', kick(1.2), D0, 1.1); put('perc', crash(1.0), D0, .6, .15)
# the pull-out (61.63): one bar without drums, back on «all'inizio» (62.24)
groove(61.74, 63.74, D0, kick_on=False, clap_on=False, hats=0, bass_on=True, mar=True, bv=.7)
put('kick', kick(1.2), 62.24, 1.1); put('perc', crash(.9), 62.24, .55, -.15)
groove(63.74, 69.74, D0, kick_on=True, clap_on=False, hats=2, bass_on=True, mar=True, kv=.8, mv=.8)
groove(62.74, 63.74, D0, kick_on=True, clap_on=True, hats=4, bass_on=False, mar=False)
put('perc', crash(.8), 66.74, .5, .2); put('kick', kick(1.1), 66.74, 1.0)
# last chord rings past the final frame
put('kick', kick(1.1), 69.74, 1.0); put('bass', bass(38, 1.2, .9), 69.74, 1.0)
for m, p in [(62, -.2), (69, 0), (74, .2), (77, .3)]: put('mar', marimba(m, .55), 69.74, .6, p)
put('glk', glock(86, .6), 69.74, .35, .3)

# ---------------- picture data: the modules' notes and the red's sine voice (from events.json) ----------------
EV = json.load(open(os.path.join(HERE, '..', 'events.json')))['ev']
def sine_glide(m0, m1, d, rel=.25):
    t = tt(d + rel); m = m0 + (m1 - m0) * np.clip(t / d, 0, 1) ** .7
    f = hz(m) * (1 + .004 * np.sin(2 * np.pi * 5.2 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.minimum(1, t / .02) * np.where(t < d, 1.0, np.exp(-(t - d) / (rel / 3)))
    return (np.sin(ph) + .12 * np.sin(2 * ph)) * env
def red_note(m):
    t = tt(1.2); f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .18 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / .2)) * np.minimum(1, t / .006) * np.exp(-t / .35)
def red_flow(a, b):
    b1 = a + 1.15; c = b1 + .25; d = b - a + .4; t = tt(d); T = a + t
    li = lambda x, p, q: np.clip((x - p) / (q - p), 0, 1)
    u = 13 * li(T, a, b1) + 17 * li(T, c, b)
    sc = [62, 64, 65, 67, 69, 71, 72, 74, 76, 77]
    m = np.interp(u / 30 * (len(sc) - 1), np.arange(len(sc)), sc)
    f = hz(m) * (1 + .004 * np.sin(2 * np.pi * 5.2 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
    pulse = .75 + .25 * np.cos(2 * np.pi * (u % 1)) ** 2
    env = np.minimum(1, t / .05) * np.minimum(1, np.maximum(0, d - t) / .35) * np.where((T > b1) & (T < c), .55, 1.0)
    return (np.sin(ph) + .1 * np.sin(2 * ph)) * pulse * env
for e in EV:
    ty, t = e['type'], e['t']
    if ty == 'note': put('mar', marimba(e['m'], .7), t, .7 * e.get('g', 1), float(rng.uniform(-.3, .3)))
    elif ty == 'redNote': put('red', red_note(e['m']), t, .5 * e.get('g', 1), .15)
    elif ty == 'redGlide': put('red', sine_glide(e['m0'], e['m1'], e['d']), t, .32 * e.get('g', 1), .15)
    elif ty == 'redFlow': put('red', red_flow(e['a'], e['b']), e['a'] - .3, .36 * e.get('g', 1), .15)

# ---------------- stems → score ----------------
mix = hp((ST['kick'] * .45 + ST['bass'] * .62).T, 38).T + ST['perc'] * .85 + ST['mar'] * .9 + lp(ST['glk'].T, 9000).T * .8 + ST['fx'] + ST['red']
mix = np.stack([limit(mix[:, c], .95) for c in range(2)], 1)
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('score.wav', round(DUR, 2), 's  rms %.1f dBFS  peak %.2f' % (db(mix), np.abs(mix).max()))
# low-end check: 20-120 Hz vs the rest
from scipy.signal import welch
f, P = welch(mix.mean(1), SR, nperseg=8192)
lo = P[(f >= 20) & (f < 120)].sum(); rest = P[(f >= 120) & (f < 8000)].sum()
print('low band vs rest: %.1f dB' % (10 * np.log10(lo / rest)))
