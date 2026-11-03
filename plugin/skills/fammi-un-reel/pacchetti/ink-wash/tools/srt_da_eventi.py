"""Sottotitoli .srt dagli stessi tempi che disegna la pagina (events.json → marks 'cues' t0/t1).
Uso: python3 tools/srt_da_eventi.py <progetto> <uscita.srt>"""
import json, os, sys
P, out = sys.argv[1], sys.argv[2]
EV = json.load(open(os.path.join(P, 'events.json')))
cues = [e for e in EV['ev'] if e['type'] == 'cues'][0]['cues']
def ts(x): h, r = divmod(x, 3600); m, s = divmod(r, 60); return '%02d:%02d:%06.3f' % (h, m, s)
with open(out, 'w', encoding='utf-8') as f:
    for i, c in enumerate(cues, 1):
        t1 = min(c['t1'], cues[i]['t0'] - .01) if i < len(cues) else c['t1']
        f.write(f"{i}\n{ts(c['t0']).replace('.', ',')} --> {ts(t1).replace('.', ',')}\n{c['text']}\n\n")
print(len(cues), 'sottotitoli →', out)
