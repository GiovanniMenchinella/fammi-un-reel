"""Partitura del reel Risograph (esempio: jazz da caffè lo-fi, Re dorico / Fa maggiore, ~100 bpm con mappa del tempo; ancore in ancore.json).
I colpi principali cadono sulle parole: CI (aggancio), tardi, Quindi, zitto, Ma la parte, all'inizio, DOMANDE.
Strati come lastre: Rhodes + contrabbasso → + spazzole → + vibrafono e shaker → silenzio → pad → + fischio → tutto + glockenspiel.
Strumenti: jazz_bass (Karoryfer, CC0), vibraphone / vibraphone_bowed / glockenspiel / snare2 / hihat / shaker (VCSL, CC0); Rhodes, fischio, spazzole e cassa in sintesi.
Uscita: music/score.wav (48 kHz stereo)."""
import os, sys, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(HERE)
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, lp, hp, bp

S.seed(11)
rng = np.random.default_rng(5)
VT = json.load(open(os.path.join(D, 'vo-timing.json')))
WD = {}
for w in VT['words']: WD.setdefault(w['scene'], []).append(w['start'])
DUR = 70.07
N = int((DUR + .5) * SR)

# ANCORE: ogni voce = (parola, battito). Le parole si indicano come 'scena:indice' in music/ancore.json (contenuto del reel)
ANC = json.load(open(os.path.join(HERE, 'ancore.json')))
def wd(ref, off=0.):
    s, i = ref.split(':'); return WD[s][int(i)] + off
AN = [(wd(r), b) for r, b in ANC['an']]
def bt(b):
    for (t0, b0), (t1, b1) in zip(AN, AN[1:]):
        if b <= b1 or (t1, b1) == AN[-1]:
            return t0 + (b - b0) * (t1 - t0) / (b1 - b0)
def spb(b):  # secondi per battito attorno a b
    return bt(b + .5) - bt(b - .5)

stems = {k: np.zeros((N, 2)) for k in ['keys', 'bass', 'drums', 'vibes', 'lead', 'glock']}
def put(stem, x, t, gain=1., pan=0.):
    if t < 0 or t >= DUR + .4: return
    add(stems[stem], x, t, gain, pan)

def tt_(d): return np.arange(int(d * SR)) / SR
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

# ───── sintesi ─────
def rhodes(m, d, v=.7):
    f = mtof(m); n = int((d + 1.4) * SR); t = np.arange(n) / SR
    env = np.exp(-t / (1.9 if f < 300 else 1.3)) * np.minimum(1, t / .004)
    rel = np.where(t > d, np.exp(-(t - d) / .22), 1)
    idx = 1.6 * v * np.exp(-t / .22) + .25
    car = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    bark = np.sin(2 * np.pi * f * 14 * t) * np.exp(-t / .015) * .12 * v
    trem = 1 + .1 * np.sin(2 * np.pi * 4.6 * t)
    return (car * env * rel * trem + bark) * v * .32
def whistle(m, d, v=.6):
    f = mtof(m); n = int((d + .2) * SR); t = np.arange(n) / SR
    vib = 1 + .009 * np.sin(2 * np.pi * 5.6 * t) * np.minimum(1, t / .35)
    glide = 1 - .03 * np.exp(-t / .03)
    ph = 2 * np.pi * np.cumsum(f * vib * glide) / SR
    env = np.minimum(1, t / .035) * np.where(t > d, np.exp(-(t - d) / .05), 1)
    x = np.sin(ph) + .04 * np.sin(2 * ph)
    br = bp(rng.standard_normal(n), f * .85, f * 1.25) * .05
    return (x + br) * env * v * .22
def brush(v=.5, d=.22):
    n = int(d * SR); t = np.arange(n) / SR
    e = np.minimum(1, t / .025) * np.exp(-np.maximum(0, t - .025) / .07)
    return bp(rng.standard_normal(n), 1800, 8000) * e * v * .5
def kick(v=.6):
    t = tt_(.35); f = 58 * (1 + 1.2 * np.exp(-t / .03))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .12) * v

