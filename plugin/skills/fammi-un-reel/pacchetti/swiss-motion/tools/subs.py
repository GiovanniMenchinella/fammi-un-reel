"""Subtitle cues from events.json (type 'cue'): asserts hold >= max(1.8 s, speech + 0.6 s), writes out/subs.json for core/render/srt.py"""
import json, os, sys
D = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__)) + '/..'   # project dir
EV = json.load(open(f'{D}/events.json')); ev = EV['ev']
cues, bad = [], 0
for e in ev:
    if e['type'] != 'cue': continue
    t0, t1, te = e['t'], e['t1'], e['te']
    need = max(1.8, te - t0 + .6)
    ok = t1 - t0 >= need - 1e-3
    if not ok: bad += 1; print('BAD', round(t0, 2), round(t1 - t0, 2), '<', round(need, 2), e['text'])
    cues.append({'t0': round(t0, 3), 't1': round(min(t1, ev[-1]['t'] + 10, EV['dur'] - .007), 3), 'text': e['text']})
cues.sort(key=lambda c: c['t0'])
os.makedirs(f'{D}/out', exist_ok=True); json.dump(cues, open(f'{D}/out/subs.json', 'w'), indent=1, ensure_ascii=False)
print(len(cues), 'cues', 'ok' if not bad else f'{bad} BAD'); sys.exit(1 if bad else 0)
