# swiss-motion — pacchetto di stile (1080x1920, 30 fps, tutto in codice)
Nato da «Ci devo pensare» (cdp-swiss-motion-v2). Per un nuovo reel cambia SOLO `scene.js` + voce + `sounds.json` + tempi di `music/score.py`.

## Cos'è e perché è bello
Griglia svizzera di 6x8 moduli quadrati (120 px, passo 144) letta come un testo: alto-sinistra = inizio, basso-destra = fine.
Fondo carta caldo #ECEAE4, inchiostro nero, UN solo colore segnale (rosso #FF4A1A) = l'eccezione / le parole del cliente, in moto lineare.
Tipo Inter Tight, testo a sinistra. Solo due curve: scatto preciso cubic-bezier(.7,0,.2,1) e lineare. Camera 2D su un mondo-griglia (zoom nei moduli, pan, pull-out).
Bello perché: ogni gesto cade su una parola, mai tagli netti (coltello = riga che taglia), mai fermo, suoni veri di sala stampa.

## File
- Motore (non toccare): `engine.js` (palette C, griglia, setTiming, blocchi parola, camera, primitive, drift, renderFilm, moveTimes), `ease.js`, `main.js`, `index.html`, `fonts/`, `tools/`, `build.sh`.
- Contenuto: `scene.js` (cue, tempi chiave T, blocchi, disegni dei colpi, caption, buildEvents), `sounds.json` (suoni per id + silenzi), `music/score.py` (sezioni), `vo.mp3` + `vo-timing.json`.
- `vo-timing.json`: words[{w,start,end,scene}] + scenes[{id}]. Gli id scena sono quelli del file nuovo (nessun S01..S20 fisso): in scene.js `sc` = id OPPURE numero scena 1-based.
- Zona sicura: `SAFE_SHIFT=56` in engine.js centra il blocco 840 px su x=540. Libere solo fascia alta <250, bassa >1470, angolo x>900 y>950.

## Formato di una scena (in `build()` di scene.js)
```js
CUE_DEF: ['c05','S05',0,7]            // id cue, scena voce, prima parola, ultima -> sottotitolo, tenuta max(parlato+.6s, 1.8s)
T.tardi = ws('S04',4);                // tempo = INIZIO parola (we = fine). Mai secondi scritti a mano
blk({ cue:'c05', lines:[[S('S05',0,'“ci'),tk('S05',1)],[S('S05',2,'pensare”')]], x:64, y:390, size:140, lh:1.0, col:C.red });
blk({ cue:'c05', lines:[tks('S05',3,4)], x:64, y:640, size:56, wt:500, col:C.lead });   // tks = parole 3..4
```
Il blocco esce alla fine del cue (`out`), `mode`: 'up' | 'down' | 'knife'.

## Pezzi
- Titoli: `blk({cue,lines,x,y,size,lh,wt,col,mode,out,maxW,pos:track([[0,[x,y,size]],[t,[x2,y2,s2],dur]]),rel,clip,steps,base,strike,knifeCol})`; parola con `{under:t}` (sottolineatura a penna), `{scale,wt,col}`.
  `tk(sc,i,opts)` una parola; `tks(sc,a,b,opts)` più parole; `S(sc,i,'testo')` parola con testo sostituito.
