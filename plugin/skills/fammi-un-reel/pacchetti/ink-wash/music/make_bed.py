"""The music track handed to opus-sound-layer: the original score + real outdoor ambience (CC0 field recordings, audio/amb/),
silent where the film holds its breath. Run from the library root: .venv/bin/python <project>/music/make_bed.py"""
import os, json, subprocess, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.dirname(HERE); SR = 48000
EV = json.load(open(os.path.join(P, 'events.json'))); T = [e for e in EV['ev'] if e['type'] == 'marks'][0]['T']
score, sr = sf.read(os.path.join(HERE, 'score.wav')); assert sr == SR
N = len(score)
def dec(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
breeze = dec(os.path.join(P, 'audio', 'amb', 'wind-gentle-breeze.mp3'))
trees = dec(os.path.join(P, 'audio', 'amb', 'wind-in-the-trees.mp3'))
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
ref = rms(score[score.any(axis=1)])
amb = np.zeros_like(score)
def lay(src, a, b, db, off=0.0, fade=.6):
    ia, ib = int(a * SR), min(N, int(b * SR)); n = ib - ia; o = int(off * SR) % max(1, len(src) - n)
    x = src[o:o + n].copy() * (ref / rms(src) * 10 ** (db / 20))
    f = min(int(fade * SR), n // 3); x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    amb[ia:ib] += x
lay(breeze, 0, T['cut2'] + .1, -13, 3.0, .3)                  # the mist on the bank
lay(breeze, T['x3a'] - .2, T['hush0'], -13, 20.0)              # back in the mist; cut on «tardi»
lay(trees, T['x10a'], T['what'] + .2, -16, 5.0)                # by the river
lay(trees, T['cut12'] + .4, T['cut14'], -18, 30.0)
lay(breeze, T['cut14'], T['x15b'], -15, 40.0, .3)               # the incense insert keeps its air
lay(trees, T['x15a'], EV['dur'], -17, 50.0, 1.0)
bed = score + amb
for e in EV['ev']:                                             # the planned silences stay silent
    if e['type'] == 'silence':
        ia, ib, f = int(e['t0'] * SR), int(e['t1'] * SR), int(.03 * SR)
        bed[ia - f:ia] *= np.linspace(1, 0, f)[:, None]; bed[ia:ib] = 0
pk = np.abs(bed).max(); bed *= min(1.0, 10 ** (-1.2 / 20) / pk)
sf.write(os.path.join(HERE, 'bed.wav'), bed.astype(np.float32), SR, subtype='FLOAT')
print('bed.wav', round(N / SR, 2), 's')
