"""Movimento per ripresa: stessa misura di motionmaxxing/look.py (luma 96x54 'area', media |differenza| fra fotogrammi)."""
import subprocess, sys, json, numpy as np
film = sys.argv[1]; fps = 24
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', film, '-an', '-vf', 'scale=96:54:flags=area,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, 54, 96).astype(np.float32)
M = np.zeros(len(F)); M[1:] = np.mean(np.abs(np.diff(F, axis=0)), axis=(1, 2))
print('media %.2f  mediana %.2f  (fascia umana 4.4-9.8)' % (M[1:].mean(), np.median(M[1:])))
if len(sys.argv) > 2:
    shots = json.load(open(sys.argv[2]))
    for name, a, b in shots:
        i0, i1 = int(a * fps) + 1, min(len(M), int(b * fps))
        if i1 > i0: print('%-10s %5.1f-%5.1f  media %.2f  mediana %.2f' % (name, a, b, M[i0:i1].mean(), np.median(M[i0:i1])))
