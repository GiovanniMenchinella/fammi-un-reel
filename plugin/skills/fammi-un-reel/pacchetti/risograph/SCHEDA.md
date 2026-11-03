# Pacchetto di stile RISOGRAPH (1080x1920, 24 fps) - esempio: «Ci devo pensare»
**Cos'è**: stampa risograph a 3 lastre (R teal = tu/il mondo, G rosa = il cliente/le sue parole, B girasole = il tempo, sole-orologio).
Retino, sovrastampa (over), registro che "calcia" sulle parole forti, carta nera=bianco. Personaggi a passo due (12 fps), cielo che
cambia fase (alba 0 -> tramonto 1). Bello perche': 3 inchiostri soltanto, camera sempre in moto, stampa viva (errori di registro).
Il prossimo reel cambia SOLO `scene.js` (+ `music/ancore.json`, `sottotitoli.json`). Il motore non si tocca.

## File
- MOTORE: `motore.js` (camera cam/drift/camMix, respiro, bocca, backdrop, scene2, sottotitoli, registro, renderFilm, ZONA),
  `riso.js` (stampa/retino), `draw.js` (disegno a lastre), `chars.js` (personaggi), `props.js` (oggetti/sfondi), `main.js`, `index.html`, `fonts/` (Jost, Bricolage).
