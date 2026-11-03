# Pacchetto «ink-wash» — inchiostro su carta di riso (1080x1920, 30 fps)
## Cos'è
Pittura a inchiostro cinese fatta tutta in codice: pennello di bambù, carta di riso, figure a passo due (15 fps), nebbia, ponte,
fumo d'incenso, sigillo vermiglio. Bella perché: tono calmo, inchiostro che si asciuga, camera lenta sempre in moto, pochi colori
(nero, carta, un solo rosso). Adatta a idee, domande, "una cosa sola"; non a ritmo veloce. Film di riferimento: «Ci devo pensare» (70 s).
## File
- MOTORE (non si tocca): `motore/base.js` (camera, iscrizioni, etichette, SAFE, `makeFrame`, `walkPose`), `motore/tempi.js` (legge la voce),
  `motore/props.js` (oggetti), `motore/client.js` (figura), `motore/lib/{ink,land,comp,seal}.js`, `fonts/`, `index.html`, `main.js`.
- CONTENUTO (si riscrive): `contenuto.js` (UN file: tempi, sottotitoli, mondi, scene, sequenza, eventi suono).
- Pipeline: `build.sh`, `tools/{render_parti.sh,srt_da_eventi.py}`, `music/{score,make_bed}.py`, `audio/make_cues.py`, `audio/chosen.json`.
  `score.py` e `make_cues.py` leggono i nomi di T (events.json → marks): quando cambi T, adatta questi due elenchi.
## Formato di una scena (in contenuto.js)
1. Aggancio: `T.q1 = w(9,'perché')` (frase 9, parola «perché»; `w(11,'se',1)` = seconda volta; `we()` = fine parola).
2. Sottotitolo: `cue(9,'«Perché hai deciso\nproprio adesso?»', null, null, {big:'PRIMA'})`; posizione in `SUBPOS`.
3. Scena: `function sceneX(Ls,t){ const cam=camX(t); blitLayer(Ls,LY.river,cam); useCam(Ls,cam); /*pezzi*/ return {paper:paperOf(cam),bleed:5,rim:.95}; }`
4. Sequenza: una riga in `frameAt` (`if (t < T.x5a) return sceneX(Ls,t)`), una in `TRANS` per ogni fioritura fra scene.
5. Suoni: `ev(T.q1+.3,'drip',1)` in `events()`; make_cues.py li traduce (tipi: brush, drip, bloom, cut, banner, crack, collapse, slam, seal…).
Le frasi si indicano per POSIZIONE (1,2,3…): nessun ID fisso, vale per ogni `vo-timing.json`. Se la parola ripetuta serve: terzo argomento k.
## Pezzi (motore/props.js salvo dove detto) — L = `Ls.ink`
- Figura: `hero(L,POSE.stand,{x,y,s,dir,seed,t,p,am})`; pose: stand leap touch skid walk1 walk2 draw front bow wait back; `mixPose(a,b,u)`, `walkPose(fase)` (base).
- Ponte: `bridgeStrokes(cx,cy)` → disegna con `draw`; `bridgeWash/Texture/Reflection(…,cx,cy,am,t)`; `BR`, `deckY(x)`; in contenuto `bridgeDraw(Ls,p,am,t)`.
- Incenso: `incense(L,x,y,{s,h,burn 0..1,lit,t,ash,ashDrop,am})`; `smoke(L,x,y,h,t,s,am,wk)`.
- Sigillo: `seal(c,x,y,size,am,seed)` su `Ls.cc`. Moneta: `coin(L,x,y,r,p,am)`. Gocce: `drop(L,x,y,s,am)`, `rings(L,x,y,età,{})`.
- Pennello: `brush(L,x,y,ang,{len,hair,wet,splay,am})`; scritte: `brushWord(testo,x,y,alt,{center,seed,dry})` + `writeWord(L,W,p,am)`; `title(Ls,testo,cx,y,size,p)`.
- Altri: `banner(L,x,y,w,h,seed,am,p)` (striscioni), `plum`, `blossom`, `treeStrokes(x,y,seed,scala)`, `plum`.
- Paesaggi (lib/land.js): `ridgeFn(picchi,base,seed,rough)` + `mountainLayer({W,H,ridge,depth,tone,rim,mist,seed,xmask})`, `cun`, `cliff`, `pine`, `reed(L,x,y,h,s,seed,bend)`, `ripple`.
  Mondi pronti in `init()`: LY.bank (riva+roccia), LY.river (ponte, monti, acqua), chiave di volta K.