def chord_keys(t, notes, beats, v=.55, stab=False):
    d = spb(0) * beats * (.35 if stab else .95)
    for i, m in enumerate(notes):
        put('keys', rhodes(m, d, v * (1 - .06 * i)), t + i * .008, 1, (-.25 if i % 2 else .25))
def bassn(t, m, beats, v=.75):
    put('bass', S.note('jazz_bass', m, spb(0) * beats * .92, vel=v), t, 1, -.05)
def vib(t, m, beats, v=.6, inst='vibraphone'):
    put('vibes', S.note(inst, m, max(.3, spb(0) * beats), vel=v), t, 1, .3)

# accordi: (rhodes, basso)
CH = {
    'Dm9': ([53, 57, 60, 64], 38), 'Bbmaj7': ([57, 62, 65], 46), 'Gm9': ([58, 62, 65, 69], 43), 'A7sus': ([55, 62, 64], 45), 'A7': ([55, 61, 64], 45),
    'A7b9': ([55, 61, 70], 45), 'Fmaj9': ([57, 60, 64, 67], 41), 'Em7b5': ([55, 58, 62], 40), 'G13': ([53, 59, 64], 43), 'Em7': ([55, 59, 62], 40),
    'C13': ([58, 64, 69], 48), 'C13sus': ([58, 65, 69, 74], 48), 'Bbmaj9': ([62, 65, 69, 72], 46), 'C69': ([55, 64, 69, 74], 48),
}
def walk(b0, beats, root, nxt, v=.7):
    # contrabbasso che cammina: tonica, terza/quinta, approccio cromatico al prossimo accordo
    pat = [0, 7, 12, 10] if beats >= 4 else [0, 7]
    for k in range(int(beats)):
        m = root + pat[k % len(pat)]
        if k == int(beats) - 1 and nxt is not None: m = nxt - 1 if (k % 2) else nxt + 2
        while m > 55: m -= 12
        bassn(bt(b0 + k), m, 1, v * (1 if k % 2 == 0 else .82))
def drums(b0, beats, shaker=False, kicks=False, v=1.):
    for k in range(int(beats)):
        b = b0 + k
        if k % 2 == 1:
            put('drums', lp(brush(.55 * v), 5000), bt(b) - .01, .7, .1)
            put('drums', S.hit('hihat', 'pedal', .35 * v), bt(b), .35, .35)
        put('drums', S.hit('snare2', 'taps', .22 * v), bt(b + .66), .35, -.2)
        if kicks and k % 2 == 0: put('drums', kick(.45 * v), bt(b), 1, 0)
        if shaker:
            put('drums', lp(S.hit('shaker', 'down', .32 * v), 6000), bt(b), .22, .5)
            put('drums', lp(S.hit('shaker', 'up', .22 * v), 6000), bt(b + .5), .2, .5)

# ───── A · aggancio, tramonto (battiti 0–18) ─────
put('bass', S.note('jazz_bass', 38, 2.6, vel=.7), .06, .9)
# i colpi su CI / DEVO / PENSARE sono i timbri veri: la musica entra dopo, su "non è colpa"
for i, m in enumerate(CH['Dm9'][0]): put('keys', rhodes(m, 1.6, .5), wd(ANC['accordo_ingresso']) + i * .01, 1, -.2 if i % 2 else .2)
A = [(0, 'Dm9', 4), (4, 'Bbmaj7', 4), (8, 'Gm9', 4), (12, 'A7sus', 2), (14, 'A7', 2), (16, 'A7b9', 2)]
for b, c, n in A:
    if b > 0: chord_keys(bt(b), CH[c][0], n, .42)
    bassn(bt(b), CH[c][1], 2, .7); bassn(bt(b + 2), CH[c][1] + 7 if n >= 4 else CH[c][1], 2 if n >= 4 else 0.01, .6) if n >= 4 else None