- CONTENUTO: `scene.js` = DUR, `shots()` (elenco riprese), `build()` (KICKS + suoni), `SHOT{}` (una funzione per ripresa), pezzi del copione.
- Strumenti: `tools/subs.py` (sottotitoli), `tools/cues.py`, `tools/video_png.mjs`, `tools/motion.py`, `tools/quickqa.py`; `music/score.py`; `build.sh`; `examples/` (file del reel d'esempio).
- Il progetto nuovo = copia del pacchetto + `vo.mp3` + `vo-timing.json` (words[{w,start,end,scene}]).

## Formato di una scena (in scene.js)
Tempi SEMPRE da `w('S05', 0)` = inizio parola 0 della frase S05 (mai secondi scritti a mano). 1) riga in `shots()`: `['moon', w('S05',0), w('S06',0)]`.
2) funzione in `SHOT`: `moon(t){ ... return {}; }`. 3) colpo di registro in `KICKS` `[tempo, forza]`. 4) suono in `build()`: `sx('id', tempo, 'chiave', {visual:'cut'|'appear'|'move'|'land', pan, weight:'hero'})`.
```js
moon(t) { const a = w('S05',0), b = w('S06',0), k = eio(seg(t,a,b));
  cam(drift({ ...camMix(WIDE, CAM2, k), }, t, 'c', 6, 0, .01));      // camera + deriva + spinta lenta
  backdrop({ phase: .9, night: 1, clouds: true });                    // cielo/sole/prato con parallasse
  scene2(t, { ...POSE.chin, talk: talk(t, [[a, b]]) }, { ...POSE.open });  // i due al tavolino
  return {}; }
```
## Pezzi (funzione: parametri)
- Personaggi: `person(x,y,{kind:'s'|'c',s,dir,hand,handB,lean,breath,blink,talk,brow,headTilt,part:'body'|'arm'})`, `bust('s'|'c')`, `chair(x,y,s,dir)`, `table(x,y,s)`; pose `POSE.table|chin|cross|open|up|point`, `poseMix(a,b,k)`; `talk(t,[[a,b]])`, `mouthOf`.
- Oggetti: `bubble(x,y,w,h,r,tx,ty,c)`, `cloud(x,y,s,c,bolt)`, `priceTag(x,y,s,rot)`, `tagString`, `shield`, `sheet(x,y,w,h,rot,fn)`, `envelope(x,y,w,h,rot,flap)`, `badge(x,y,r,label)`, `qmark`, `arrow(x0,y0,x1,y1,w,c,dash)`, `wordLines(x,y,w,n,lh,c,seed,k)` (righe di testo finto), `cup`, `smallSun`, `foldSheet` (foglio in tre), `panel/shop` (vignette), `listContent`.
- Testi: `text(s,x,y,font,c,align)`, `ko(...)` knockout, `dhit(s,x,y,size)` titolo doppia battuta teal+rosa, `popText`, `measure`, `addText(id,...)` (per readcheck).
- Sfondi: `backdrop({phase,night,clouds,sun,sunXY,sunR,clock,birds})` = `sky`+`clouds`+`sunClock`+`birds`+`ground`; `meadow(night)`, `foreground`, `fgBig`, `floaters`.
- Camere: `cam({z,fx,fy,sx,sy})`; preset `WIDE` (totale), `CAM2` (mezza figura a due), `CU_C`/`CU_S` (PP cliente/te), `MT` (stretta); `camMix(a,b,k)`; `drift(c,t,'c'|t0,vx,vy,vz)`; `breathOf`, `swayOf`.
- Transizioni: taglio con rullo (`sweep` in renderFilm, lastra rosa), cambio fase del cielo (alba/tramonto), pull-back/push camMix, `shotAt(t)` sceglie la ripresa; curve `eio, eo, ei, back, ss, seg, lerp`.
## Regole imparate
- Movimento continuo: deriva + spinta lenta (vz) + respiro/sway su ogni ripresa; parallasse cielo/prato/primo piano (ovk, px).
- Inquadrature variate: alterna PP (z~4.3), mezza figura, totale (z .55); mai due riprese uguali di fila.
- Niente erba gigante in primo piano in ogni scena: `fgBig` solo con `CAM.z<3` e non in tutte.
- Sottotitoli >= 1,8 s (subs.py li allunga); max 2 righe; striscia a y~1352, sopra la fascia bassa libera.
- Zona sicura: `ZONA` in motore.js = centro x=540, margini ~85, libere solo y<250, y>1470, angolo x>900,y>950. Le camere di questo reel sono a sx~492 (vedi difetti): nei nuovi reel usa sx=540.
## Suoni (opus-sound-layer, libreria in `$SL`, percorso in `~/.fammi-un-reel/percorsi.sh`)
Famiglia: carta (paper/*), timbri (tap/own-ov-*), tonfi (thump), tick orologio, pop/bolle, swish/whoosh, boom, key, chime. ID scelti: tabella `SND` in `build()` di scene.js
(78 cue, esempio in `audio/cues.ref.json`). Eroi: notte=thump/fs-389665+boom/fs-13862, zitto=hit/fs-452609+boom/fs-636624, alba=paper/own-ov-1e108f5d+thump, domande=tap/own-ov-c154424d+thump/fs-405537.
`CREDITS` elenca le licenze (CC0): aggiornarlo con i suoni davvero usati. Silenzio voluto: `silence_from` sul cue + `silence()` in scene.js.
## Musica
`music/score.py` (jazz lo-fi Re dorico, ~100 bpm, strumenti LIB sampler CC0 + sintesi) -> `music/score.wav`. Mappa del tempo e colpi in `music/ancore.json`
(`an`=[parola,battito], `mute`, `eroi`, `accordo_ingresso`). Nuovo reel: riscrivere ancore.json (le sezioni A/B/... del .py seguono i battiti).
## Comandi
`sh build.sh <cartella-progetto> <nome-uscita>` (env LIB, SOUND). Anteprima fotogramma: apri la pagina con `window.render(t)`. `python3 tools/motion.py film.mp4`; `python3 tools/quickqa.py audio`.
## Difetti noti
- Camere centrate su x~492 invece di 540 (mantenuto per fotogrammi identici).
- `cdpBubble` (motore.js) ha il testo «CI DEVO PENSARE» scritto dentro; `panel/shop/todayScene/listContent` sono specifici del copione.
- `score.py`: accordi e sezioni legati ai battiti di questo copione; solo le ancore sono configurabili.
- `subs.py` automatico spezza a punteggiatura: per qualita' scrivere `sottotitoli.json` (vedi examples/).
