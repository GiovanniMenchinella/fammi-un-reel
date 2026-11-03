// SCENE.JS — il CONTENUTO del reel (l'unica parte da riscrivere per un nuovo reel in stile Risograph).
// Contiene: DUR, elenco delle riprese agganciate alle parole (shots), colpi di registro (KICKS), suoni (build),
// una funzione per ogni ripresa in SHOT (disegna il fotogramma al tempo t) e i pezzi disegnati solo per questo copione.
// w('S11',3) = secondo in cui la parola 3 della scena S11 del file voce (vo-timing.json) inizia. Mai secondi scritti a mano.
// Il motore (motore.js) non va toccato: camere, curve, personaggi, sfondi, transizioni sono lì.
import { g, W, H, clear, rect, rrect, line, circle, ellipse, poly, text, over, layer, measure, inkA, ring } from './draw.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash } from '/core/lib.js';
import { person, chair, table, PAL, bust } from './chars.js';
import { sky, ground, sunPos, sunClock, bubble, bubblePath, priceTag, tagString, shield, cloud, smallSun, qmark, arrow, wordLines, sheet, envelope, badge, meadow, clouds, birds, cup, floaters, foreground, fgBig } from './props.js';

import { setDR, WE, WD, setShots, setKicks, CAM, CAM2, CU_C, CU_S, CXp, DR, DW, EV, HEAD, HYp, HZ, MOUTH, NOSUB, POSE, Q, SHOTS, SXp, TNOW, TX, TXp, WIDE, addText, backdrop, blinkAt, breathOf, cam, camMix, cdpBubble, dhit, drift, ev, id, idT, ko, mouthOf, pk, popText, poseMix, regist, scene2, setDW, shotAt, step, swayOf, talk, w, ws, wsO } from './motore.js';
export const DUR = 70.07;
export function shots() {
  return [
    ['hook', 0, w('S02', 0)], ['rewind', w('S02', 0), w('S03', 1)], ['hunt', w('S03', 1), w('S04', 0)], ['tardi', w('S04', 0), w('S05', 0)],
    ['moon', w('S05', 0), w('S06', 0)], ['empty', w('S06', 0), w('S07', 0)], ['flyers', w('S07', 0), w('S08', 0)], ['clock', w('S08', 0), w('S09', 1)],
    ['q1', w('S09', 1), w('S10', 0)], ['story', w('S10', 0), w('S11', 0)], ['q2', w('S11', 0), w('S11', 3)], ['copies', w('S11', 3), w('S12', 0)],
    ['zitto', w('S12', 0), w('S13', 0)], ['fill', w('S13', 0), w('S14', 0)], ['afternoon', w('S14', 0), w('S15', 0)], ['price', w('S15', 0), w('S16', 0)],
    ['repeat', w('S16', 0), w('S17', 0)], ['check', w('S17', 0), w('S18', 0)], ['sunset2', w('S18', 0), w('S19', 0)], ['sunrise', w('S19', 0), w('S20', 0)],
    ['list', w('S20', 0), DUR + 1],
  ];
}
export function build() {
  setShots(shots());
  EV.length = 0;
  setKicks([[0.06, 9], [w('S01', 5), 9], [w('S01', 6), 7], [w('S01', 7), 11], [w('S01', 12), 8], [w('S02', 0), 6], [w('S02', 6), 9], [w('S03', 1), 5],
    [w('S04', 4), 12], [w('S05', 0), 9], [w('S07', 11), 8], [w('S08', 0), 10], [w('S08', 5), 7], [w('S08', 6), 9], [w('S09', 1), 7], [w('S09', 7), 6],
    [w('S10', 2), 9], [w('S11', 0), 6], [w('S11', 3), 7], [w('S11', 10), 11], [w('S13', 4), 8], [w('S13', 7), 8], [w('S14', 0), 6], [w('S15', 3), 10],
    [w('S15', 6), 8], [w('S16', 7), 7], [w('S17', 7), 8], [w('S18', 0), 8], [w('S18', 7), 9], [w('S19', 2), 12], [w('S20', 11), 12], [w('S20', 17), 7]]);
  // cue sonori (suoni veri della libreria opus-sound-layer), ognuno dal tempo dell'azione che lo provoca
  const SND = {
    feed: 'paper/own-ov-ab7f390e', clackP: 'paper/own-ov-1e108f5d', slide: 'paper/fs-484920-page-slides-1-3', turnA: 'paper/fs-151221-page-turn-2-2',
    turnB: 'paper/fs-442857-page-turn-1', turnC: 'paper/fs-614080-page-turn-2-2', turnD: 'paper/fs-397551-page-turn-04-wav-3', throwP: 'paper/fs-389442-paper-throw-into-air-fuller-3',
    stroke: 'paper/fs-428338-underlining-stroke-on-paper-1', rub: 'paper/fs-140463-packaging-paper-rub-sliding-1',
    stampC: 'tap/own-ov-e5f3310d', stampB: 'tap/own-ov-c154424d',
    thTable: 'thump/fs-454222-thud-pint-glass-beer-down-on-1', thLow: 'thump/fs-389665-thump-close-wav-2', thA: 'thump/fs-405537-thud-2-wav-1', thB: 'thump/fs-187136-body-fall-wav-1',
    thCloth: 'thump/fs-389999-thump-cloth-1', thDull: 'thump/fs-264879-three-dull-thumps-with-hamme-1',
    tickA: 'tick/fs-199066-clock-tick-tock-1', tickB: 'tick/fs-199066-clock-tick-tock-2', tickC: 'tick/fs-199066-clock-tick-tock-3', tickS: 'tick/fs-130388-clock-ticking-2', tickF: 'tick/fs-188033-ticking-clock-1',
    popA: 'pop/fs-269583-bubble-1', popB: 'pop/fs-253956-bubble-pop-1', popC: 'pop/fs-254892-bubble-pop-out-1', popK: 'pop/fs-503162-mouth-pops-magic-bottle-cork-3', popD: 'pop/fs-206152-bottlepop44-wav-1',
    swA: 'swish/fs-14175-27-wav-1', swB: 'swish/fs-14171-23-wav-1', swC: 'swish/fs-14175-27-wav-2', swD: 'swish/fs-14176-28-wav-3',
    whP: 'whoosh/fs-147285-fh-paper-swipe-surface2-shor-1', whL: 'whoosh/fs-147281-fh-paper-swipe-surface2-long-1', whA: 'whoosh/fs-30241-swoop2g-flac-1', whB: 'whoosh/fs-30240-swoop1-flac-1',
    trans: 'transition/fs-179779-wipe2-wav-1', revL: 'reverse/fs-503804-reverse-fx-2-wav-1', revS: 'reverse/fs-503803-reverse-fx-13-wav-1',
    boomL: 'boom/fs-13862-10-wav-1', boomD: 'boom/fs-636624-deep-hit-2', boomS: 'boom/fs-13875-23-wav-1', hitW: 'hit/fs-452609-door-wood-old-heavy-kick-ope-1',
    ding: 'chime/fs-127149-ding-wav-1', glass: 'chime/fs-404104-glass-ding-3',
    swBr: 'swish/fs-14193-45-wav-1', popS: 'pop/fs-347353-squeaky-cork-pull-1', popW: 'pop/fs-187342-wine-bottle-opening-wav-1', crack: 'hit/fs-269028-face-punch-3-1',
    turnE: 'paper/fs-397550-page-turn-03-wav-2', tickT: 'tick/fs-403001-clock-tick-tik-tak-2', flash: 'transition/fs-582411-short-flashback-transition-1',
    wide3: 'transition/fs-447494-a-wide-variety-of-wooshes-ma-3', swE: 'swish/fs-14176-28-wav-3',
    keyA: 'key/fs-194795-vintage-keyboard-1-1', keyB: 'key/fs-194796-vintage-keyboard-2-1', keyC: 'key/fs-194797-vintage-keyboard-3-1',
  };
  const sx = (id, t, sound, o = {}) => ev(t, 'sfx', { id, sound: sound.split('+').map(k => SND[k] || k).join('+'), ...o });
  const W2 = (s, i) => w(s, i);
  // 1 · aggancio
  sx('rosa', .31, 'feed', { visual: 'move', pan: .2 });                         // la lastra rosa passa col rullo (velocità massima a metà passata)
  sx('fumetto', W2('S01', 4), 'popK', { visual: 'appear', pan: -.2 });
  sx('ci', W2('S01', 5), 'stampC', { visual: 'appear', pan: -.25 }); sx('devo', W2('S01', 6), 'stampC+keyB', { visual: 'appear', pan: -.15 }); sx('pensare', W2('S01', 7), 'stampB+stampC', { visual: 'appear', pan: -.2 });
  sx('pullback', W2('S01', 8) + .375, 'whP', { visual: 'move' });
  sx('barra', W2('S01', 12), 'rub', { visual: 'appear' });
  // 2 · riavvolgimento e orologio
  sx('taglio1', W2('S02', 0), 'trans', { visual: 'cut' });
  sx('riavvolgi', W2('S02', 0) + 1.05, 'flash', {});
  sx('tacca', W2('S02', 5), 'tickT', { pan: .2 });
  sx('spicchio', W2('S02', 7) + .3, 'tickS', { visual: 'land', pan: .1 });
  // 3 · i fumetti provati
  sx('taglio2', W2('S03', 1), 'swBr', { visual: 'cut' });
  [[0, W2('S03', 2), 'popB+tickT'], [2, W2('S03', 5), 'popS'], [4, W2('S03', 9), 'popW']].forEach(([i, t, snd]) => sx('prova' + i, t, snd, { visual: 'appear', pan: -.3 }));
  // 4 · la notte
  sx('taglio3', W2('S04', 0), 'whP', { visual: 'cut' });
  sx('notte', W2('S04', 4) + .275, 'thLow+boomL', { weight: 'hero', visual: 'move' });
  // 5 · luna, push nel fumetto
  sx('luna', W2('S05', 0), 'clackP', { visual: 'cut' });
  sx('push', W2('S06', 0) - .1, 'wide3', { visual: 'move' });
  // 6 · fumetto vuoto
  sx('vuoto', W2('S06', 0) + .3, 'popW+tickF', { visual: 'appear', pan: -.2 });
  sx('righe', W2('S06', 7), 'tickF', { pan: -.2 });
  sx('freccia', W2('S06', 9) + .44, 'stroke', { visual: 'move', pan: -.1 });
  // 7 · volantini
  sx('taglio4', W2('S07', 0), 'swA', { visual: 'cut' });
  sx('suo', W2('S07', 2) + .1, 'popS', { visual: 'appear', pan: .3 });
  sx('tuo', W2('S07', 6) + .1, 'popB', { visual: 'appear', pan: -.3 });
  sx('volantini', W2('S07', 10) + .2, 'throwP', { visual: 'move', pan: .1 });
  // 8 · alba: il metodo
  sx('alba', W2('S08', 0), 'clackP+thLow', { weight: 'hero', visual: 'cut', build: true });
  sx('albaRev', W2('S08', 0), 'revL', {});
  sx('spicchio2', W2('S08', 3) + .35, 'tickS', { visual: 'land', pan: .1 });
  sx('titolo2', W2('S08', 4), 'turnC', { visual: 'appear' });
  sx('dom1', W2('S08', 5), 'thA', { visual: 'land', pan: .15 }); sx('dom2', W2('S08', 6), 'thB', { visual: 'land', pan: .25 });
  sx('prima', W2('S09', 0) + .5, 'whL', { visual: 'move' });
  // 9-11 · le domande
  sx('taglio5', W2('S09', 1), 'popD', { visual: 'cut', pan: -.3 });
  sx('adesso', W2('S09', 7), 'tickS+glass', { visual: 'appear', pan: .35 });
  sx('taglio6', W2('S10', 0) + .05, 'turnE', { visual: 'cut', pan: -.3 });
  sx('fulmine', W2('S10', 2) + .05, 'crack', { pan: -.3 });
  sx('vign3', W2('S10', 4) + .11, 'turnB', { pan: -.3 });
  sx('taglio7', W2('S11', 0), 'popD', { visual: 'cut', pan: -.3 });
  // 12 · le copie
  sx('foglio', W2('S11', 3), 'feed', { visual: 'cut' });
  sx('titolo6', W2('S11', 3) + .15, 'stroke', { visual: 'appear' });
  [0, 2, 3, 4].forEach(k => sx('copia' + k, copyT(k) + .09, ['feed', '', 'turnC', 'turnD', 'slide'][k], { visual: 'move', pan: .1 * k }));
  sx('timbro', W2('S11', 10), 'stampB+thA', { visual: 'appear' });
  // 13 · "E poi stai zitto." — il momento forte, con l'arresto prima
  sx('zitto', W2('S12', 3), 'hitW+boomD', { weight: 'hero', visual: 'cut', stop_before: true, silence_from: 41.4 });
  sx('zittoCorpo', W2('S12', 3), 'thLow', { weight: 'hero' });
  // 14 · il cliente si spiega
  sx('alza', W2('S13', 0) + .55, 'whP', { visual: 'move' });
  sx('rullo', W2('S13', 4) + .2, 'rub', { visual: 'move', pan: .1 });
  sx('busto', W2('S13', 7), 'keyC', { visual: 'appear', pan: .2 });
  // 15-17 · il prezzo
  sx('taglio8', W2('S14', 0), 'swBr', { visual: 'cut' });
  sx('cartellino', W2('S14', 6) + .1, 'swD', { visual: 'move' });
  sx('taglio9', W2('S15', 0), 'swE', { visual: 'cut' });
  sx('atterra', W2('S15', 3), 'thTable', { visual: 'land', pan: .05 });
  sx('scudoSu', W2('S15', 4) + .05, 'swBr', { visual: 'move', pan: -.2 });
  sx('scudoGiu', W2('S15', 6) + .2, 'thDull', { pan: -.2 });
    sx('copiaVia', W2('S16', 1) + .1, 'throwP', { pan: .3 }); sx('copiaGiu', W2('S16', 7), 'turnA', { visual: 'land', pan: -.3 });
  // 18 · le spunte
    sx('chiedi', W2('S17', 2), 'popD', { visual: 'appear', pan: -.3 });
  sx('spunta0', W2('S17', 3) + .07, 'keyA', { pan: .3 }); sx('spunta1', W2('S17', 5) + .07, 'keyB', { pan: .3 });
  sx('decidere', W2('S17', 7) + .07, 'keyC+ding', { pan: .3 });
  // 19-20 · fine → inizio
  sx('tramonto', W2('S18', 0), 'clackP+slide', { visual: 'cut' });
  sx('orizzonte', W2('S18', 7), 'thLow+tickS', { visual: 'land' });
  sx('alba2Rev', W2('S19', 2), 'revS', {});
  sx('alba2', W2('S19', 2), 'clackP+boomL', { weight: 'hero', visual: 'move', build: true });
  sx('stretta', W2('S19', 2) + .65, 'thCloth', { pan: 0 });
  // 21 · invito
  sx('foglioSu', W2('S20', 0) + .05, 'whP', { visual: 'move' });
  [0, 3].forEach(k => sx('riga' + k, listRowT(k), 'tickF', { pan: -.2 }));
  sx('commenta', W2('S20', 10), 'popB', { visual: 'appear' });
  sx('domande', W2('S20', 11), 'stampB+thA', { weight: 'hero', visual: 'appear', build: true });
  sx('domandeTimbro', W2('S20', 11), 'stampC', { weight: 'hero' });
  sx('piega1', W2('S20', 15) + .12, 'turnB', { visual: 'move' }); sx('piega2', W2('S20', 15) + .42, 'turnC', { visual: 'move' });
  sx('sigillo', W2('S20', 17) + .4, 'stampB', { visual: 'land' });
  sx('vola', 69.9, 'whB', { visual: 'move', pan: .4 });
  ev(0, 'vo', { file: 'vo.mp3' });
}
const copyT = k => [w('S11', 5), w('S11', 6), w('S11', 7), w('S11', 8), w('S11', 8) + .26][k] + .02;
const listRowT = k => w('S20', 2) + .1 + k * .22;
const MT = { z: 1.45, fx: 505, fy: 975, sx: 490, sy: 1000 };      // mezza figura stretta sul tavolo
export const SHOT = {
  // 1 · PP del cliente al tramonto → il fumetto parola per parola → pull-back sul tavolo, il prezzo cancellato
  hook(t) {
    const tt = step(t);
    const p0 = w('S01', 8);
    const k = eio(seg(t, p0, p0 + .75));
    const cu = { ...CU_C, z: lerp(3.95, 4.6, seg(t, 0, p0)) };
    const dx = -75 * Math.min(t, p0) * (1 - k) + 80 * Math.max(0, t - p0 - .6);
    setDW({ x: dx, y: 0 }); setDR({ x: dx * .3, y: 0 });
    const c = camMix(cu, MT, k); cam({ ...c, sx: c.sx + dx });
    const hy = ws([0, HZ])[1];
    const arcP = sunPos(.9, { cx: 492, hy, rx: 470, ry: 760 });
    backdrop({ phase: .9, sunXY: [lerp(900, arcP[0], k), lerp(560, arcP[1], k)], sunR: lerp(230, 110, k), birds: true });
    const talkC = talk(tt, [[w('S01', 5), WE.S01[7] - .1]]);
    const cp = poseMix(POSE.table, POSE.cross, ss(seg(tt, 2.7, 3.1)));
    scene2(t, { ...poseMix(POSE.table, POSE.chin, ss(seg(tt, 3.5, 4.0))), brow: ss(seg(tt, 3.5, 4.0)) * -.8, headTilt: -.04 },
      { ...cp, talk: talkC, headTilt: ss(seg(tt, w('S01', 4), w('S01', 4) + .3)) * -.06 + (tt > 3.3 ? .08 : 0), blink: tt > .5 && tt < .6 },
      () => {
        const tx = TXp + 20, ty = HYp - 78;
        rrect(tx - 8, ty - 60, 16, 60, 6, [1, .3, 0]);
        priceTag(tx, ty - 104, 1.15, -.06 + Math.sin(t * 2.2) * .03, [1, 0, 0]);
        const kb = ss(seg(t, w('S01', 12), w('S01', 12) + .22));
        if (kb > 0) { g.save(); g.beginPath(); g.rect(tx - 140, ty - 260, 280 * kb, 300); g.clip(); line([[tx - 110, ty - 40], [tx + 120, ty - 176]], 32, [0, 1, 1], 'butt'); g.restore(); }
      });
    id();
    const g0 = w('S01', 4);
    const gr = back(clamp((t - g0) / .3, 0, 1), 1.6);
    if (gr > 0) {
      const m = wsO(mouthOf('c'));
      const bw = lerp(520, 560, k) * gr, bh = lerp(400, 280, k) * gr;
      const cx = lerp(m[0], lerp(320, 480, k), gr), cy = lerp(m[1], lerp(680, 470, k), gr);
      const words = [pk(t, w('S01', 5)), pk(t, w('S01', 6)), pk(t, w('S01', 7))];
      cdpBubble(cx, cy, bw, bh, m, words, lerp(100, 96, k) * gr, gr >= 1 ? 'cdp1' : null);
    }
    return {};
  },
  // 2 · totale: crane su, il sole si riavvolge lungo l'arco, diventa orologio: spicchio dei primi 5 minuti
  rewind(t) {
    const a = w('S02', 0);
    const cr = eio(seg(t, a, a + 1.25));
    cam(drift({ ...WIDE, sy: lerp(1150, 1600, cr) }, t, a, 110, 0, 0, .12));
    const ph = lerp(.9, .12, eio(seg(t, a + .05, a + 1.2)));
    const hy = ws([0, HZ])[1];
    const arcP = sunPos(ph, { cx: 492, hy, rx: 400, ry: 820 });
    const pk2 = eo(seg(t, w('S02', 4), w('S02', 5) + .25));
    const sxy = [lerp(arcP[0], 470, pk2), lerp(arcP[1], 700, pk2)];
    const r = lerp(130, 310, pk2) * (1 + .012 * Math.max(0, t - w('S02', 5)));
    const clock = { clock: ss(seg(t, w('S02', 5), w('S02', 6))), wedge: eio(seg(t, w('S02', 6), w('S02', 7) + .3)), hand: Math.PI / 6 * eio(seg(t, w('S02', 6), w('S02', 7) + .3)), hand2: -.6 };
    backdrop({ phase: ph, sunXY: sxy, sunR: r, clock, birds: true });
    scene2(t, { ...POSE.table, headTilt: .05 }, { ...POSE.cross });
    id();
    if (t >= w('S02', 5) + .05) {
      const kk = pk(t, w('S02', 5) + .05, .2);
      g.save(); g.beginPath(); g.rect(-200, 0, lerp(80, W + 200, kk), H); g.clip();
      dhit('5 MINUTI', 470, 1190, 128);
      g.restore();
      addText('5min', '5 MINUTI', 470 - 300, 1085, 470 + 310, 1200);
    }
    return {};
  },
  // 3 · mezza figura di te: peschi fumetti uno dopo l'altro, il sole corre al tramonto
  hunt(t) {
    const tt = step(t);
    const a = w('S03', 1), b = w('S04', 0);
    cam(drift({ z: 2.0, fx: 300, fy: 950, sx: 320, sy: 1000 }, t, 'c', 90, 0, .012, .4));
    const ph = lerp(.28, .93, ss(seg(t, a, b - .2)));
    backdrop({ phase: ph, sunR: 96, arcCx: 560, arcRx: 430, arcRy: 640, birds: true });
    const hits = [w('S03', 2), w('S03', 4), w('S03', 5), w('S03', 7), w('S03', 9)];
    let hi = -1; for (let i = 0; i < hits.length; i++) if (tt >= hits[i]) hi = i;
    const up = hi >= 0 ? 1 - ss(seg(tt, hits[hi] + .18, hits[hi] + .34)) : 0;
    const sp = hi >= 0 && hi % 2 === 0 ? poseMix(POSE.open, POSE.up, up) : poseMix(POSE.open, POSE.point, up * .8);
    scene2(t, { ...sp, headTilt: hi % 2 ? .08 : -.1, brow: -.6, talk: talk(tt, [[a + .3, b - .4]]) * .6, lean: .1 }, { ...POSE.cross, headTilt: .1, look: -2 });
    id();
    const glyph = ['...', '!', '?!', '~', '...'];
    const m = wsO(mouthOf('s', .1));
    for (let i = 0; i < hits.length; i++) {
      const lt = t - hits[i]; if (lt < 0 || lt > .42) continue;
      const sc = lt < .32 ? back(clamp(lt / .14, 0, 1), 2) : 1 - ss((lt - .32) / .1);
      const px = [330, 560, 250, 600, 420][i], py = [560, 430, 640, 600, 470][i];
      const rr = [-.12, .1, -.05, .14, -.08][i], dx = (m[0] - px) / Math.max(sc, .01), dy = (m[1] - py) / Math.max(sc, .01);
      g.save(); g.translate(px, py); g.scale(sc, sc); g.rotate(rr);
      bubble(0, 0, 300, 190, 44, (dx * Math.cos(-rr) - dy * Math.sin(-rr)) * .55, (dx * Math.sin(-rr) + dy * Math.cos(-rr)) * .55, [1, 0, 0]);
      if (glyph[i] === '~') wordLines(-110, -18, 220, 2, 50, [0, 0, 0], i + 3);
      else ko(glyph[i], 0, 40, 124);
      g.restore();
    }
    return {};
  },
  // 4 · totale in carrello: il sole affonda su "tardi", la notte scende col rullo
  tardi(t) {
    const tt = step(t);
    const nt = w('S04', 4), a = w('S04', 0);
    cam(drift(WIDE, t, 'c', -120, 0, 0, .5));
    const ph = lerp(.93, 1.09, eio(seg(t, a, nt + .2)));
    const nightK = eio(seg(t, nt, nt + .55));
    const sp = { ...poseMix(POSE.up, POSE.table, ss(seg(tt, nt + .2, nt + .8))), headTilt: lerp(-.12, .22, ss(seg(tt, nt + .1, nt + .9))), brow: -.8 };
    backdrop({ phase: ph, sunR: 150, arcCx: 492, arcRx: 430, arcRy: 640, birds: true });
    scene2(t, sp, { ...POSE.cross, headTilt: .14 });
    if (nightK > 0) {
      idT();
      const sy = nightK * (H + 40);
      g.save(); g.beginPath(); g.rect(0, 0, W, sy); g.clip();
      backdrop({ phase: ph, sun: false, night: 1 });
      scene2(t, sp, { ...POSE.cross, headTilt: .14 }, null, 1);
      g.restore();
      idT(); rect(0, sy - 3, W, 6, [1, .7, 0]);
    }
    id();
    const m = wsO(mouthOf('s'));
    const bk = back(clamp((t - a) / .25, 0, 1), 1.8) * (1 - ss(seg(t, nt + .5, nt + .8)));
    if (bk > 0) { g.save(); g.translate(300, 820); g.scale(bk, bk); bubble(0, 0, 260, 170, 40, (m[0] - 300) / bk * .7, (m[1] - 820) / bk * .7, [1, 0, 0]); ko('!', 0, 44, 130); g.restore(); }
    return {};
  },
  // 5 · notte: il fumetto "CI DEVO PENSARE" appeso come una luna; push dentro il fumetto
  moon(t) {
    const a = w('S05', 0), b = w('S06', 0);
    const pz = ei(seg(t, w('S05', 7) - .1, b));
    cam(drift(WIDE, t, 'c', 100, 0, 0, .25));
    backdrop({ phase: .5, sun: false, night: 1 });
    // stelle che pulsano a passo due
    idT(); for (let i = 0; i < 14; i++) { const on = (Math.floor(t * 12) + i * 5) % 9 < 3; if (on) circle((i * 211 + 40) % W, 280 + (i * 137) % 700, 4, [0, 0, 0]); }
    scene2(t, { ...POSE.table, headTilt: .2, brow: -.8 }, { ...POSE.cross, talk: talk(step(t), [[a, a + 1.0]]) }, null, 1);
    id();
    const m = wsO(mouthOf('c'));
    const Z = lerp(1, 9, pz), cx = 480, cy = 600 + Math.sin(t * 1.3) * 10;
    g.save(); g.translate(cx, cy); g.scale(Z, Z); g.translate(-cx, -cy);
    const glow = eo(seg(t, a + .2, a + .8));
    const GL = [[.82, .36, 0], [.66, .28, 0], [.5, .2, 0]];
    for (let i = 3; i >= 1; i--) { const e = i * (52 + 6 * Math.sin(t * 2.4 + i)) * glow; rrect(cx - 320 - e, cy - 165 - e, 640 + 2 * e, 330 + 2 * e, 90 + i * 40, GL[3 - i]); }
    const roll = eio(seg(t, a, a + .35));
    g.save(); g.beginPath(); g.rect(-400, 0, lerp(520, W + 400, roll), H); g.clip();
    const n0 = TX.length;
    cdpBubble(cx, cy, 640, 330, m, [1, 1, 1], 118, Z < 1.3 ? 'cdp2' : null);
    const X0 = cx + DR.x, Y0 = cy + DR.y;
    for (let i = n0; i < TX.length; i++) { const b2 = TX[i]; b2.x0 = Math.round(X0 + (b2.x0 - X0) * Z); b2.x1 = Math.round(X0 + (b2.x1 - X0) * Z); b2.y0 = Math.round(Y0 + (b2.y0 - Y0) * Z); b2.y1 = Math.round(Y0 + (b2.y1 - Y0) * Z); }
    g.restore(); g.restore();
    return {};
  },
  // 6 · PP del cliente dentro la sua frase: il suo fumetto è vuoto, carta senza inchiostro; i cerchi del pensiero si allargano
  empty(t) {
    const tt = step(t);
    const a = w('S06', 0), b = w('S07', 0);
    const enter = eo(seg(t, a, a + .45));
    clear([0, lerp(1, .26, enter), 0]);
    const C0 = drift({ ...CU_C, z: lerp(4.5, 4.2, seg(t, a, b)), sx: lerp(760, 730, seg(t, a, b)) }, t, 'c', -55, 0, 0, .3);
    const hc = [C0.sx, C0.sy];
    for (let i = 0; i < 9; i++) { const r = 300 + ((i * 150 + (t - a) * 120) % 1350); ring(hc[0], hc[1], r, 44, [0, lerp(1, .5, enter), 0]); }
    cam(C0);
    const C = { kind: 'c', s: 1, dir: -1, ...poseMix(POSE.table, POSE.chin, ss(seg(tt, a + .8, a + 1.4))), headTilt: lerp(0, .12, ss(seg(tt, a + 1, a + 2))) + swayOf(t, 1), brow: -.6, blink: blinkAt(tt, .4), look: 2 + Math.sin(tt * 1.4), breath: breathOf(t, 2) };
    chair(CXp + 6, HYp + 4, 1, -1);
    layer(() => person(CXp, HYp, { ...C, part: 'body' }), 6);
    layer(() => person(CXp, HYp, { ...C, part: 'arm' }), 6);
    id();
    const m = wsO(mouthOf('c'));
    const bx = 390, by = 560, bw = 640, bh = 480;
    const gr = back(clamp((t - a - .25) / .35, 0, 1), 1.4);
    if (gr > 0) {
      g.save(); g.translate(m[0], m[1]); g.scale(gr, gr); g.translate(-m[0], -m[1]);
      bubble(bx, by, bw, bh, 90, m[0], m[1], [0, 0, 0]);
      g.setLineDash([22, 16]); g.lineDashOffset = -t * 40; g.lineWidth = 7; g.strokeStyle = inkA([.9, 0, 0]); g.beginPath(); g.roundRect(bx - bw / 2 + 18, by - bh / 2 + 18, bw - 36, bh - 36, 74); g.stroke(); g.setLineDash([]); g.lineDashOffset = 0;
      const fl = tt >= w('S06', 7) && tt < w('S06', 8) + .3 && (Math.floor(tt * 12) % 3 === 0);
      wordLines(bx - 240, by - 130, 480, 3, 62, fl ? [.6, 0, 0] : [.13, 0, 0], 4);
      const ak = ss(seg(t, w('S06', 9), w('S06', 11) + .3));
      g.setLineDash([14, 12]); g.lineWidth = 6; g.strokeStyle = inkA([.9, 0, 0]);
      g.beginPath(); g.arc(bx - 190, by + 120, 58, 0, Math.PI * 2); g.stroke();
      if (ak > .95) { g.beginPath(); g.arc(bx + 190, by + 120, 58, 0, Math.PI * 2); g.stroke(); }
      g.setLineDash([]);
      if (ak > 0) arrow(bx - 115, by + 120, lerp(bx - 115, bx + 115, ak), by + 120, 9, [.9, 0, 0], 18);
      g.restore();
    }
    return {};
  },
  // 7 · notte, mezza figura a due stretta: quello che dici tu diventa volantino; lui guarda altrove
  flyers(t) {
    const tt = step(t);
    const a = w('S07', 0), q = w('S07', 6), sb = w('S07', 10);
    cam(drift({ z: 1.5, fx: 505, fy: 965, sx: 490, sy: 1010 }, t, 'c', 85, 0, .01, .35));
    backdrop({ phase: .5, sun: false, night: 1 });
    const away = ss(seg(tt, sb + .1, sb + .5));
    scene2(t, { ...poseMix(POSE.table, POSE.point, ss(seg(tt, q, q + .3))), talk: talk(tt, [[q, sb + 1.2]]), lean: .12 * ss(seg(tt, q, q + .3)) },
      { ...POSE.cross, headTilt: lerp(.05, -.28, away), look: lerp(0, -3, away) }, null, 1);
    id();
    const mc = wsO(mouthOf('c'));
    const e1 = back(clamp((t - w('S07', 2)) / .3, 0, 1), 1.6) * (1 - ss(seg(t, q - .2, q)));
    if (e1 > 0) {
      g.save(); g.translate(720, 600); g.scale(e1, e1);
      bubble(0, 0, 280, 170, 44, (mc[0] - 720) / e1, (mc[1] - 600) / e1, [0, 0, 0]);
      g.setLineDash([14, 11]); g.lineWidth = 5; g.strokeStyle = inkA([.9, 0, 0]); g.beginPath(); g.roundRect(-124, -69, 248, 138, 32); g.stroke(); g.setLineDash([]);
      text('...', 0, 22, '800 76px Bricolage', [.5, 0, 0], 'center');
      g.restore();
    }
    const ms = wsO(mouthOf('s', .12));
    const e2 = back(clamp((t - q) / .3, 0, 1), 1.6);
    if (e2 > 0) {
      const shake = t > sb ? Math.sin(t * 60) * 4 * (1 - seg(t, sb, sb + 1)) : 0;
      g.save(); g.translate(330 + shake, 540); g.scale(e2, e2);
      bubble(0, 0, 440, 280, 50, (ms[0] - 330) / e2, (ms[1] - 540) / e2, [1, 0, 0]);
      burst(-120, -10, 74, [0, 0, 0]); ko('!', -120, 30, 96);
      wordLines(-30, -66, 200, 4, 42, [0, 0, 0], 9);
      g.restore();
    }
    for (let k = 0; k < 6; k++) {
      const t0 = sb + k * .17, lt = t - t0; if (lt < 0) continue;
      const fly = clamp(lt / .45, 0, 1), fall = clamp((lt - .45) / 1.1, 0, 1);
      const x0 = 350, y0 = 560, xh = 650 + k * 16, yh = 560 + (k % 3) * 80;
      const x = fly < 1 ? lerp(x0, xh, eo(fly)) : xh + Math.sin(fall * 6 + k) * 30 * (1 - fall) + fall * (k % 2 ? 60 : -20);
      const y = fly < 1 ? lerp(y0, yh, eo(fly)) - Math.sin(fly * Math.PI) * 90 : lerp(yh, 1250 + (k % 3) * 14, ei(fall));
      const r = fly < 1 ? lerp(0, 1.2, fly) + k : 1.2 + k + Math.sin(fall * 9 + k) * .6 * (1 - fall) + fall * 1.4 * (k % 2 ? 1 : -1);
      id(); g.translate(x, y); g.rotate(r); g.scale(1, fall >= 1 ? .3 : 1);
      rect(-62 + 6, -82 + 7, 124, 164, [.4, .3, 0]); rect(-62, -82, 124, 164, [0, 0, 0]);
      burst(0, -30, 34, [1, 0, 0]); ko('!', 0, -12, 48);
      rect(-44, 22, 88, 10, [.8, 0, 0]); rect(-44, 42, 60, 10, [.8, 0, 0]); rect(-44, 62, 76, 10, [.8, 0, 0]);
    }
    id();
    return {};
  },
  // 8 · alba, dettaglio: il sole-orologio, lo spicchio dei primi minuti, due "?" dentro; "Prima:" il primo vola via
  clock(t) {
    const a = w('S08', 0), pr = w('S09', 0);
    const push = eo(seg(t, a, w('S09', 1)));
    cam(drift({ z: .5, fx: 505, fy: 1060, sx: 492, sy: lerp(1600, 1640, push) }, t, 'c', 130, 0, 0, .08));
    const cx = 480, cy = lerp(720, 700, push), r = lerp(305, 330, push);
    const wedge = eio(seg(t, w('S08', 2), w('S08', 3) + .35));
    backdrop({ phase: .1, sunXY: [cx, cy], sunR: r, clock: { clock: 1, wedge, hand: Math.PI / 6 * wedge, hand2: -.6 }, birds: true });
    scene2(t, { ...POSE.table }, { ...POSE.cross });
    id();
    const qs = [[w('S08', 5), [548, 520], -.14, '1'], [w('S08', 6), [650, 630], .1, '2']];
    qs.forEach(([t0, p, rr, lab], i) => {
      const lt = t - t0; if (lt < -.25) return;
      let y = lt < 0 ? lerp(-200, p[1], ei(clamp((lt + .25) / .25, 0, 1))) : p[1] - Math.abs(Math.sin(lt * 9)) * 30 * Math.exp(-lt * 6) + Math.sin(t * 2 + i) * 6;
      let x = p[0], sc = 1, rot = rr + Math.sin(t * 1.7 + i * 2) * .05;
      if (i === 0 && t > pr) { const f = ei(seg(t, pr, pr + .55)); x = lerp(p[0], 360, f); y = lerp(y, 520, f); sc = lerp(1, 7, f); rot = lerp(rr, 0, f); }
      g.save(); g.translate(x, y); g.scale(sc, sc);
      layer(() => qmark(0, 0, 190, [1, 0, 0], rot, lab), 4);
      g.restore();
    });
    if (t >= w('S08', 4)) {
      const kk = pk(t, w('S08', 4), .2);
      g.save(); g.beginPath(); g.rect(-200, 0, lerp(80, W + 200, kk), H); g.clip();
      dhit('2 DOMANDE', 480, 1200, 124);
      g.restore();
      addText('2dom', '2 DOMANDE', 480 - 330, 1095, 480 + 340, 1210);
    }
    return {};
  },
  // 9 · mezza figura di te: "PERCHÉ ADESSO?"; la lancetta scatta su "adesso"
  q1(t) {
    const tt = step(t);
    const a = w('S09', 1), ad = w('S09', 7);
    cam(drift({ z: 2.1, fx: 310, fy: 940, sx: 290, sy: 1010 }, t, 'c', 80, 0, .012, .35));
    const hand = Math.PI / 6 + (t >= ad ? Math.PI / 6 * back(clamp((t - ad) / .2, 0, 1), 2) : 0);
    backdrop({ phase: .22, sunXY: [870, 300], sunR: 78, clock: { clock: 1, wedge: 1, hand, hand2: -.6 }, birds: true });
    if (t >= ad) { const rk = seg(t, ad, ad + .5); if (rk < 1) { idT(); g.beginPath(); g.arc(870 + DW.x * .15, 300, 78 + rk * 90, 0, Math.PI * 2); g.lineWidth = 14 * (1 - rk); g.strokeStyle = inkA([0, 1, 0]); over(() => g.stroke()); } }
    const gest = ss(seg(tt, a, a + .3)) * (1 - ss(seg(tt, ad + .4, ad + .9)) * .5);
    scene2(t, { ...poseMix(POSE.table, POSE.open, gest), talk: talk(tt, [[a, w('S09', 7) + .5]]), lean: .06, headTilt: tt > ad ? -.06 : 0 }, { ...POSE.table, headTilt: -.04 });
    id();
    const ms = wsO(mouthOf('s', .06));
    const e = back(clamp((t - a) / .28, 0, 1), 1.6);
    if (e > 0) {
      g.save(); g.translate(580, 560); g.scale(e, e);
      bubble(0, 0, 500, 300, 60, (ms[0] - 580) / e, (ms[1] - 560) / e, [1, 0, 0]);
      ko('PERCHÉ', 0, -18, 108); ko('ADESSO?', 0, 92, 108);
      badge(-230, -140, 40, '1');
      g.restore();
      if (e >= 1) addText('perche', 'PERCHÉ ADESSO?', 580 - 230, 560 - 110, 580 + 230, 560 + 110);
    }
    return {};
  },
  // 10 · mezza figura del cliente: il suo fumetto rosa è una colonna di tre vignette stampate una per volta
  story(t) {
    const tt = step(t);
    const a = w('S10', 0), b = w('S11', 0);
    const pz = seg(t, a, b);
    cam(drift({ z: lerp(1.7, 1.86, pz), fx: 730, fy: 898, sx: 760, sy: 770 }, t, 'c', -70, 0, 0, .25));
    backdrop({ phase: .25, sunXY: [900, 300], sunR: 70, clock: { clock: 1, wedge: 1, hand: Math.PI / 3, hand2: -.6 }, birds: true });
    scene2(t, { ...POSE.chin, headTilt: .06, brow: .3 }, { ...poseMix(POSE.table, POSE.open, ss(seg(tt, a, a + .3))), talk: talk(tt, [[a, w('S10', 4) + .45]]), lean: .05 + .03 * Math.sin(tt * 2.6) });
    id();
    const mc = wsO(mouthOf('c', .05));
    const open = eo(seg(t, a - .05, a + .35));
    const top = 262, full = 1000, hh = lerp(330, full, open), cx = 300, cy = top + hh / 2;
    bubble(cx, cy, 390, hh, 50, mc[0], mc[1], [0, 1, 0]);
    const pT = [a, w('S10', 2), w('S10', 4)];
    for (let i = 0; i < 3; i++) {
      const px = cx, py = top + 30 + 150 + i * 320;
      if (py + 150 > top + hh - 10) continue;
      const k = eio(seg(t, pT[i], pT[i] + .22));
      if (k <= 0) { rrect(px - 160, py - 150, 320, 300, 18, [0, .55, 0]); continue; }
      g.save(); g.beginPath(); g.roundRect(px - 160, py - 150, 320, 300, 18); g.clip();
      rect(px - 160, py - 150, 320, 300, [0, .55, 0]);
      g.beginPath(); g.rect(px - 160, py - 150, 320 * k, 300); g.clip();
      rect(px - 160, py - 150, 320, 300, [0, 0, 0]);
      panel(i, px, py, t - pT[i]);
      g.restore();
    }
    return {};
  },
  // 11 · primo piano largo di te: "Seconda:" il secondo "?"
  q2(t) {
    const tt = step(t);
    const a = w('S11', 0);
    cam(drift({ z: 2.7, fx: 290, fy: 925, sx: 320, sy: 990 }, t, 'c', 80, 0, .015, .35));
    backdrop({ phase: .27, sunXY: [880, 300], sunR: 80, clock: { clock: 1, wedge: 1, hand: Math.PI / 3, hand2: -.6 } });
    scene2(t, { ...poseMix(POSE.table, POSE.up, ss(seg(tt, a, a + .3)) * .6), talk: talk(tt, [[a, a + 1.6]]), lean: .06 }, { ...POSE.chin, headTilt: .05 });
    id();
    const ms = wsO(mouthOf('s', .06));
    const e = back(clamp((t - a) / .28, 0, 1), 1.6);
    if (e > 0) {
      g.save(); g.translate(660, 560); g.scale(e, e);
      bubble(0, 0, 360, 320, 60, (ms[0] - 660) / e, (ms[1] - 560) / e, [1, 0, 0]);
      ko('?', -6, 86, 250); badge(110, 84, 40, '2');
      g.restore();
    }
    return {};
  },
  // 12 · inserto: il foglio di "oggi" e le sue copie identiche; "?" timbrato; silenzio, lastre alla deriva
  copies(t) {
    const a = w('S11', 3), zt = w('S12', 0);
    const push = ss(seg(t, a, zt));
    setDW({ x: (t - a) * 70 - 110, y: 0 }); setDR({ x: (t - a) * 14 - 20, y: 0 });
    clear([.42, 0, .55]);
    for (let i = 0; i < 11; i++) rect(0, 120 + i * 190 - ((t - a) * 70) % 190, W, 14, [.62, 0, .75]);
    idT(); floaters(t, 0, 18);
    const Z = lerp(1, 1.14, push);
    g.setTransform(Z, 0, 0, Z, 480 * (1 - Z) + DW.x, 780 * (1 - Z));
    const n = 1 + [0, 1, 2, 3, 4].filter(k => t >= copyT(k)).length;
    const shakeK = t > w('S11', 10) ? Math.exp(-(t - w('S11', 10)) * 5) : 0;
    for (let k = n - 1; k >= 0; k--) {
      const arr = k === 0 ? eo(seg(t, a - .05, a + .3)) : eo(seg(t, copyT(k - 1), copyT(k - 1) + .18));
      const x = lerp(470, 430 + k * 40, k ? 1 : 0) + Math.sin(t * 50 + k) * 6 * shakeK, y = lerp(1900, 790 + k * 26, arr);
      const r = -.09 + k * .045 + Math.sin(t * 1.1 + k) * .012;
      sheet(x, y, 560, 720, r, (sw, sh) => todayScene(sw, sh), [.25, 0, .25]);
    }
    id();
    if (t >= a + .15) {
      const kk = pk(t, a + .15, .2);
      g.save(); g.beginPath(); g.rect(-200, 0, lerp(80, W + 200, kk), H); g.clip();
      dhit('6 MESI', 470, 380, 150);
      g.restore();
      addText('6mesi', '6 MESI', 470 - 260, 260, 470 + 270, 392);
    }
    const st = w('S11', 10);
    if (t >= st - .08) {
      const k = clamp((t - st + .08) / .08, 0, 1), sc = lerp(1.8, 1, k);
      g.save(); g.translate(600, 840); g.scale(sc, sc); g.rotate(.12);
      text('?', -10, 200, '800 600px Bricolage', [0, 0, 0], 'center');
      text('?', 0, 210, '800 560px Bricolage', [0, 1, 0], 'center');
      g.restore();
    }
    return {};
  },
  // 13 · PP di te: silenzio, poi su "zitto" il tuo fumetto diventa carta vuota in un campo pieno
  zitto(t) {
    const zt = w('S12', 3), a = w('S12', 0);
    const snap = t >= zt;
    const C = snap ? drift(CU_S, t, zt, 30, 0, .02, .4) : drift(CU_S, t, a, 60, 0, .02, .4);
    if (snap) { setDW({ x: DW.x + 60 * (zt - a), y: 0 }); setDR({ x: DW.x * .4, y: 0 }); C.sx += 60 * (zt - a); C.z *= 1 + .02 * (zt - a); }
    cam(C);
    if (snap) { clear([1, 1, 0]); idT(); for (let i = 0; i < 8; i++) { const r = 120 + ((i * 170 + (t - zt) * 150) % 1360); ring(700 + DR.x, 600, r, 56, [.5, .5, 0]); } }
    else backdrop({ phase: .3, sun: false, birds: true });
    cam(C);
    const S = { kind: 's', s: 1, dir: 1, ...POSE.table, talk: 0, blink: !snap && blinkAt(step(t), .3), brow: snap ? .2 : 0, headTilt: (snap ? .03 : 0) + swayOf(t, .5) * .6, breath: breathOf(t, 0) };
    chair(SXp - 6, HYp + 4, 1, 1);
    layer(() => person(SXp, HYp, { ...S, part: 'body' }), 6);
    layer(() => person(SXp, HYp, { ...S, part: 'arm' }), 6);
    id();
    const m = wsO(mouthOf('s'));
    const bx = 700, by = 600;
    if (!snap) { bubble(bx, by, 400, 380, 70, m[0], m[1], [1, 0, 0]); ko('?', bx - 10, by + 96, 290); badge(bx + 120, by + 90, 42, '2'); }
    else bubble(bx, by, 440, 410, 76, m[0], m[1], [0, 0, 0]);
    return {};
  },
  // 14 · il fumetto vuoto passa al cliente; il rosa lo riempie; dentro, il tuo profilo in viola
  fill(t) {
    const tt = step(t);
    const a = w('S13', 0), sp = w('S13', 4), ps = w('S13', 7);
    const pull = eio(seg(t, a + .1, a + 1.3));
    const M2 = { z: 1.4, fx: 505, fy: 955, sx: 490, sy: 1030 };
    const dx0 = 60 * (w('S12', 3) - w('S12', 0)) + 30 * (a - w('S12', 3)), dxf = dx0 + 60 * (t - a);
    setDW({ x: dxf, y: 0 }); setDR({ x: dxf * .2, y: 0 }); const cmf = camMix(CU_S, M2, pull); cam({ ...cmf, sx: cmf.sx + dxf });
    const lift = eio(seg(t, a, a + .9));
    backdrop({ phase: .3, sunXY: [940, 262], sunR: 62, clock: { clock: 1, wedge: 1, hand: Math.PI / 2.4, hand2: -.6 }, birds: true });
    idT();
    if (lift < 1) { rect(0, lift * (H + 30), W, H, [1, 1, 0]); rect(0, lift * (H + 30) - 4, W, 8, [1, 1, .3]); }
    scene2(t, { ...POSE.table, brow: .2, headTilt: .02, smile: t > ps + .3 }, { ...poseMix(POSE.table, POSE.open, ss(seg(tt, sp - .2, sp + .2))), talk: talk(tt, [[a + .5, w('S14', 0) - .2]]), lean: .06 });
    id();
    const mS = wsO(mouthOf('s')), mC = wsO(mouthOf('c', .06));
    const tailK = ss(seg(tt, a + .1, a + .8));
    const tip = [lerp(mS[0], mC[0], tailK), lerp(mS[1], mC[1], tailK)];
    const bx = lerp(700, 470, pull), by = lerp(600, 540, pull), bw = lerp(440, 720, pull), bh = lerp(410, 420, pull);
    bubble(bx, by, bw, bh, 80, tip[0], tip[1], [0, 0, 0]);
    const roll = eio(seg(t, sp - .05, sp + .45));
    if (roll > 0) {
      g.save(); g.beginPath(); g.rect(-200, 0, lerp(bx - bw / 2 - 40 + 200, bx + bw / 2 + 260, roll), H); g.clip();
      over(() => bubble(bx, by, bw, bh, 80, tip[0], tip[1], [0, 1, 0]));
      wordLines(bx - bw / 2 + 60, by - bh / 2 + 66, bw - 120, 2, 50, [0, 0, 0], 12, clamp((t - sp - .2) / .5, 0, 1));
      g.restore();
      const ak = eio(seg(t, sp + .3, ps));
      g.save(); g.beginPath(); g.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 80); g.clip();
      if (ak > 0) {
        over(() => cloud(bx - 230, by + 70 + Math.sin(t * 3) * 4, .95, [1, 0, 0], 0));
        arrow(bx - 120, by + 74, lerp(bx - 120, bx + 100, ak), by + 74, 13, [0, 0, 0]);
      }
      const pk2 = back(clamp((t - ps) / .25, 0, 1), 1.8);
      if (pk2 > 0) { g.save(); g.translate(bx + 235, by + 120); g.scale(pk2 * .95, pk2 * .95); over(() => bust('s')); g.restore(); }
      g.restore();
    }
    return {};
  },
  // 15 · il cielo: il sole-orologio gira veloce (il tempo passa); su "arriva dopo" il cartellino scende e la camera lo segue fino al tavolo
  afternoon(t) {
    const tt = step(t);
    const a = w('S14', 0), b = w('S15', 0), ar = w('S14', 6);
    const tr = seg(t, a, b);
    const down = eio(seg(t, ar + .05, b));
    const SKYC = { z: 1.0, fx: 505, fy: 720, sx: 490, sy: 900 };
    cam(drift(camMix(SKYC, MT, down), t, 'c', 80, 0, 0, .5));
    const ph = lerp(.3, .72, ss(tr));
    const sxy = [520 + (ph - .3) * 520, 560 - Math.sin((ph - .3) * 5) * 60 - down * 420];
    backdrop({ phase: ph, sunXY: sxy, sunR: lerp(210, 120, down), clock: { clock: 1, wedge: 1, hand: lerp(1.2, 14, ss(tr)), hand2: lerp(-.6, 1.6, tr) }, birds: true, secs: false });
    scene2(t, { ...POSE.table, talk: talk(tt, [[a + .2, a + 1.2]]) }, { ...POSE.table, talk: talk(tt, [[a + 1.1, a + 1.9]]), headTilt: tt > ar ? -.12 : 0 });
    if (t >= ar - .1) {
      cam(CAM);
      const d = eo(seg(t, ar - .1, ar + .45));
      const sw = Math.sin((t - ar) * 7) * .3 * Math.exp(-(t - ar) * 1.4);
      const top = [TXp, -300], len = lerp(300, 1050, d);
      const p = [top[0] + Math.sin(sw) * len, top[1] + Math.cos(sw) * len];
      tagString(top[0], top[1], p[0], p[1]);
      priceTag(p[0], p[1] + 96, 1.4, sw + Math.PI / 2, [1, 0, 0]);
    }
    id();
    return {};
  },
  // 16 · dettaglio sulle mani: il cartellino atterra su "prezzo"; lo scudo si alza e ridiscende su "difendi"; le mani si aprono
  price(t) {
    const tt = step(t);
    const a = w('S15', 0), pz = w('S15', 3), no = w('S15', 4), df = w('S15', 6);
    cam(drift({ z: 2.3, fx: 470, fy: 1005, sx: 480, sy: 1000 }, t, 'c', 70, 0, .01, .7));
    backdrop({ phase: .74, sun: false, birds: true });
    const raise = ss(seg(tt, no - .05, no + .15)) * (1 - ss(seg(tt, df, df + .22)));
    const sp = poseMix(POSE.table, { hand: [128, -150], handB: [112, -146] }, raise);
    const opn = ss(seg(tt, df + .2, df + .5));
    const up = eo(seg(t, no - .05, no + .14)) * (1 - eio(seg(t, df, df + .26)));
    const shieldDraw = () => { if (up > 0) layer(() => shield(SXp + 150, HYp - 40 - up * 150, .82, -.06 * up), 4); };
    scene2(t, { ...poseMix(sp, POSE.open, opn), smile: opn > .5, talk: talk(tt, [[a + .1, pz + .4]]), behind: shieldDraw }, { ...POSE.table, look: 1 },
      () => {
        const tx = TXp + 40, ty = HYp - 78;
        const fall = clamp((t - (pz - .35)) / .35, 0, 1);
        const bounce = t > pz ? Math.abs(Math.sin((t - pz) * 14)) * 30 * Math.exp(-(t - pz) * 7) : 0;
        const y = lerp(-300, ty - 50, ei(fall)) - bounce;
        if (fall > 0) priceTag(tx, y, 1.0, lerp(.6, 0, fall) + (t > pz ? Math.sin((t - pz) * 14) * .06 * Math.exp(-(t - pz) * 6) : 0), [1, 0, 0]);
      });
    id();
    return {};
  },
  // 17 · mezza figura a due stretta: dal fumetto del cliente esce una copia che finisce nel tuo
  repeat(t) {
    const tt = step(t);
    const a = w('S16', 0), rp = w('S16', 1), lu = w('S16', 7);
    cam(drift({ z: 1.45, fx: 505, fy: 950, sx: 490, sy: 1030 }, t, 'c', -80, 0, .01, .35));
    backdrop({ phase: .8, sunR: 100, arcCx: 492, arcRx: 420, arcRy: 700, birds: true });
    scene2(t, { ...POSE.open, talk: talk(tt, [[rp + .1, lu + .5]]), smile: tt < rp }, { ...POSE.chin, headTilt: lerp(0, -.08, ss(seg(tt, lu, lu + .3))), smile: tt > lu + .2 });
    id();
    const mC = wsO(mouthOf('c')), mS = wsO(mouthOf('s'));
    const orig = [705, 470];
    miniBubble(orig[0], orig[1], .95, mC);
    const k = eio(seg(t, rp, lu));
    if (t >= rp) {
      const p = [lerp(orig[0], 285, k), lerp(orig[1], 450, k) - Math.sin(k * Math.PI) * 150];
      const tip = k < .85 ? [p[0] + 30, p[1] + 220] : [lerp(p[0] + 30, mS[0], (k - .85) / .15), lerp(p[1] + 220, mS[1], (k - .85) / .15)];
      miniBubble(p[0], p[1], .95, tip, Math.sin(k * Math.PI) * .22);
    }
    return {};
  },
  // 18 · dettaglio sulla lista del cliente: tre caselle, tre spunte; l'ultima su "decidere"
  check(t) {
    const tt = step(t);
    const a = w('S17', 0), ch = w('S17', 2);
    const push = eio(seg(t, a + .2, w('S18', 0)));
    cam(drift(camMix({ z: 1.45, fx: 505, fy: 950, sx: 490, sy: 1030 }, { z: 2.0, fx: 640, fy: 900, sx: 580, sy: 980 }, push), t, 'c', 60, 0, 0, .4));
    backdrop({ phase: .84, sunR: 100, arcCx: 492, arcRx: 420, arcRy: 700, birds: true });
    scene2(t, { ...POSE.open, talk: talk(tt, [[ch - .1, ch + .6]]) }, { ...POSE.chin, talk: talk(tt, [[w('S17', 3), w('S17', 7) + .4]]) });
    id();
    const mS = wsO(mouthOf('s')), mC = wsO(mouthOf('c'));
    const e1 = back(clamp((t - ch) / .25, 0, 1), 1.6);
    if (e1 > 0) { const p = wsO([300, 660]); const z = e1 * CAM.z / 1.15; g.save(); g.translate(p[0], p[1]); g.scale(z, z); bubble(0, 0, 200, 190, 44, (mS[0] - p[0]) / z, (mS[1] - p[1]) / z, [1, 0, 0]); ko('?', 0, 56, 160); g.restore(); }
    const e2 = back(clamp((t - a - .1) / .3, 0, 1), 1.4);
    const p = wsO([690, 640]); const z2 = Math.max(.01, e2 * CAM.z / 1.15);
    g.save(); g.translate(p[0], p[1]); g.scale(z2, z2);
    bubble(0, 0, 360, 330, 60, (mC[0] - p[0]) / z2, (mC[1] - p[1]) / z2, [0, 1, 0]);
    const tk = [w('S17', 3), w('S17', 5), w('S17', 7)];
    for (let i = 0; i < 3; i++) {
      const yy = -100 + i * 96;
      rrect(-130, yy - 30, 60, 60, 10, [0, 0, 0]);
      rrect(-46, yy - 10, 170 - i * 24, 22, 11, [0, 0, 0]);
      const k = clamp((t - tk[i]) / .14, 0, 1);
      if (k > 0) { const pts = [[-122, yy], [-104, yy + 20], [-62, yy - 26]]; const L = k < .5 ? [pts[0], [lerp(pts[0][0], pts[1][0], k * 2), lerp(pts[0][1], pts[1][1], k * 2)]] : [pts[0], pts[1], [lerp(pts[1][0], pts[2][0], (k - .5) * 2), lerp(pts[1][1], pts[2][1], (k - .5) * 2)]]; over(() => line(L, 15, [1, 0, 0])); }
    }
    g.restore();
    return {};
  },
  // 19 · totale al tramonto in carrello (eco dell'apertura): torna "CI DEVO PENSARE"; il sole tocca l'orizzonte su "fine"
  sunset2(t) {
    const a = w('S18', 0), fi = w('S18', 7);
    const cr = eio(seg(t, a, a + 1.6));
    cam(drift({ ...WIDE, sy: lerp(1500, 1150, cr) }, t, 'c', -110, 0, 0, .5));
    const ph = lerp(.86, 1.0, eio(seg(t, a, fi)));
    backdrop({ phase: ph, sunR: 150, arcCx: 492, arcRx: 430, arcRy: 640, birds: true });
    scene2(t, { ...POSE.table, brow: -.6, headTilt: .1 }, { ...POSE.cross, talk: talk(step(t), [[a, a + 1.0]]) });
    id();
    const m = wsO(mouthOf('c'));
    const gr = back(clamp((t - a) / .3, 0, 1), 1.6);
    if (gr > 0) { g.save(); g.translate(m[0], m[1]); g.scale(gr, gr); g.translate(-m[0], -m[1]); cdpBubble(480, 560, 600, 300, m, [1, 1, 1], 110, gr >= 1 ? 'cdp3' : null); g.restore(); }
    return {};
  },
  // 20 · riavvolgimento: il sole torna indietro, il fumetto si de-stampa; alba a tre inchiostri, dettaglio della stretta di mano
  sunrise(t) {
    const tt = step(t);
    const a = w('S19', 0), ini = w('S19', 2), b = w('S20', 0);
    const rw = eio(seg(t, a + .05, ini));
    const push = eo(seg(t, ini, ini + .7));
    const dxw = -110 * (w('S19', 0) - w('S18', 0)) / 2 - 110 * (Math.min(t, ini) - a) + 60 * Math.max(0, t - ini);
    const cm2 = camMix(WIDE, { z: 2.4, fx: 505, fy: 985, sx: 490, sy: 1000 }, push);
    const dxe = dxw * (1 - push) + 60 * Math.max(0, t - ini) * push;
    setDW({ x: dxe, y: 0 }); setDR({ x: dxe * .5, y: 0 }); cam({ ...cm2, sx: cm2.sx + dxe });
    const hy = ws([0, HZ])[1];
    const ph = t < ini ? lerp(1.0, -.02, rw) : lerp(-.02, .07, seg(t, ini, b));
    backdrop({ phase: Math.max(0, ph), sunXY: sunPos(ph, { cx: 492, hy, rx: lerp(430, 520, push), ry: lerp(640, 900, push) }), sunR: lerp(150, 300, push), birds: true });
    const reach = ss(seg(tt, ini + .25, ini + .65));
    const shake = tt > ini + .65 ? Math.sin((tt - ini - .65) * 18) * 10 : 0;
    const my = -128 + shake;
    scene2(t, { ...poseMix(POSE.table, { hand: [TXp - SXp - 2, my], handB: [120, -86] }, reach), smile: tt > ini + .3, lean: .1 * reach, arms: 'over' },
      { ...poseMix(POSE.table, { hand: [CXp - TXp - 2, my], handB: [120, -86] }, reach), smile: tt > ini + .3, lean: .1 * reach });
    id();
    if (t < ini) {
      const m = wsO(mouthOf('c'));
      const gr = 1 - ei(seg(t, a + .05, ini - .1));
      if (gr > 0) { g.save(); g.translate(m[0], m[1]); g.scale(gr, gr); g.translate(-m[0], -m[1]); cdpBubble(480, 560, 600, 300, m, [1, 1, 1], 110, null); g.restore(); }
    }
    return {};
  },
  // 21 · chiusura in totale all'alba: il foglio con la lista; "COMMENTA DOMANDE"; il foglio si piega in busta e parte
  list(t) {
    const a = w('S20', 0), cm = w('S20', 10), dm = w('S20', 11), md = w('S20', 15), pv = w('S20', 17);
    cam(drift({ z: .62, fx: 505, fy: 1060, sx: 492, sy: 1140 }, t, 'c', 38, 0, .004, 0));
    backdrop({ phase: .1, sunXY: sunPos(.1, { cx: 492, hy: ws([0, HZ])[1], rx: 470, ry: 700 }), sunR: 170, birds: true });
    scene2(t, { ...POSE.table, smile: true, talk: 0 }, { ...POSE.table, smile: true });
    id();
    const up = eo(seg(t, a, a + .5));
    const f1 = eio(seg(t, md - .05, md + .3)), f2 = eio(seg(t, md + .25, md + .6));
    const fly = ei(seg(t, 69.15, 70.07));
    const bob = Math.sin((t - a) * 1.6) * 8;
    const sx = lerp(470, 1000, fly), sy = lerp(lerp(2500, 690, up), -160, fly) + bob * (1 - fly);
    const sw = 740, sh = 870;
    if (f2 < 1) foldSheet(t, sx, sy, sw, sh, f1, f2);
    else { const fl = eio(seg(t, pv + .05, pv + .4)); envelope(sx, sy, sw, sh / 3, Math.sin(fly * 4) * .25 * fly, fl, [.16, 0, 0]); }
    if (f1 <= 0 && up >= 1) addText('lista', 'LE DOMANDE', sx - sw / 2 + 60, sy - sh / 2 + 50 - 8, sx - sw / 2 + 60 + measure('LE DOMANDE', '800 92px Bricolage', 2), sy - sh / 2 + 135 + 8);
    if (t >= cm) {
      const k = back(clamp((t - cm) / .25, 0, 1), 1.5);
      const y = 1150;
      const punch = t >= dm ? 1 + .14 * Math.exp(-(t - dm) * 9) * Math.cos((t - dm) * 30) : 1;
      g.save(); g.translate(470, y); g.scale(k * punch, k * punch); g.rotate(-.02);
      const flash = t >= dm && t < dm + .13;
      if (flash) rrect(-520, -230, 1040, 460, 90, [0, 1, 1]);
      rrect(-380, -96, 760, 192, 40, flash ? [1, 1, 0] : [0, 1, 0]);
      poly([[-300, 90], [-250, 90], [-320, 150]], [0, 1, 0]);
      ko('COMMENTA', 0, -34, 52, 'center', 'Jost', 700);
      if (t >= dm && t < dm + .5) { const rk = seg(t, dm, dm + .5); g.lineWidth = 30 * (1 - rk); g.strokeStyle = inkA([0, 1, 1]); g.beginPath(); g.roundRect(-380 - rk * 160, -96 - rk * 110, 760 + rk * 320, 192 + rk * 220, 40 + rk * 60); g.stroke(); }
      if (t >= dm) { const kk = clamp((t - dm) / .06, 0, 1), s2 = lerp(1.5, 1, kk); g.save(); g.scale(s2, s2); text('DOMANDE', 0, 66, '800 112px Bricolage', [0, 0, 0], 'center', 'alphabetic', 2); over(() => text('DOMANDE', 7, 71, '800 112px Bricolage', [1, 0, 0], 'center', 'alphabetic', 2)); g.restore(); }
      g.restore();
      if (k >= 1 && t >= dm) addText('commenta', 'COMMENTA DOMANDE', 470 - 380, y - 96, 470 + 380, y + 96);
    }
    return {};
  },
};
// il foglio della lista che si piega in tre: prima il terzo alto, poi il terzo basso
function foldSheet(t, sx, sy, sw, sh, f1, f2) {
  g.save(); g.translate(sx, sy); g.rotate(lerp(-.03, 0, f1));
  const third = (y0, k, anchor, front) => {
    // disegna il terzo [y0, y0+sh/3] scalato in verticale attorno ad anchor; front = faccia stampata
    g.save(); g.translate(0, anchor); g.scale(1, Math.max(.001, k)); g.translate(0, -anchor);
    g.beginPath(); g.rect(-sw / 2, y0, sw, sh / 3); g.clip();
    rect(-sw / 2, y0, sw, sh / 3, front ? [0, 0, 0] : [.16, 0, 0]);
    if (front) listContent(t, sw, sh, f1 > 0, sx, sy);
    g.restore();
  };
  const shadowH = f2 >= .5 ? sh / 3 : f1 >= .5 ? sh * 2 / 3 : sh;
  const shadowY = f1 >= .5 ? -sh / 6 : -sh / 2;
  rect(-sw / 2 + 12, shadowY + 14, sw, shadowH, [.25, 0, .3]);
  third(-sh / 6, 1, 0, true);                                   // terzo centrale
  if (f2 < .5) third(sh / 6, 1 - f2 * 2, sh / 6, true);          // terzo basso, faccia
  if (f1 < .5) third(-sh / 2, 1 - f1 * 2, -sh / 6, true);        // terzo alto, faccia
  else { g.save(); g.translate(0, -sh / 6); g.scale(1, f1 * 2 - 1); rect(-sw / 2, 0, sw, sh / 3, [.16, 0, 0]); g.restore(); }
  if (f2 >= .5) { g.save(); g.translate(0, sh / 6); g.scale(1, f2 * 2 - 1); rect(-sw / 2, -sh / 3, sw, sh / 3, [.2, 0, 0]); g.restore(); }
  g.restore();
}

