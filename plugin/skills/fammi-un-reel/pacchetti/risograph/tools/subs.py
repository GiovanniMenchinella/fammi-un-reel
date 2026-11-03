"""Sottotitoli dai tempi parola della voce: subs.json (per la pagina). Nessun ID di frase scritto qui.
Se nel progetto c'è sottotitoli.json ({"fine": secondi, "cues": [[scena, prima parola, ultima parola, "testo\\na capo"], ...]})
usa quello (testo curato a mano); altrimenti li ricava da soli dalle parole del file voce (vo-timing.json):
frasi spezzate a punteggiatura, max ~34 caratteri per riga, 2 righe, ogni cue >= 1.8 s.
Inizio = attacco della prima parola; fine = attacco del cue dopo - 0.02 s."""
import json, os, re
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(D, 'vo-timing.json')))
WS = T['words']
by = {}
for w in WS: by.setdefault(w['scene'], []).append(w)
def auto():
    """cue automatici: (scena, a, b, testo) per ogni gruppo di parole."""
    cues = []
    for sc, ws in by.items():
        a = 0
        while a < len(ws):
            b = a; n = 0
            while b < len(ws):
                n += len(ws[b]['w']) + 1
                end = re.search(r'[.?!:;,]$', ws[b]['w'])
                if (end and n > 16) or n > 52 or b == len(ws) - 1: break
                b += 1
            txt = ' '.join(x['w'] for x in ws[a:b + 1])
            if len(txt) > 30:   # va a capo vicino alla metà, su uno spazio
                m = len(txt) // 2; i = max(range(len(txt)), key=lambda k: -abs(k - m) if txt[k] == ' ' else -999)
                txt = txt[:i] + '\n' + txt[i + 1:]
            cues.append((sc, a, b, txt)); a = b + 1
    return cues
SF = os.path.join(D, 'sottotitoli.json')
if os.path.exists(SF):
    J = json.load(open(SF)); CUES = [tuple(c) for c in J['cues']]; END = J['fine']
else:
    CUES = auto(); END = WS[-1]['end'] + .5
out = []
for i, (sc, a, b, txt) in enumerate(CUES):
    ws = by[sc]
    t0 = ws[a]['start']
    if i + 1 < len(CUES):
        n = CUES[i + 1]; t1 = by[n[0]][n[1]]['start'] - .02
    else:
        t1 = END
    out.append({'t0': round(t0, 3), 't1': round(t1, 3), 'text': txt, 'words': ' '.join(w['w'] for w in ws[a:b + 1])})
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
json.dump(out, open(os.path.join(D, 'subs.json'), 'w'), ensure_ascii=False, indent=1)
# un cue sotto 1.8 s si allunga fino a 1.8 s e il successivo parte subito dopo (al massimo pochi centesimi dopo la sua parola)
for i, c in enumerate(out):
    if c['t1'] - c['t0'] < 1.8 and i + 1 < len(out):
        c['t1'] = round(c['t0'] + 1.8, 3); out[i + 1]['t0'] = round(max(out[i + 1]['t0'], c['t1'] + .02), 3)
json.dump(out, open(os.path.join(D, 'subs.json'), 'w'), ensure_ascii=False, indent=1)
short = [(c['text'].replace('\n', ' '), round(c['t1'] - c['t0'], 2)) for c in out if c['t1'] - c['t0'] < 1.8]
print(len(out), 'cue; sotto 1.8 s:', short)
