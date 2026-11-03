"""Controllo rapido (stessi calcoli di 'audible' e 'hero body' di opus-sound-layer/scripts/qa.py) sugli stem di audio/, senza video."""
import json, os, sys, numpy as np, soundfile as sf
from scipy import signal
A = sys.argv[1]; SR = 48000
BANDS = [(125, 250), (250, 500), (500, 1000), (1000, 2000), (2000, 4000), (4000, 8000), (8000, 16000)]
def band_rms(x, lo, hi):
    lo = max(20.0, lo); hi = min(SR / 2 - 100, hi)
    if len(x) < 64 or hi <= lo * 1.05: return 0.0
    return float(np.sqrt(np.mean(signal.sosfilt(signal.butter(4, [lo, hi], "bandpass", fs=SR, output="sos"), x) ** 2)))
rep = json.load(open(os.path.join(A, 'mix-report.json')))
st = {k: sf.read(os.path.join(A, 'stems', k + '.wav'))[0] for k in ('music', 'voice', 'sfx')}
sfx = st['sfx'].mean(1); bed = (st['music'] + st['voice']).mean(1)
bad = 0
for ev in rep['events']:
    w0, w1 = int(ev['win_s'][0] * SR), min(len(sfx), int(ev['win_s'][1] * SR))
    fx_b = [band_rms(sfx[w0:w1], lo, hi) for lo, hi in BANDS]; tot = sum(v * v for v in fx_b) + 1e-20
    best = -99
    for (lo, hi), e in zip(BANDS, fx_b):
        if e * e / tot < .1: continue
        b = max(band_rms(bed[w0:w1], lo, hi), 1e-3); l = 20 * np.log10(band_rms(bed[w0:w1] + sfx[w0:w1], lo, hi) / b + 1e-12); best = max(best, l)
    msg = ''
    if best < 1.5: msg += f' AUDIBLE {best:.1f}'
    if ev['weight'] == 'hero':
        k = int(np.argmax(fx_b)); lo, hi = BANDS[k]; b = max(band_rms(bed[w0:w1], lo, hi), 1e-3)
        ml = 20 * np.log10(band_rms(bed[w0:w1] + sfx[w0:w1], lo, hi) / b + 1e-12)
        if ml < 3: msg += f' HEROBODY {ml:.1f} in {lo}-{hi}'
    if msg: bad += 1; print(f"{ev['id']:12s} {ev['sound'][:50]:50s}{msg}")
print('fails', bad)