vib(bt(7.6), 76, 2, .5); vib(bt(8.0), 72, 2, .45)              # "cinque minuti": rintocco
# ───── B · notte (18–40) ─────
bassn(bt(18), 26 + 12, 4, .9); vib(bt(18), 62, 6, .55); vib(bt(18), 65, 6, .5); vib(bt(18), 69, 6, .45)
B = [(22, 'Dm9', 4, 'Dm9'), (26, 'Bbmaj7', 4, 'Bbmaj7'), (30, 'Bbmaj7', 4, 'Gm9'), (34, 'Gm9', 4, 'A7sus'), (38, 'A7sus', 2, 'Fmaj9')]
for b, c, n, nx in B:
    chord_keys(bt(b), CH[c][0], n, .34)
    walk(b, n, CH[c][1], CH[nx][1], .62)
    drums(b, n, v=.75)
# ───── C · mattino, il metodo (40–66, poi silenzio fino a 69) ─────
C = [(40, 'Fmaj9', 4, 'Em7b5'), (44, 'Em7b5', 2, 'A7'), (46, 'A7', 2, 'Dm9'), (48, 'Dm9', 4, 'G13'), (52, 'G13', 4, 'Fmaj9'), (56, 'Fmaj9', 4, 'Em7'),
     (60, 'Em7', 2, 'A7'), (62, 'A7', 2, 'Dm9'), (64, 'Dm9', 2, None)]
for b, c, n, nx in C:
    chord_keys(bt(b), CH[c][0], n, .36)
    walk(b, n, CH[c][1], CH[nx][1] if nx else None, .7)
    drums(b, n, shaker=True, kicks=True, v=.9)
MEL_C = [(40.5, 69, .5), (41, 72, 1), (42.5, 76, .5), (43, 74, 1), (44, 72, 1), (45.5, 70, .5), (46, 69, 1), (47, 67, 1),
         (48.5, 65, .5), (49, 69, .5), (49.5, 72, .5), (50, 76, 1.5), (52, 74, .5), (52.5, 71, .5), (53, 69, 1), (54.5, 65, .5), (55, 64, 1),
         (56.5, 72, .5), (57, 76, 1), (58.5, 79, .5), (59, 77, 1), (60, 76, 1), (61.5, 74, .5), (62, 73, 1), (63, 69, 1), (64, 74, 2)]
for b, m, d in MEL_C: vib(bt(b), m, d, .62, 'vibraphone_hard' if b % 4 == 0 else 'vibraphone')
# ───── D · "zitto" e respiro (69–77) ─────
for m in [62, 65, 69, 72]: vib(bt(69), m, 4, .6)
bassn(bt(69), 38, 4, .95); chord_keys(bt(69), [53, 57, 60, 64], 4, .4)
for m in [58, 62, 65, 69]: put('vibes', S.note('vibraphone_bowed', m, spb(70) * 3.6, vel=.5, attack=.35), bt(70.5), .55, .2)
for m in [58, 65, 69, 74]: put('vibes', S.note('vibraphone_bowed', m, spb(74) * 3.2, vel=.5, attack=.3), bt(73.6), .55, .2)
chord_keys(bt(73), CH['C13sus'][0], 4, .3); bassn(bt(73), 36, 4, .6)
# ───── E · il prezzo, groove + fischio (77–~100) ─────
E = [(77, 'Fmaj9', 4, 'Dm9'), (81, 'Dm9', 4, 'Gm9'), (85, 'Gm9', 4, 'C13'), (89, 'C13', 4, 'Fmaj9'), (93, 'Fmaj9', 4, 'A7sus'), (97, 'A7sus', 3, None)]
for b, c, n, nx in E:
    chord_keys(bt(b), CH[c][0], n, .34)
    walk(b, n, CH[c][1], CH[nx][1] if nx else None, .7)
    drums(b, n, shaker=True, kicks=True, v=.9)
MEL_E = [(77, 72, 1.5), (78.5, 69, .5), (79, 65, 1), (80, 67, 1), (81, 69, 2), (83.5, 65, .5), (84, 64, 1), (85, 62, 1), (86, 65, 1), (87, 69, 1), (88, 70, 1),
         (89, 69, 1.5), (90.5, 67, .5), (91, 64, 2), (93, 72, 1), (94, 74, .5), (94.5, 72, .5), (95, 69, 1), (96, 65, 1), (97, 67, 2), (99, 64, .8)]