// stella "pubblicitaria"
function burst(x, y, r, c) {
  const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, rr = i % 2 ? r * .62 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  poly(pts, c);
}
// le tre vignette della storia del cliente
function panel(i, x, y, lt) {
  g.save(); g.translate(x, y);
  rect(-150, 70, 300, 80, [.35, 0, .7]);
  if (i === 0) { shop(0, 70, 1); smallSun(80, -80, 30); }
  else if (i === 1) {
    shop(0, 70, 1);
    const f = Math.floor(lt * 12) % 4 < 2 && lt < 1.2;
    cloud(10, -78, .9, [1, 0, 0], clamp(lt / .15, 0, 1));
    if (f) over(() => rect(-150, -150, 300, 300, [0, 0, .25]));
  } else {
    shop(0, 70, 1, true);
    cloud(-30, -90, .7, [1, 0, 0], 0);
    text('!', 92, 40, '800 190px Bricolage', [0, 1, 1], 'center');
  }
  g.restore();
}
function shop(x, y, s, broken) {
  g.save(); g.translate(x, y); g.scale(s, s);
  rect(-90, -110, 180, 110, [.75, 0, 0]);
  for (let i = 0; i < 6; i++) poly([[-100 + i * 34, -130], [-66 + i * 34, -130], [-66 + i * 34, -104], [-100 + i * 34, -104]], i % 2 ? [0, 1, 0] : [0, 0, 0]);
  rect(-26, -64, 40, 64, [0, 0, 0]);
  rect(30, -86, 44, 40, broken ? [1, 0, 1] : [0, 0, .6]);
  if (broken) line([[34, -82], [58, -60], [48, -50], [70, -48]], 4, [0, 0, 0]);
  g.restore();
}
// la scena di "oggi" stampata sul foglio (piccolo cliente al tavolo sotto la nuvola)
function todayScene(sw, sh) {
  rect(-sw / 2, -sh / 2, sw, sh * .62, [0, .12, 0]);
  rect(-sw / 2, sh * .12, sw, sh, [.3, 0, .8]);
  cloud(40, -sh * .26, 1.5, [1, 0, 0], 1);
  g.save(); g.translate(-40, sh * .22); g.scale(.82, .82);
  table(60, 0, 1);
  person(270, 0, { kind: 'c', dir: -1, s: 1, ...POSE.chin, headTilt: .2, brow: -.8 });
  g.restore();
  text('OGGI', -sw / 2 + 36, sh / 2 - 36, '800 46px Bricolage', [1, 0, 0], 'left', 'alphabetic', 4);
}
// fumetto rosa ridotto: la nuvola → il tuo profilo (le parole del cliente)
function miniBubble(x, y, s, tip, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const tx = (tip[0] - x) / s, ty = (tip[1] - y) / s;
  const c = Math.cos(-rot), sn = Math.sin(-rot);
  bubble(0, 0, 420, 300, 60, tx * c - ty * sn, tx * sn + ty * c, [0, 1, 0]);
  wordLines(-160, -90, 320, 1, 52, [0, 0, 0], 12);
  over(() => cloud(-110, 40, .62, [1, 0, 0], 0));
  arrow(-40, 40, 70, 40, 10, [0, 0, 0]);
  g.save(); g.beginPath(); g.roundRect(-210, -150, 420, 300, 60); g.clip(); g.translate(150, 96); g.scale(.62, .62); over(() => bust('s')); g.restore();
  g.restore();
}
// contenuto della lista delle domande
function listContent(t, sw, sh, folding, sx = 0, sy = 0) {
  const top = -sh / 2;
  text('LE DOMANDE', -sw / 2 + 60, top + 130, '800 92px Bricolage', [1, 0, 0], 'left', 'alphabetic', 2);
  over(() => rect(-sw / 2 + 60, top + 160, 300, 14, [0, 1, 0]));
  const rows = ['Perché adesso?', 'Tra 6 mesi?', null, null, null, null, null];
  for (let k = 0; k < rows.length; k++) {
    if (t < listRowT(k)) continue;
    const yy = top + 250 + k * 90;
    text('?', -sw / 2 + 80, yy + 18, '800 64px Bricolage', [0, 1, 0], 'center');
    if (rows[k]) { text(rows[k], -sw / 2 + 130, yy + 14, '600 46px Jost', [1, 0, 0], 'left'); if (!folding) addText('row' + k, rows[k], sx - sw / 2 + 130, sy + yy - 34, sx - sw / 2 + 130 + measure(rows[k], '600 46px Jost'), sy + yy + 16); }
    else wordLines(-sw / 2 + 130, yy, 420 - (k % 3) * 60, 1, 46, [.45, 0, 0], k + 20);
  }
}
// momento di silenzio prima della parola forte: [inizio, parola] (le lastre si separano piano, poi scatto a registro)
export const silence = () => [41.4, w('S12', 3)];