- Moduli/barre: `modR(k)` rettangolo modulo k (0..47); `outline(g,r,col,lw)`; `wipeRect(g,r,p,dir 'left'|'up'|'right'|'down')` barra che entra; `collapseRect(r,k)` chiusura a riga; `lerpR(a,b,p)`; `gridLines`, `cascade` (apertura moduli).
- Camera: `camFor(wx,wy,sx,sy,scala)`, `gridCam = track([[t,cam,dur],...])`, `rs(cam,rect)`, `w2s(cam,x,y)`; `makeDrift(bounds,forceT)` spinta lenta 3-5% fra un colpo e l'altro.
- Curve/tempo: `snap(t,t1,d)` scatto che atterra a t1; `lin(t,a,b)`; `steps(t,a,b,n)`; `track(keys,ease)`; `seg`, `lerp`, `E`; unità `BEAT=.5, E8, E16, E32`.
- Transizioni: coltello (`mode:'knife'`, riga + chiusura a E8), foglio di carta che sale (`drawPaper`), re-flow dei moduli in uno (`snap` + `lerpR`), pan di camera tra due pagine, riempimento rosso riga per riga (`redFront`). I disegni `drawWorldA/C/D, drawCells, drawList, drawCTA` sono MODELLI da copiare e adattare.
- Suono: in `buildEvents()` `fx(t,kind,{w:'hero',id,vis,stop,build})`, `mv(fn,a,b,{id})` (whoosh sul picco della camera, usa `moveTimes`).

## Regole imparate
- Mai fermo più di 1,3 s: sempre una spinta lenta (drift 3-5%) o un nuovo gesto; zoom di camera a ogni cambio di cue.
- Il protagonista di ogni colpo occupa >=60% della larghezza utile (840 px); il resto è corpo 56 px grigio-lead.
- Un solo colore segnale; il rosso mai scattato (lineare). Silenzio vero prima dei colpi grossi (`stop:true`).
- Sottotitoli: tenuta >= max(1,8 s, parlato+0,6 s) (lo verifica `tools/subs.py`); `readcheck.mjs` controlla le etichette.

## Suoni (opus-sound-layer, tutti CC0, elenco in `CREDITS`)
Famiglia «sala stampa»: carta (page turn), tasti macchina da scrivere, tic orologio/metallo, lama breve (swish), tonfi stoffa/legno, timbro di gomma, vetro per il rosso. Gli eroi hanno colpo secco + sub (`hitBoom`, `chimeThump`).
Rotazione per tipo in `tools/cues.py` (ROT); id scelti a mano per i colpi grossi in `sounds.json` -> `by_id` (es. tardi/zitto/dopo = hit+boom, price = thud, redprice = ding, pullOpen = whoosh lungo). Si naviga con `sfx.py browse`. Output `audio/cues.json`, frame = round(t*fps).

## Musica
Partitura originale in numpy (`music/score.py`): 120 BPM, re dorico, motorik; sezioni A (problema), stop netto, B (regola), silenzio, riser, D fino alla fine; le note dei moduli e la voce sinusoidale del rosso vengono da `events.json` (eventi `note/redNote/redGlide/redFlow`). Per un nuovo reel: cambia A0/B0/STOP/C0/D0 e i punti di drop coi nuovi tempi. `LIB=~/lemo-opuscar .venv/bin/python music/score.py` -> `music/score.wav`.

## Costruire
1. `cp -R <questo pacchetto> ~/Downloads/<reel>/` e copia `vo.mp3` + `vo-timing.json`; riscrivi `scene.js` (+ `sounds.json`, `score.py`).
2. `sh build.sh <cartella> <nome>` -> `<nome>.mp4` (eventi, sottotitoli, readcheck, musica, suoni, render, mix -14 LUFS, QA, poster). Env: `LIB`, `SL`, `VOICE`, `POSTER_T`.
3. Prova rapida: `node $LIB/core/render/still.mjs <cartella> 3.2 20.5 --size 1080x1920`.

## Difetti noti
- `scene.js` ha ancora costanti del vecchio film (CAM_*, CELL1/2, T.stop 41.93, drift `1.433, 24.367...`, CHAP/WHERE, numeri 48/47 dei moduli): vanno riscritti, non solo ritoccati.
- Margini 120/120 col blocco da 840 px (la regola chiede ~80-90): per averli larga la griglia (PIT/CW).
- `score.py` ha tempi fissi per sezione; `readcheck` segnala ogni etichetta nuova solo se la dichiari in `labels(t)`.
- Fogli e flood neri sbordano di 80-120 px: con `SAFE_SHIFT` diverso da 56 controlla i bordi.