- Camera: `{x,y,z}` in funzione di t (`lerp`, `eio`, `seg`); `useCam`, `blitLayer(Ls,strato,cam)`, `paperOf(cam)` (la carta scorre con la camera).
- Transizioni: fioritura d'inchiostro (`TRANS` + `makeFrame`); taglio netto = due scene adiacenti in `frameAt` (suono: pagina girata).
- Sottotitoli: `inscription(Ls,testo,x,y,a,{size,center})`, `label(Ls,TESTO,x,y,a,size)`.
## Regole imparate
- Testo: nel film il sottotitolo era piccolo (56) e in alto a sinistra: MALE. Nei reel nuovi `SUB_CENTRATI = true`: centrato su x=540, corpo ~68.
- Zona sicura (`SAFE`): composizione centrata su x=540, margini simmetrici ~85 px; libere solo fascia alta ~250, bassa ~450, angolo basso-destra (x>900,y>950).
- Nessun quadro quasi vuoto: ogni scena ha un soggetto + carta lavorata (monti, acqua, fumo). Movimento continuo sempre: nebbia, acqua, camera lenta.
- Ogni evento visivo è agganciato a una parola; i silenzi sono scelti (`silence` in events, `silence_ok` nel mix).
## Suoni (famiglia: carta, bambù, legno, gocce, timbro) — ID in `audio/make_cues.py`, crediti in `CREDITS`
carta: paper/fs-428338 (tratto), fs-140463 (strofinio secco), fs-151221 + fs-442857 (pagina = taglio), fs-389442 (inchiostro che sale), fs-397550 (moneta/linea).
bambù: whoosh/fs-60010 (x2), fs-60022 · respiro: whoosh/fs-30241, fs-30240 · stoffa: swish/fs-14176/14179 + thump/fs-389999 · legno: tap/fs-369710.
gocce (`audio/chosen.json`): tap/own-ov-3b3af210 (+ pop/fs-459582); schizzo: transition/fs-234533 · timbro: tap/own-ov-c154424d · crollo: hit/fs-550918 + boom/fs-636624.
Passi sotto la voce: nessun suono. Ambiente vero: `audio/amb/` (vento, alberi). Cerca nuovi suoni con `opus-sound-layer/scripts/sfx.py search/add`.
## Musica
Originale: `music/score.py` (guqin a corda modellata `core/audio/pluck.py`, xiao sintetico, percussioni VCSL CC0) agganciata a T → `score.wav`;
`make_bed.py` aggiunge l'ambiente → `bed.wav`, dato al mix. Scala di re (D E F# A B). Per un nuovo reel: riscrivi le righe `G(T.x,…)`, `D(…)`, `xiao(…)`.
## Costruire
`sh nuovo-reel.sh ink-wash <nome> copione.txt` crea il progetto con la voce; poi `sh build.sh <progetto> <nome>` → `<progetto>/<nome>.mp4`
(eventi+srt → partitura → musica → readcheck → eventi → cue → render in parti → mix suoni → mux → qa.py + controlla-reel.sh).
Prova veloce di una scena: `node core/render/still.mjs <progetto> 3.2 24.5 --size 1080x1920 --out <dir>` dalla cartella `~/lemo-opuscar`.
## Difetti noti
- `contenuto.js` ha ancora tempi fissi accanto alle parole (x3a, hush0, sil0…, in secondi): per un'altra voce vanno riagganciati a parole.
- Le scene del film (ponte, cliente, incenso) sono specifiche: per un'altra storia si riscrivono usando i pezzi, non si riusano.
- Render ~10 min per 70 s; il browser a volte cade: render_parti.sh riprova 3 volte. Sottotitolo originale non centrato (vedi regole).