for b, m, d in MEL_E: put('lead', whistle(m + 12, spb(b) * d * .95, .6), bt(b), 1, -.15)
# ───── F · alba e invito (101–) ─────
F = [(101, 'Fmaj9', 4, 'Bbmaj9'), (105, 'Bbmaj9', 4, 'C69')]
for b, c, n, nx in F:
    chord_keys(bt(b), CH[c][0], n, .42)
    walk(b, n, CH[c][1], CH[nx][1], .75)
    drums(b, n, shaker=True, kicks=True, v=1)
for i, m in enumerate([77, 81, 84, 88, 91, 96]): put('glock', S.note('glockenspiel', m, 1.2, vel=.5), bt(101) + i * spb(101) / 3, .5, .35)
for i, m in enumerate([74, 77, 81, 86]): put('glock', S.note('glockenspiel', m, 1.2, vel=.42), bt(105) + i * spb(105) / 2, .45, .35)
MEL_F = [(101, 72, 1), (102, 76, 1), (103, 79, 2), (105, 77, 1), (106, 74, 1), (107, 72, 1.5)]
for b, m, d in MEL_F: vib(bt(b), m, d, .6, 'vibraphone_hard')
# colpo su DOMANDE: tutto il gruppo, poi una battuta sospesa e l'accordo finale
chord_keys(bt(109), CH['C69'][0], 1, .55, stab=True); bassn(bt(109), 36, 1, .95); put('drums', kick(.7), bt(109), 1, 0)
for m in [64, 69, 74]: vib(bt(109), m, 1, .6, 'vibraphone_hard')
put('drums', S.hit('shaker', 'down', .3), bt(111), .4, .5); put('drums', S.hit('shaker', 'up', .2), bt(111.5), .35, .5)
bassn(bt(111), 43, 1, .7); bassn(bt(112), 47, 1, .7)
fin = bt(113)
for m in [57, 60, 64, 67, 72]: put('keys', rhodes(m, 1.6, .5), fin, 1, .1)
for m in [69, 72, 76]: vib(fin, m, 3, .55)
put('bass', S.note('jazz_bass', 41, 1.6, vel=.85), fin, 1)
for i, m in enumerate([84, 88, 91, 96]): put('glock', S.note('glockenspiel', m, 1.5, vel=.4), fin + i * .09, .45, .35)

# ───── silenzi: code tagliate prima di "zitto" e durante il riavvolgimento finale ─────
def mute(t0, t1, fade=.06):
    a, b = int(t0 * SR), int(t1 * SR); f = int(fade * SR)
    for k, x in stems.items():
        x[a:a + f] *= np.linspace(1, 0, f)[:, None]; x[a + f:b] = 0
def tm(x): return x[0] + x[1] if isinstance(x[0], (int, float)) else wd(x[0], x[1])   # [secondi o 'scena:parola', scarto]
for a, b, f in ANC['mute']: mute(tm(a), tm(b), f)
# fine del film
end = int(DUR * SR); fo = int(.35 * SR)
for x in stems.values(): x[end - fo:end] *= np.linspace(1, 0, fo)[:, None]; x[end:] = 0

# la musica lascia spazio ai colpi principali (effetti veri): buco breve sotto ogni colpo eroe
HEROES = [wd(r) + o for r, o in ANC['eroi']]
def carve(t, depth_db=-14, pre=.015, post=.2, fade=.008):
    g = 10 ** (depth_db / 20); a, b = int((t - pre) * SR), int((t + post) * SR); f = int(fade * SR)
    env = np.ones(N); env[a:b] = g
    env[a - f:a] = np.linspace(1, g, f); env[b:b + f] = np.linspace(g, 1, f)
    for x in stems.values(): x *= env[:, None]
for h in HEROES: carve(h)
G = {'keys': .9, 'bass': 1.0, 'drums': .8, 'vibes': .85, 'lead': .8, 'glock': .45}
mix = sum(stems[k] * G[k] for k in stems)
mix = S.room(mix, size=.32, mix=.14)
mix = limit(mix, .9)
os.makedirs(HERE, exist_ok=True)
sf.write(os.path.join(HERE, 'score.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
print('score.wav', round(len(mix) / SR, 2), 's; tempo map', [(round(t, 2), b) for t, b in AN])
