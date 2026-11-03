// ============================================================================================================
// CONTENUTO del reel (l'unico file che cambia da un reel all'altro). Il motore sta in motore/ e non si tocca.
//   1. TEMPI    T = i momenti agganciati alle PAROLE della voce: w(frase, 'parola', k) = inizio, we() = fine.
//               frase = posizione (1,2,3…) o id 'S01'; k = n-esima volta che la parola compare (da 0).
//   2. CUES     sottotitoli: cue(frase, 'testo\nsu 2 righe', [parolaInizio,k], [parolaFine,k], {big:'ETICHETTA'})
//   3. MONDI    init(): sfondi disegnati una volta sola (LY.bank, LY.river…), con i pezzi del motore.
//   4. SCENE    una funzione per scena: sceneXxx(Ls, t) → { paper, bleed, rim, shake }. Camera = funzione di t.
//   5. SEQUENZA frameAt(t) sceglie la scena; TRANS = fioriture d'inchiostro fra scene; SUBPOS = dove stanno i sottotitoli.
//   6. EVENTI   events(): eventi sonori (type, t, gain) → audio/make_cues.py li trasforma nei suoni veri.
// Questo file è l'esempio del film «Ci devo pensare» (70 s, 20 frasi): copialo come modello e riscrivi 1-6.
// ============================================================================================================
import { mk, draw, drawSeq, mass, blot, TONE } from './motore/lib/ink.js';
import { ridgeFn, mountainLayer, cun, cliff, reed, ripple, vn2 } from './motore/lib/land.js';
import { hero, POSE, mixPose } from './motore/client.js';
import { coin, incense, smoke, brush, drop, rings, bridgeStrokes, bridgeWash, bridgeTexture, bridgeReflection, BR, deckY, treeStrokes, blossom, title, banner, brushWord, writeWord, plum, seal, VERM, cached } from './motore/props.js';
import { W, w, we, DUR, WORDS, SCENES, cue, finestre } from './motore/tempi.js';
import { FW, FH, SAFE, PAPER_RGB, camXf, useCam, paperOf, w2s, seg, tw, blitLayer, clipDo, mkLayer, fadeBand, walkPose, inscription, label, makeFrame } from './motore/base.js';
import { clamp, lerp, ss, eio, eo, ei, mulberry, vnoise } from '/core/lib.js';
export { DUR };
let LY = null, TMP = null, TMP2 = null;

// ---------------- 1. TEMPI ----------------
export const T = {
  // 1 — the client walks into the mist; the price stays
  hookMist: w('S01', 'ci'), gone: w('S01', 'pensare'), notFault: w('S01', 'non'), coin1: w('S01', 'prezzo'),
  // 2 — hard cut: the burnt incense (ECU); time rewinds to the first minutes
  cut2: w('S02', 'hai') - .04, ashFall: w('S02', 'perso'), rewind: w('S02', 'primi'), five: w('S02', 'cinque'),
  x3a: 7.42, x3b: 7.98,                                   // smoke thickens into mist
  // 3–4 — the brush tries to repaint the client in the mist, then runs dry
  try1: w('S03', 'cercano'), try2: w('S03', 'frase'), try3: w('S03', 'fine'),
  dip: w('S04', 'alla'), dry: w('S04', 'tardi'), hush0: 12.76, hush1: 13.3,          // 12.70 = measured end of «tardi» in vo.mp3
  x5a: 13.15, x5b: 13.75,                                 // ink bloom into the clean page
  // 5 — «Ci devo pensare» written, then ONE stroke
  title: w('S05', 'ci'), one: w('S05', 'una'), sola: w('S05', 'sola'),
  // 6–7 — the client, the empty ring, the advertising banners
  client: w('S06', 'cliente'), ring: w('S06', 'parole'), why6: w('S06', 'perché'),
  finche: w('S07', 'finché'), brushIn: w('S07', 'quello'), tu: w('S07', 'tu'), pub: w('S07', 'pubblicità'), pubEnd: we('S07', 'pubblicità'),
  // 8 — the ink lifts; water; incense lit; two drops
  lift: w('S08', 'quindi'), lit: w('S08', 'primi'), drop1: w('S08', 'due'), drop2: w('S08', 'domande'),
  // 9 — push into the first ring; the question
  q1: w('S09', 'prima'), q1text: w('S09', 'perché'), q1end: we('S09', 'adesso'),
  x10a: 33.18, x10b: 33.78,
  // 10 — the bridge breaks; the scene paints itself
  crack: w('S10', 'qualcosa'), succ: w('S10', 'successo'), tell: w('S10', 'fattelo'), tellEnd: we('S10', 'raccontare'),
  // 11 — second drop; six months; the flood
  q2: w('S11', 'seconda'), q2text: w('S11', 'se'), six: w('S11', 'sei'), same: w('S11', 'tutto'), what: w('S11', 'cosa'),
  sil0: 41.53,                                            // 41.47 = measured end of «succede?» in vo.mp3
  // 12 — silence; hard cut; the full stop
  cut12: w('S12', 'e') - .04, poise: w('S12', 'poi'), slam: w('S12', 'stai'), exit: w('S12', 'zitto'),
  // 13 — the dot becomes the keystone
  self: w('S13', 'lì'), spread: w('S13', 'cliente'), explain: w('S13', 'spiega'), serve: w('S13', 'servi'),
  // 14 — hard cut: incense half burnt
  cut14: w('S14', 'ma') - .08, later: w('S14', 'arriva'), dopo: w('S14', 'dopo'),
  x15a: 50.18, x15b: 50.68,
  // 15–18 — price at the keystone, the retrace, the step, the mist of the end
  price: w('S15', 'prezzo'), nodef: w('S15', 'non'), difendi: w('S15', 'difendi'),
  repeat: w('S16', 'ripeti'), him: w('S16', 'lui'),
  ask: w('S17', 'chiedi'), decide: w('S17', 'decidere'),
  end18: w('S18', 'ci'), evap: w('S18', 'non'), fine18: w('S18', 'fine'),
  // 19 — hard cut: the seal on «all'inizio»
  cut19: w('S19', 'si') - .06, prev: w('S19', 'previene'), seal: w('S19', "all'inizio"),
  // 20 — call to action
  cta: w('S20', 'vuoi'), commenta: w('S20', 'commenta'), domande: w('S20', 'domande', 1), privato: w('S20', 'privato'),
};
T.END = DUR;

// ---------------- 2. CUES (sottotitoli) ----------------
export const CUES = [
  cue('S01', 'Se un cliente ti dice\n«ci devo pensare»,', null, ['pensare']),
  cue('S01', 'non è colpa del prezzo.', ['non'], null),
  cue('S02', 'Hai perso la vendita\nnei primi 5 minuti.'),
  cue('S03', 'Quasi tutti cercano la frase\ngiusta da dire alla fine.'),
  cue('S04', 'Ma alla fine è tardi.'),
  cue('S05', 'vuol dire una cosa sola:', ['vuol'], null),
  cue('S06', 'il cliente non ha ancora detto,\ncon parole sue,', null, ['sue']),
  cue('S06', 'perché deve cambiare.', ['perché'], null),
  cue('S07', 'E finché non lo dice lui,', null, ['lui']),
  cue('S07', 'quello che dici tu\nsembra pubblicità.', ['quello'], null),
  cue('S08', 'Quindi, nei primi minuti,\nfai 2 domande.'),
  cue('S09', '«Perché hai deciso di sentirci\nproprio adesso?»', null, null, { big: 'PRIMA' }),
  cue('S10', 'Qualcosa è successo.\nFattelo raccontare.'),
  cue('S11', '«Se tra 6 mesi è tutto\ncome oggi, cosa succede?»', null, null, { big: 'SECONDA' }),
  cue('S12', 'E poi stai zitto.'),
  cue('S13', 'Lì il cliente si spiega da solo\nperché gli servi.'),
  cue('S14', 'Ma la parte che cambia tutto\narriva dopo.'),
  cue('S15', 'Quando dici il prezzo,\nnon lo difendi.'),
  cue('S16', 'Gli ripeti quello\nche ti ha detto lui.'),
  cue('S17', 'E gli chiedi cosa gli serve\nper decidere.'),
  cue('S18', '«Ci devo pensare»\nnon si gestisce alla fine.'),
  cue('S19', 'Si previene all’inizio.'),
  cue('S20', 'Vuoi la lista completa delle\ndomande da fare in chiamata?', null, ['chiamata']),
  cue('S20', 'Commenta DOMANDE\ne te la mando in privato.', ['commenta'], null),
];
finestre(CUES);

// ---------------- worlds (static backgrounds, cached once) ----------------
export async function init(L) {
  TMP = L.TMP; TMP2 = L.TMP2;
  LY = {};
  // BANK (opening): far range, a hill on the left fading into the mist on the right, bank, foreground rock
  {
    const lay = mkLayer(FW, FH);
    const far = ridgeFn([[160, 230, 150], [430, 310, 120], [700, 250, 140], [980, 190, 130]], 760, 3, 26);
    lay.ink.wet.drawImage(mountainLayer({ W: FW, H: FH, ridge: far, depth: 280, tone: .15, rim: .55, rimW: 22, mist: .9, seed: 3, xmask: x => clamp((900 - x) / 300) * .8 + .2 }), 0, 0);
    const hill = ridgeFn([[60, 210, 160], [330, 150, 150], [-60, 160, 120]], 1000, 7, 30);
    lay.ink.wet.drawImage(mountainLayer({ W: FW, H: FH, ridge: hill, depth: 240, tone: .4, rim: .8, rimW: 14, mist: .55, seed: 7, xmask: x => clamp((620 - x) / 260) }), 0, 0);
    cun(lay.ink, { x0: 0, x1: 520, ridge: hill, tone: .32, cun: 1.4, moss: 1.3, seed: 7, cunLen: .8 });
    // bank line the client walks on, fading into the mist on the right
    draw(lay.ink, mk([[-20, 1012, .9], [200, 1008, 1.1], [420, 1010, 1], [640, 1006, .7], [800, 1004, .3]], { w: 26, tone: .7, darkDir: [0, 1], side: .85, brWet: true, body: .25, dry: .45, wet: .9, prof: 'brush', seed: 21 }));
    draw(lay.ink, mk([[-10, 1040], [180, 1046], [380, 1044], [560, 1050]], { w: 9, tone: .45, dry: .7, prof: 'tip', seed: 22 }));
    for (let i = 0; i < 9; i++) blot(lay.ink.wet, 30 + i * 60 + (i % 3) * 9, 1006 - (i % 2) * 4, 3 + (i % 3), .8, i, .6, 30 + i);
    // water: faint dry streaks on the right
    const R = mulberry(5);
    for (let i = 0; i < 9; i++) { const y = 1110 + i * 32 + R() * 10, x0 = 520 + R() * 160, l = 120 + R() * 260; draw(lay.ink, mk([[x0, y], [x0 + l, y + R() * 4 - 2]], { w: 3 + R() * 2, tone: .35, dry: .75, prof: 'tip', seed: 40 + i }), 1, .7); }
    // foreground rock where the coin lies (flat top ~y 1262)
    rock(lay.ink, 70, 1262, 470, 230, 31);
    for (let i = 0; i < 6; i++) reed(lay.ink, 900 + i * 28, 1720, 460 + (i % 3) * 90, 1.6, 70 + i, -.35 + i * .04, .78);
    LY.bank = lay;
  }
  // RIVER (the client's story and the final scroll): keystone K, banks, mountains, water, mist band below
  {
    const H = 2900, lay = mkLayer(FW, H);
    const far = ridgeFn([[120, 260, 150], [380, 330, 130], [640, 280, 150], [900, 340, 130], [1100, 250, 120]], 1420, 11, 28);
    lay.ink.wet.drawImage(mountainLayer({ W: FW, H, ridge: far, depth: 300, tone: .14, rim: .55, rimW: 22, mist: .95, seed: 11 }), 0, 0);
    const hl = ridgeFn([[40, 200, 150], [230, 120, 120]], 1690, 13, 22), hr = ridgeFn([[1040, 210, 150], [860, 110, 120]], 1690, 17, 22);
    lay.ink.wet.drawImage(mountainLayer({ W: FW, H, ridge: hl, depth: 220, tone: .4, rim: .8, rimW: 12, mist: .4, seed: 13, xmask: x => clamp((330 - x) / 120) }), 0, 0);
    lay.ink.wet.drawImage(mountainLayer({ W: FW, H, ridge: hr, depth: 220, tone: .38, rim: .8, rimW: 12, mist: .4, seed: 17, xmask: x => clamp((x - 750) / 120) }), 0, 0);
    cun(lay.ink, { x0: 0, x1: 300, ridge: hl, tone: .3, cun: 1.3, moss: 1.5, seed: 13, cunLen: .7 });
    cun(lay.ink, { x0: 780, x1: 1080, ridge: hr, tone: .3, cun: 1.3, moss: 1.5, seed: 17, cunLen: .7 });
    // banks meeting the bridge feet
    draw(lay.ink, mk([[-20, 1664], [90, 1655], [205, 1650]], { w: 22, tone: .78, darkDir: [0, 1], side: .85, brWet: true, body: .25, dry: .45, wet: .9, prof: 'brush', seed: 81 }));
    draw(lay.ink, mk([[1100, 1664], [1030, 1655], [978, 1650]], { w: 22, tone: .78, darkDir: [0, 1], side: .85, brWet: true, body: .25, dry: .45, wet: .9, prof: 'brush', seed: 82 }));
    for (const [x0, x1, sd] of [[-20, 205, 83], [978, 1100, 84]]) { mass(lay.ink.wet, [[x0, 1652], [x1, 1648], [x1 - 20, 1742], [x0, 1760]], .16, 4, sd, [0, 1650, 0, 1760, 1.3, .2]); for (let i = 0; i < 5; i++) blot(lay.ink.wet, x0 + 20 + i * (x1 - x0 - 40) / 4, 1652 - (i % 2) * 3, 3 + (i % 3), .8, i, .6, sd + i); }
    // water streaks
    const R = mulberry(9);
    for (let i = 0; i < 16; i++) { const y = 1800 + i * 22 + R() * 10, x0 = 40 + R() * 700, l = 80 + R() * 260; draw(lay.ink, mk([[x0, y], [x0 + l, y + R() * 4 - 2]], { w: 2.5 + R() * 2, tone: .32, dry: .78, prof: 'tip', seed: 90 + i }), 1, .7 * (1 - i / 18)); }
    for (let i = 0; i < 5; i++) reed(lay.ink, 30 + i * 22, 2150, 300 + (i % 3) * 70, 1.4, 120 + i, .2 + i * .04, .75);
    for (let i = 0; i < 4; i++) reed(lay.ink, 1060 - i * 24, 2120, 260 + (i % 2) * 80, 1.3, 130 + i, -.3 - i * .03, .7);
    fadeBand(lay, 2080, 2300);
    LY.river = lay;
  }
  // incense ECU world needs nothing cached; PAGE and WATER are drawn live.
  // pre-build lettering
  LY.title = [brushWord('CI DEVO', 485, 520, 128, { center: true, seed: 900 }), brushWord('PENSARE', 485, 700, 128, { center: true, seed: 950 })];
  LY.title18 = [brushWord('CI DEVO', 485, 2290, 118, { center: true, seed: 1900, dry: .3 }), brushWord('PENSARE', 485, 2455, 118, { center: true, seed: 1950, dry: .3 })];
  LY.under = mk([[250, 1040, .6], [400, 1034, 1], [620, 1038, .9], [790, 1032, .4]], { w: 12, tone: TONE.nong, dry: .62, prof: 'brush', seed: 2950 });
  LY.one = mk([[70, 1128, .55], [120, 1110, 1.15], [300, 1112, 1.05], [560, 1108, .92], [820, 1100, .8], [1030, 1112, .45]], { w: 62, tone: TONE.jiao, dry: .5, wet: .2, prof: 'brush', rough: .16, nb: 60, solid: true, seed: 777 });
  LY.oneTop = mk([[150, 646, .55], [196, 630, 1.15], [360, 634, 1.05], [560, 628, .9], [770, 640, .45]], { w: 52, tone: TONE.jiao, dry: .5, wet: .2, prof: 'brush', rough: .16, nb: 60, solid: true, seed: 778 });
  LY.bridge = bridgeStrokes(K[0], K[1]);
  LY.tree = treeStrokes(-20, 1662, 140, .72);
}
function rock(L, x, y, w, h, seed) {   // flat river rock: wash + loaded contour + axe-cut texture + moss dots
  const R = mulberry(seed);
  const top = [[x, y + 8], [x + w * .2, y - 2], [x + w * .55, y + 2], [x + w * .85, y - 4], [x + w, y + 10]];
  mass(L.wet, [...top, [x + w * 1.02, y + h * .6], [x + w * .8, y + h], [x + w * .1, y + h], [x - w * .04, y + h * .5]], .22, 4, seed, [x, y, x, y + h, .7, 1.3]);
  draw(L, mk(top, { w: 10, tone: .9, dry: .45, wet: .3, prof: 'brush', seed }));
  draw(L, mk([[x + w, y + 10], [x + w * 1.03, y + h * .5], [x + w * .86, y + h]], { w: 34, tone: .7, darkDir: [1, 0], side: .85, brWet: true, body: .3, dry: .5, wet: .9, prof: 'rise', seed: seed + 1 }));
  draw(L, mk([[x, y + 8], [x - w * .05, y + h * .5], [x + w * .06, y + h]], { w: 28, tone: .6, darkDir: [-1, 0], side: .85, brWet: true, body: .3, dry: .5, wet: .9, prof: 'rise', seed: seed + 2 }));
  for (let i = 0; i < 14; i++) { const px = x + w * (.1 + R() * .8), py = y + 30 + R() * h * .55, l = 26 + R() * 36; draw(L, mk([[px, py], [px - l * .3, py + l * .5], [px - l * .4, py + l]], { w: 8 + R() * 8, tone: .6, dry: .6, wet: .4, prof: 'nail', seed: seed + 10 + i }), 1, .75); }
  for (let c = 0; c < 6; c++) { const cx = x + w * (.08 + R() * .84); for (let i = 0; i < 3; i++) blot(L.wet, cx + (R() - .5) * 14, y + (R() - .5) * 6, 2 + R() * 2.4, .85, R() * 3, .6, seed + c * 10 + i); }
}

// ---------------- the RIVER world ----------------
export const K = [590, 1500];
const CX = 150, CY = 1652;     // the client on the left bank              // keystone top
const GAP = side => {                      // jagged broken edge (world coords), side -1 left edge, +1 right edge
  const xs = [104, 116, 94, 121, 99, 113, 106], ys = [-70, 0, 42, 98, 150, 210, 262];
  return xs.map((x, i) => [K[0] + side * (x + (side > 0 ? (i % 2 ? -8 : 6) : 0)), K[1] + ys[i]]);
};
function pathLeftHalf() { const p = new Path2D(); const g = GAP(-1); p.moveTo(-400, K[1] - 400); g.forEach(([x, y]) => p.lineTo(x, y)); p.lineTo(g[g.length - 1][0], K[1] + 1200); p.lineTo(-400, K[1] + 1200); p.closePath(); return p; }
function pathRightHalf() { const p = new Path2D(); const g = GAP(1); p.moveTo(1500, K[1] - 400); g.forEach(([x, y]) => p.lineTo(x, y)); p.lineTo(g[g.length - 1][0], K[1] + 1200); p.lineTo(1500, K[1] + 1200); p.closePath(); return p; }
function pathGap() { const p = new Path2D(); const a = GAP(-1), b = GAP(1); a.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); b.slice().reverse().forEach(([x, y]) => p.lineTo(x, y)); p.closePath(); return p; }
// draw the bridge strokes; p = progress from the keystone outward (both halves), am = opacity
function bridgeDraw(Ls, p = 1, am = 1, t = 0, o = {}) {
  const L = Ls.ink;
  if (o.wash !== false) { bridgeWash(L.wet, K[0], K[1], am * clamp(p * 1.4)); bridgeTexture(L, K[0], K[1], am * clamp(p * 2 - 1)); }
  for (const side of ['L', 'R']) {
    const S = LY.bridge[side];
    S.forEach((s, i) => draw(L, s, i < 2 ? p : clamp((p - .3) / .7), am));
  }
  if (o.refl !== false) bridgeReflection(L, K[0], K[1], am * clamp(p * 1.2 - .2) * (o.reflK ?? 1), t);
}
function riverBase(Ls, cam, t, o = {}) {
  blitLayer(Ls, LY.river, cam, o.am ?? 1);
}
function client(Ls, P, x, y, s, t, o = {}) {
  hero(Ls.ink, P, { x, y, s, dir: o.dir ?? 1, seed: o.seed ?? 3, t: tw(t), boil: tw(t) * 15, p: o.p ?? 1, am: o.am ?? 1 });
}
function bankReeds(Ls, p = 1) { return; for (let i = 0; i < 4; i++) { const q = clamp(p * 2.2 - i * .3); if (q > 0) draw(Ls.ink, cached('rr' + i, () => mk([[250 + i * 34, 1700], [262 + i * 34 + i * 6, 1560 - i * 20], [280 + i * 38, 1450 - i * 30]], { w: 4, tone: .78, dry: .4, prof: 'tip', seed: 230 + i })), q, 1); } }

// ---------------- shots ----------------
const SH = [];   // filled below: {a, b, f(t, Ls) → compositor params}
function shot(a, b, f) { SH.push({ a, b, f }); }

// 1 — the client walks into the mist; the coin stays on the rock
function bankCam1(t) { const u = eio(seg(t, 2.45, 4.9)); return { x: lerp(560, 380, u) - 20 * seg(t, 0, 2.4), y: lerp(930, 1150, u), z: lerp(1.02, 1.55, u) + .03 * seg(t, 0, 2.4) }; }
function sceneBank1(Ls, t) {
  const cam = bankCam1(t); blitLayer(Ls, LY.bank, cam); useCam(Ls, cam);
  const tq = tw(t), x = 230 + 125 * tq;
  const dis = seg(t, T.hookMist - .05, T.gone + .45);
  if (dis < 1) {
    // draw the figure into TMP, erase it from the feet up with a soft mist band, paste
    TMP.clear(); useCam(TMP, cam);
    client(TMP, walkPose(tq * .95), x, 1006, 4.6, t, { seed: 3 });
    if (dis > 0) for (const c of [TMP.cw, TMP.cd]) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-out';
      const [, sy] = w2s(cam, [x, 1006]), hh = 430 * cam.z, yy = sy - hh * (dis * 1.25 - .1);
      const g = c.createLinearGradient(0, yy - 90, 0, yy + 40); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000');
      c.fillStyle = g; c.fillRect(0, yy - 90, FW, FH); c.globalAlpha = dis * .7; c.fillRect(0, 0, FW, FH); c.restore();
    }
    for (const k of ['wet', 'dry']) { const c = Ls.ink[k]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(TMP[k], 0, 0); c.restore(); }
    if (dis > 0) { // the dissolving ink smears into the wet layer
      const c = Ls.cw; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .35 * Math.sin(Math.PI * dis); c.filter = 'blur(6px)'; c.drawImage(TMP.dry, 0, -14 * dis); c.filter = 'none'; c.restore();
    }
  }
  coin(Ls.ink, 330, 1232, 60, eo(seg(t, T.coin1 - .05, T.coin1 + .5)));
  const fs = w2s(cam, [x, 800]);
  const R = 150 + 2600 * Math.pow(eo(seg(t, 0, 1.5)), 1.15);
  return { paper: paperOf(cam), bleed: 5, rim: .9, rev: t < 1.5 ? [fs[0], fs[1], R, 1] : [0, 0, 0, 0] };
}
// 2 / 14 — incense ECU
function sceneIncense(Ls, t, o) {
  const cam = o.cam(t); useCam(Ls, cam);
  incense(Ls.ink, 560, 1370, { s: 1.9, h: 560, burn: o.burn(t), t, ash: o.ash(t), ashDrop: o.ashDrop(t), lit: 1, smokeH: o.smokeH ? o.smokeH(t) : 520, smokeW: o.smokeW ? o.smokeW(t) : 1 });
  // a few grains of ash on the rim
  return { paper: paperOf(cam), bleed: 5, rim: .9 };
}
const inc2 = {
  cam: t => { const u = eio(seg(t, T.rewind - .1, T.rewind + .95)); return { x: 560, y: lerp(1170, 720, u), z: lerp(1.42, 1.06, u) + .03 * seg(t, T.cut2, 7.5) }; },
  burn: t => lerp(.86, 0, eio(seg(t, T.rewind, T.rewind + .9))),
  ash: t => t < T.ashFall ? .95 : 0,
  ashDrop: t => seg(t, T.ashFall, T.ashFall + .55),
  smokeH: t => lerp(260, 640, seg(t, T.rewind, T.five + .6)),
  smokeW: t => 1 + .9 * seg(t, 6.9, T.x3b),
};
const inc14 = {
  cam: t => ({ x: 540, y: lerp(820, 940, eio(seg(t, T.cut14, T.x15b))), z: 1.02 }),
  burn: t => .52,
  ash: t => t < T.dopo ? lerp(.25, .9, seg(t, T.cut14, T.dopo)) : 0,
  ashDrop: t => seg(t, T.dopo, T.dopo + .55),
  smokeH: t => 640, smokeW: t => 1 + .7 * seg(t, 49.9, T.x15b),
};
// 3–4 — the brush tries to repaint the client in the mist, then runs dry
function bankCam3(t) { const u = eio(seg(t, 11.1, 13.6)); return { x: lerp(640, 650, u), y: lerp(880, 900, u), z: lerp(1.36, 1.5, u) }; }
const TRIES = [[T.try1, T.try1 + .42, .38], [T.try2, T.try2 + .5, .62], [T.try3 - .15, T.try3 + .38, .86]];
function brushTip3(t) {
  // rest position / tries / dip / the dry stroke
  let tip = [930, 520], ang = -1.05, wet = 1, splay = 0;
  for (const [a, b, mx] of TRIES) {
    if (t >= a - .25 && t < b + .35) {
      const u = seg(t, a, b);
      const pre = seg(t, a - .25, a), post = seg(t, b, b + .35);
      const path = [lerp(612, 640, u), lerp(700, 960, u * mx)];
      tip = [lerp(lerp(930, path[0], eo(pre)), 930, ei(post)), lerp(lerp(520, path[1], eo(pre)), 520, ei(post))];
    }
  }
  const dryA = T.dry - .22, dryB = T.dry + .2;
  if (t >= T.dip - .1) {
    const u0 = seg(t, T.dip - .1, T.dip + .35), u1 = seg(t, dryA - .15, dryA), u = seg(t, dryA, dryB), u2 = seg(t, dryB + .1, T.hush1 + .3);
    tip = [lerp(930, 560, eo(u1)), lerp(lerp(520, 470, Math.sin(Math.PI * u0)), 760, eo(u1))];
    if (t >= dryA) tip = [lerp(560, 700, u), lerp(760, 990, Math.pow(u, .9))];
    if (t >= dryB + .1) tip = [lerp(700, 980, ei(u2)), lerp(990, 430, eo(u2))];
    wet = 1 - seg(t, dryA - .2, dryB) * .95; splay = seg(t, dryA + .1, dryB + .15);
  }
  return { tip, ang, wet, splay };
}
function sceneBank3(Ls, t) {
  const cam = bankCam3(t); blitLayer(Ls, LY.bank, cam); useCam(Ls, cam);
  // the failed figures: painted, then they bleed and fade into the mist
  TRIES.forEach(([a, b, mx], i) => {
    if (t < a) return;
    const p = mx * eo(seg(t, a, b)), fade = 1 - eo(seg(t, b + .05, b + .75));
    if (fade <= 0) return;
    TMP.clear(); useCam(TMP, cam);
    client(TMP, POSE.stand, 628, 1004, 3.4, a, { p, seed: 11 + i });
    for (const k of ['wet', 'dry']) { const c = Ls.ink[k]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = fade * (k === 'dry' ? fade : 1); if (k === 'wet') c.filter = `blur(${(1 - fade) * 10}px)`; c.drawImage(TMP[k], 0, 0); c.restore(); }
    const c = Ls.cw; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = (1 - fade) * fade * 1.6; c.filter = 'blur(8px)'; c.drawImage(TMP.dry, 0, -10 * (1 - fade)); c.filter = 'none'; c.restore();
  });
  // the dry stroke of "too late": flying white, broken
  const dryA = T.dry - .22, dryB = T.dry + .2;
  if (t >= dryA) draw(Ls.ink, cached('drystroke', () => mk([[560, 760, .9], [600, 830, 1], [650, 910, .8], [700, 990, .4]], { w: 30, tone: TONE.nong, dry: .9, wet: 0, prof: 'brush', nb: 30, seed: 515 })), eo(seg(t, dryA, dryB)), 1);
  const b = brushTip3(t);
  const bin = eo(seg(t, T.try1 - .9, T.try1 - .25));
  brush(Ls.ink, lerp(1150, b.tip[0], bin), lerp(250, b.tip[1], bin), b.ang, { s: .74, wet: b.wet, splay: b.splay, am: 1 });
  return { paper: paperOf(cam), bleed: 5, rim: .9 };
}
// 5–7 — the page: title, one stroke, the client, the empty ring, banners
const pageCam = t => {
  const push = eio(seg(t, T.client + .3, T.brushIn + .2)), pre = seg(t, T.x5a, T.client + .3);
  return { x: lerp(540, 575, push), y: lerp(960 - 20 * pre, 800, push), z: lerp(1.0 + .05 * pre, 1.32, push) };
};
const BANNERS = (() => {
  const R = mulberry(3), out = [];
  const xs = [640, 120, 400, 800, 0, 260, 560, 900, 330, 700, 60], ws = [250, 270, 230, 240, 260, 240, 280, 220, 300, 260, 240];
  for (let i = 0; i < xs.length; i++) {
    const u = i / (xs.length - 1), t0 = lerp(T.tu - .15, T.pubEnd - .15, Math.pow(u, .7));
    out.push({ t0, x: xs[i], y: 300 + R() * 300, w: ws[i], h: 820 + R() * 420, seed: 60 + i });
  }
  return out;
})();
function scenePage(Ls, t) {
  const cam = pageCam(t); useCam(Ls, cam);
  const L = Ls.ink;
  // title «CI DEVO / PENSARE», written by itself, then it evaporates as the client appears
  const tp = seg(t, T.title, T.title + 1.0), ev = seg(t, T.client + .05, T.client + .85);
  if (ev < 1) { title(Ls, 'CI DEVO', 485, 640, 150, clamp(tp * 2), { evap: ev }); title(Ls, 'PENSARE', 485, 810, 150, clamp(tp * 2 - .9), { evap: ev }); }
  // ONE stroke, after a held stillness, crossing in five frames
  const one = seg(t, T.one + .03, T.one + .2);
  if (one > 0) draw(L, LY.one, eo(one), 1);
  // the client is painted standing on the stroke
  const cp = seg(t, T.client, T.client + .85);
  if (cp > 0) {
    let P = POSE.wait;
    const away = seg(t, T.tu, T.tu + .5);
    if (away > 0) P = { ...P, tilt: -.06 * away, Hd: [P.Hd[0] - 1.2 * away, P.Hd[1]] };
    client(Ls, P, 400, 1112, 6.6, t, { p: cp, seed: 4 });
  }
  // the empty ring next to his mouth: drawn with a dry brush, left open; it stays empty
  const rp = seg(t, T.ring, T.ring + .55);
  if (rp > 0) {
    const pts = []; for (let i = 0; i <= 30; i++) { const a = -2.2 + i / 30 * Math.PI * 1.82; pts.push([745 + Math.cos(a) * 118, 560 + Math.sin(a) * 112, .7 + .5 * Math.sin(Math.PI * i / 30)]); }
    const breath = 1 + .015 * Math.sin((t - T.ring) * 3.2) * seg(t, T.ring + .6, T.ring + 1.2);
    for (const c of [Ls.cw, Ls.cd]) { c.save(); c.translate(745, 560); c.scale(breath, breath); c.translate(-745, -560); }
    draw(L, cached('ring6', () => mk(pts, { w: 13, tone: TONE.nong, dry: .55, wet: .25, prof: 'brush', seed: 616 })), eo(rp), 1);
    for (const c of [Ls.cw, Ls.cd]) c.restore();
  }
  // advertising: the brush (you) slams shouting banners over everything
  let shake = [0, 0];
  for (const b of BANNERS) {
    const u = seg(t, b.t0, b.t0 + .16);
    if (u > 0) banner(L, b.x, b.y, b.w, b.h, b.seed, 1, u);
    const k = t - b.t0; if (k > 0 && k < .25) { const a = (1 - k / .25) * 9; shake = [Math.sin(k * 90) * a, Math.cos(k * 77) * a * .6]; }
  }
  if (t > T.brushIn - .6 && t < T.lift + .4) {
    const bin = eo(seg(t, T.brushIn - .5, T.brushIn + .1));
    let tip = [lerp(1250, 900, bin), lerp(120, 420, bin)];
    const cur = BANNERS.filter(b => t >= b.t0 - .12).pop();
    if (cur) { const u = seg(t, cur.t0 - .12, cur.t0 + .16); tip = [lerp(tip[0], cur.x + cur.w * .5, eo(Math.min(1, u * 1.6))), lerp(tip[1], cur.y + cur.h * .45 * u, eo(u))]; }
    const out = eo(seg(t, T.pubEnd + .05, T.lift + .3));
    brush(L, lerp(tip[0], 1300, out), lerp(tip[1], -100, out), -1.0, { s: .9, wet: 1, am: 1 });
  }
  return { paper: paperOf(cam), bleed: 7, rim: .95, shake };
}
// 8–9 — water, incense lit, two drops, push into the first ring
const D1 = [470, 1080], D2 = [655, 1196];
const waterCam = t => { const u = eio(seg(t, T.q1 - .1, T.x10b)), pre = ss(seg(t, T.lift, T.q1 - .1)); return { x: lerp(540 - 14 * pre, 480, u), y: lerp(960 + 30 * pre, 1050, u), z: lerp(1 + .07 * pre, 1.62, u) }; };
function sceneWater(Ls, t) {
  const cam = waterCam(t); useCam(Ls, cam);
  const L = Ls.ink, R = mulberry(17);
  for (let i = 0; i < 14; i++) { const y = 990 + i * 30 + R() * 10, x0 = 40 + R() * 640, l = 100 + R() * 300; draw(L, cached('ws' + i, () => mk([[x0, y], [x0 + l, y + R() * 4 - 2]], { w: 3 + R() * 2, tone: .32, dry: .78, prof: 'tip', seed: 200 + i })), 1, .65 * (1 - i / 16)); }
  for (let i = 0; i < 5; i++) reed(L, 30 + i * 24, 1720, 380 + (i % 3) * 80, 1.5, 210 + i, .22 + i * .04, .78);
  for (let i = 0; i < 4; i++) reed(L, 1050 - i * 26, 1700, 300 + (i % 2) * 90, 1.4, 220 + i, -.3 - i * .04, .7);
  // far shore: a low pale range on the horizon of the water
  draw(L, cached('shore', () => mk([[380, 940], [600, 930], [820, 936], [1100, 928]], { w: 10, tone: .35, dry: .6, wet: .5, prof: 'tip', seed: 251 })), 1, .8);
  for (let i = 0; i < 3; i++) { const cx = 560 + i * 190, h = 50 + i * 18; mass(L.wet, [[cx - 140, 935], [cx - 30, 935 - h], [cx + 10, 935 - h * .8], [cx + 150, 935]], .13, 6, 30 + i, [0, 935 - h, 0, 935, 1, .2]); }
  // incense, lit on «primi minuti»
  const lit = seg(t, T.lit, T.lit + .3);
  incense(L, 240, 900, { s: .85, h: 500, burn: .02 + .02 * seg(t, T.lit, 34), t, ash: .1 * lit, lit, smokeH: 560 * seg(t, T.lit, T.lit + 1.6) + 40 });
  // the brush (you) lets two drops fall: the two questions
  const fall = (t0, x) => { const u = seg(t, t0, t0 + .28); return u > 0 && u < 1 ? [x, lerp(560, x === D1[0] ? D1[1] : D2[1], u * u)] : null; };
  const d1 = fall(T.drop1 - .02, D1[0]), d2 = fall(T.drop2 + .1, D2[0]);
  if (d1) drop(L, d1[0], d1[1]); if (d2) drop(L, d2[0], d2[1]);
  const h1 = T.drop1 + .26, h2 = T.drop2 + .38;
  rings(L, D1[0], D1[1], t - h1, { n: 4, r: 300, life: 6, sq: .34, w: 6, seed: 3 });
  rings(L, D2[0], D2[1], t - h2, { n: 3, r: 240, life: 4.5, sq: .34, w: 5, seed: 9 });
  if (t > h1) for (let i = 0; i < 6; i++) blot(L.wet, D1[0] + (R() - .5) * 40, D1[1] + (R() - .5) * 12, 3 + R() * 4, .5 * clamp(1 - (t - h1) / 1.5), 0, .5, i);
  // inside the ring the client's story appears as a reflection (upside down), before it blooms open
  const gh = eo(seg(t, T.q1text - .3, T.x10a - .4));
  if (gh > 0) {
    const c = [D1[0], D1[1] + 18], k = .4;
    for (const cx of [Ls.cw, Ls.cd]) { cx.save(); cx.translate(c[0], c[1]); cx.scale(k, -k * .62); cx.translate(-K[0], -K[1] - 130); }
    bridgeDraw(Ls, 1, .72 * gh, t, { refl: false });
    for (const cx of [Ls.cw, Ls.cd]) cx.restore();
  }
  if (t < T.q1 + .6) {
    const bin = eo(seg(t, T.lit + .2, T.drop1 - .25)), out = eo(seg(t, T.drop2 + .5, T.q1 + .6));
    let tx = lerp(D1[0], D2[0], ss(seg(t, T.drop1 + .05, T.drop2 + .05)));
    brush(L, lerp(1200, tx, bin) + 500 * out, lerp(150, 545, bin) - 500 * out, -1.05, { s: .78, wet: 1, drop: seg(t, T.drop1 - .3, T.drop1) * (t < T.drop1 ? 1 : 0) });
  }
  return { paper: paperOf(cam), bleed: 5, rim: .9 };
}
// 10–11 — the client's story: the bridge breaks; six months; the flood
const riverCam10 = t => { const u = eio(seg(t, T.x10a, T.q2 - .1)); return { x: 540, y: lerp(1500, 1460, u), z: lerp(1.16, 1.0, u) }; };
const riverCam11 = t => { const u = eio(seg(t, T.six - .2, T.sil0 + .7)), pre = ss(seg(t, T.q2 - .1, T.six - .2)); const z = lerp(1.0 + .05 * pre, 1.12, u); return { x: lerp(540 + 10 * pre, 560, u), y: lerp(1460 + 14 * pre, 1520, u), z }; };
const CRACK = T.crack + .05, SPLIT = T.succ + .08;
function brokenBridge(Ls, t, am = 1) {
  clipDo(Ls, pathLeftHalf(), () => bridgeDraw(Ls, 1, am, t, { refl: false }));
  clipDo(Ls, pathRightHalf(), () => bridgeDraw(Ls, 1, am, t, { refl: false }));
}
function riverTree(Ls, t, o = {}) {
  const L = Ls.ink, sway = Math.sin(t * 1.1) * 1.5;
  for (const st of LY.tree.S) draw(L, st, o.p ?? 1, o.am ?? 1);
  // spring: blossoms open along the branches
  if (o.bloom > 0) LY.tree.tips.forEach(([x, y], i) => blossom(L, x + sway, y, 15 * clamp(o.bloom * 3 - i * .06), o.am ?? 1, 300 + i));
  // winter: snow resting on the branches
  if (o.snow > 0) { const c = Ls.cc; c.save(); c.fillStyle = `rgba(${PAPER_RGB.join(',')},${o.snow})`; LY.tree.B.forEach(b => b.forEach(([x, y], i) => { if (i) { c.beginPath(); c.ellipse(x, y - 7, 22, 7, 0, 0, 7); c.fill(); } })); c.restore(); }
}
function sceneRiver10(Ls, t, camF, treeO = {}) {
  const cam = camF(t); riverBase(Ls, cam, t); useCam(Ls, cam);
  riverTree(Ls, t, treeO);
  const L = Ls.ink;
  let shake = [0, 0];
  if (t < SPLIT) {
    bridgeDraw(Ls, 1, 1, t);
    const cp = seg(t, CRACK, SPLIT);   // the crack runs down the keystone
    if (cp > 0) draw(L, cached('crack', () => mk([[K[0] + 6, K[1] - 34], [K[0] - 10, K[1] + 20], [K[0] + 12, K[1] + 70], [K[0] - 6, K[1] + 120], [K[0] + 8, K[1] + 200], [K[0], K[1] + 290]], { w: 6, tone: TONE.jiao, dry: .35, prof: 'tip', seed: 717 })), eo(cp), 1);
  } else {
    brokenBridge(Ls, t);
    // the middle piece falls into the river and sinks
    const u = seg(t, SPLIT, SPLIT + .75);
    if (u < 1) {
      for (const c of [Ls.cw, Ls.cd]) { c.save(); c.translate(K[0], K[1] + 150); c.rotate(.25 * u * u); c.translate(-K[0], -K[1] - 150 + 520 * u * u); }
      clipDo(Ls, pathGap(), () => bridgeDraw(Ls, 1, 1 - u * .8, t, { refl: false }));
      for (const c of [Ls.cw, Ls.cd]) c.restore();
    }
    const hit = SPLIT + .5;
    rings(L, K[0], K[1] + BR.water + 30, t - hit, { n: 4, r: 330, life: 3.5, sq: .3, w: 7, seed: 31 });
    // splash: wet ink spatter thrown up, then falling back
    const sp = t - hit;
    if (sp > 0 && sp < 1.4) { const R = mulberry(41); for (let i = 0; i < 26; i++) { const a = -Math.PI * (.15 + R() * .7), v = 260 + R() * 420; const x = K[0] + Math.cos(a) * v * sp, y = K[1] + BR.water + 20 + Math.sin(a) * v * sp + 600 * sp * sp; blot(L.wet, x, y, 3 + R() * 8, .7 * clamp(1 - sp / 1.4), R() * 3, .7, i); } }
    const k = t - SPLIT; if (k > 0 && k < .4) { const a = (1 - k / .4) * 7; shake = [Math.sin(k * 80) * a, Math.cos(k * 63) * a]; }
  }
  // «Fattelo raccontare»: the scene paints itself — the client on the bank, reeds, a pine
  const tp = seg(t, T.tell - .05, T.tellEnd + .2);
  if (tp > 0) {
    client(Ls, POSE.stand, CX, CY, 2.3, t, { p: eo(tp) * 1.05, seed: 5 });
    bankReeds(Ls, tp);
  }
  return { cam, shake };
}
function sceneRiver11(Ls, t) {
  const win = seg(t, T.six - .1, T.six + .4) * (1 - seg(t, T.same + .05, T.same + .55));
  const spr = seg(t, T.same - .05, T.same + .55) * (1 - seg(t, T.what + .05, T.what + .5));
  const r = sceneRiver10(Ls, t, riverCam11, { snow: win, bloom: spr }), cam = r.cam, L = Ls.ink;
  // second drop
  const u = seg(t, T.q2 + .02, T.q2 + .3);
  if (u > 0 && u < 1) drop(L, 760, lerp(1100, 1860, u * u));
  rings(L, 760, 1860, t - (T.q2 + .3), { n: 3, r: 280, life: 4, sq: .3, w: 6, seed: 17 });
  // winter: grey sky behind the tree and grey water (the land stays white), snow falling as paper-white flakes
  if (win > 0) {
    mass(L.wet, [[-50, 1090], [1130, 1090], [1130, 1470], [-50, 1470]], .22 * win, 30, 3, [0, 1090, 0, 1470, 0, 1]);
    mass(L.wet, [[-50, 1745], [1130, 1745], [1130, 2120], [-50, 2120]], .3 * win, 30, 4, [0, 1745, 0, 2120, 1, 0]);
    const c = Ls.cc, Rr = mulberry(77); c.save(); c.fillStyle = `rgba(${PAPER_RGB.join(',')},${win})`;
    for (let i = 0; i < 110; i++) { const x = Rr() * 1080, y0 = Rr() * 1300, sp = 70 + Rr() * 90; const y = 1000 + ((y0 + (t - T.six) * sp) % 1250), rr = 2.5 + Rr() * 4.5; c.beginPath(); c.arc(x + Math.sin(t * 1.4 + i) * 12, y, rr, 0, 7); c.fill(); }
    for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) { const x = K[0] + sx * (130 + i * 44); const y = K[1] + deckY(x - K[0]) - 12; c.beginPath(); c.ellipse(x, y, 26, 8, 0, 0, 7); c.fill(); }
    c.restore();
  }
  // spring: petals drifting down over the gap
  if (spr > 0) { const Rr = mulberry(55); for (let i = 0; i < 14; i++) { const x0 = 120 + Rr() * 600, y0 = 1150 + Rr() * 200, ph = (t - T.same) * (40 + Rr() * 40); blossom(L, x0 + ph * .8 + Math.sin(ph * .05 + i) * 20, y0 + ph * 1.6, 7, spr * .8, 500 + i); } }
  // «cosa succede?»: the flood — heavy water rises to the arch, crests along its face, rain slants across
  const fl = seg(t, T.what - .05, T.what + .75);
  let shake = r.shake;
  if (fl > 0) {
    const top = lerp(2150, 1712, eo(fl)), ph = t * 2.2, drift = (t - T.what) * 140;
    const edge = []; for (let i = 0; i <= 24; i++) { const x = -60 + i * 50; edge.push([x, top + Math.sin(i * .9 + ph) * 14 + (vnoise(i * .7 + t * .8) - .5) * 26]); }
    mass(L.wet, [...edge, [1140, 3000], [-60, 3000]], .4 * fl, 8, 9, [0, top, 0, top + 520, 1.25, .45]);
    for (let k = 0; k < 4; k++) {   // huge loaded crests curling over, carried by the current
      const x = ((k * 330 + drift) % 1400) - 220, y = top + 6 + (k % 2) * 10;
      draw(L, mk([[x - 160, y + 40], [x - 40, y + 4], [x + 70, y - 22], [x + 140, y - 8], [x + 150, y + 22], [x + 112, y + 36]], { w: 30, tone: .85, darkDir: [0, -1], side: .85, brWet: true, body: .3, dry: .42, wet: .9, prof: 'brush', seed: 270 + k }), 1, fl);
      blot(L.wet, x + 120, y + 30, 9, .6 * fl, 0, .8, 280 + k);
    }
    for (let k = 0; k < 16; k++) {  // fine wave lines, dense near the edge (Song-style), each a short curve
      const row = Math.floor(Math.sqrt(k * 3)), y = top + 46 + row * row * 9 + row * 16, x = ((k * 211 + drift * (1.2 - row * .1)) % 1300) - 150, l = 120 + (k % 3) * 50;
      draw(L, mk([[x, y], [x + l * .45, y - 9], [x + l, y + 2]], { w: 4.5, tone: .8, dry: .45, prof: 'tip', seed: 290 + k }), 1, fl * (1 - row * .12));
    }
    const Rr = mulberry(91);
    for (let i = 0; i < 46; i++) { const x0 = Rr() * 1400 - 100, y0 = Rr() * 1500, v = 1100; const yy = 950 + ((y0 + (t - T.what) * v) % 1450); draw(L, mk([[x0 - (yy - 950) * .25, yy], [x0 - (yy - 950) * .25 - 24, yy + 90]], { w: 2.2, tone: .55, dry: .55, prof: 'tip', seed: 300 + i }), 1, .65 * fl); }
    const a = fl * 3.4; shake = [Math.sin(t * 41) * a, Math.cos(t * 37) * a * .7];
  }
  return { paper: paperOf(cam), bleed: 5 + 2 * fl, rim: .95, shake };
}
// 12–13 — silence; hard cut; the full stop becomes the keystone
const DOT = [K[0], K[1] + 18], DOTR = 54;
const cam12 = t => { const u = eio(seg(t, T.self, T.serve + .45)); const z0 = 2.25 + .1 * seg(t, T.cut12, T.self); return { x: 540, y: lerp(DOT[1], 1470, u), z: lerp(z0, 1.0, u) }; };
function dotInk(Ls, t) {
  const L = Ls.ink, k = seg(t, T.slam, T.slam + .1);
  if (k <= 0) return;
  blot(L.dry, DOT[0], DOT[1], DOTR * eo(k), .97, .3, .92, 7);
  blot(L.wet, DOT[0], DOT[1], DOTR * 1.18 * eo(k) * (1 + .1 * seg(t, T.slam, T.slam + 2.5)), .7, .5, .9, 8);
  // splatter thrown out by the slam: stays on the paper
  const R = mulberry(51);
  for (let i = 0; i < 34; i++) {
    const a = R() * Math.PI * 2, d = DOTR * (1.3 + R() * 3.2), q = seg(t, T.slam, T.slam + .12 + R() * .1);
    if (q <= 0) continue;
    const x = DOT[0] + Math.cos(a) * d * eo(q), y = DOT[1] + Math.sin(a) * d * eo(q) * .85;
    blot(L.dry, x, y, (1.2 + R() * 4.5) * (1 - d / (DOTR * 5)), .9, a, .55 + R() * .4, 100 + i);
  }
}
function sceneDot(Ls, t) {
  const cam = cam12(t); riverBase(Ls, cam, t); useCam(Ls, cam);
  riverTree(Ls, t);
  const L = Ls.ink;
  brokenBridge(Ls, t);
  client(Ls, POSE.stand, CX, CY, 2.3, t, { seed: 5 });
  bankReeds(Ls);
  dotInk(Ls, t);
  // the ink moves by itself: from the dot it fills the gap and joins the two halves
  const fp = seg(t, T.spread, T.serve);
  if (fp > 0) clipDo(Ls, pathGap(), () => bridgeDraw(Ls, .18 + .82 * eo(fp), 1, t, { refl: false, wash: true }));
  if (fp > .6) bridgeReflection(L, K[0], K[1], eo(seg(fp, .6, 1)) * clamp((t - T.serve + .5) / 1.2), t);
  if (t > T.serve) rings(L, K[0], K[1] + BR.water + 60, t - T.serve, { n: 3, r: 380, life: 3, sq: .26, w: 5, seed: 61 });
  // the brush: poised, rises (anticipation), slams, leaves
  let shake = [0, 0];
  if (t < T.exit + .6) {
    const up = eo(seg(t, T.poise - .05, T.slam - .12)), dn = ei(seg(t, T.slam - .12, T.slam)), out = eo(seg(t, T.exit, T.exit + .45));
    const ty = lerp(DOT[1] - 70, DOT[1] - 128, up) + (DOT[1] - (DOT[1] - 128)) * dn;
    const tip = [lerp(DOT[0] + 20, DOT[0], dn) + 520 * out, (dn > 0 ? lerp(DOT[1] - 128, DOT[1], dn) : ty) - 560 * out];
    brush(L, tip[0], tip[1], -1.0, { s: .42, wet: 1, splay: dn * .25 * (1 - out), am: 1 });
  }
  const k = t - T.slam; if (k > 0 && k < .35) { const a = (1 - k / .35) * 14; shake = [Math.sin(k * 95) * a, Math.cos(k * 71) * a]; }
  return { paper: paperOf(cam), bleed: 5, rim: 1.0, shake };
}
// 15–18 — the price at the keystone; the brush repeats the client's strokes; the step; the mist of the end
const COIN = [K[0], K[1] + 20];
function cam15(t) {
  // ECU on the coin → pull back with the retrace → toward the client → tilt down to the mist
  const a = eio(seg(t, T.repeat - .1, T.him + .25)), b = eio(seg(t, T.ask - .3, T.decide + .2)), c = eio(seg(t, T.end18 - .2, T.end18 + .9));
  let x = 540, y = COIN[1], z = 2.35 + .1 * seg(t, T.x15a, T.repeat);
  x = lerp(x, 540, a); y = lerp(y, 1500, a); z = lerp(z, 1.12, a);
  x = lerp(x, 420, b); y = lerp(y, 1560, b); z = lerp(z, 1.2, b);
  x = lerp(x, 520, c); y = lerp(y, 2330, c); z = lerp(z, 1.08, c);
  const d = ss(seg(t, T.end18 + .7, T.cut19)); z += .08 * d; y += 30 * d;
  return { x, y, z };
}
function retraceP(t) { return seg(t, T.repeat - .05, T.him + .1); }
function sceneRiver15(Ls, t) {
  const cam = cam15(t); riverBase(Ls, cam, t); useCam(Ls, cam);
  riverTree(Ls, t);
  const L = Ls.ink;
  // the client's bridge has faded with time (a ghost), the brush re-inks it stroke by stroke
  bridgeDraw(Ls, 1, .26, t);
  bankReeds(Ls);
  const rp = retraceP(t);
  if (rp > 0) bridgeDraw(Ls, eio(rp), 1, t);
  // client: waits on the bank, then steps onto the bridge on «decidere»
  const st = seg(t, T.decide - .1, T.decide + 1.0);
  const x = lerp(CX, 262, st), deck = x2 => K[1] + deckY(x2 - K[0]);
  const fy = st <= 0 ? CY : lerp(CY, deck(262) + 2, ss(st));
  client(Ls, st > 0 && st < 1 ? walkPose(st * 1.0) : POSE.stand, x, fy, 2.3, t, { seed: 5 });
  // the price, painted at the keystone; the defensive fence tries to form and dissolves
  coin(L, COIN[0], COIN[1], 38, eo(seg(t, T.price - .02, T.price + .45)));
  const fe = seg(t, T.nodef, T.nodef + .35), fo = seg(t, T.nodef + .45, T.difendi + .75);
  if (fe > 0 && fo < 1) {
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2, r0 = 78, x0 = COIN[0] + Math.cos(a) * r0, y0 = COIN[1] + Math.sin(a) * r0 * .9;
      const s = cached('fence' + i, () => mk([[x0, y0 + 26], [x0 + 2, y0 - 4], [x0, y0 - 30]], { w: 9, tone: TONE.nong, dry: .45, wet: .5, prof: 'nail', seed: 640 + i }));
      draw(L, s, eo(clamp(fe * 1.6 - i * .06)), 1 - fo);
    }
    if (fo > 0) { const c = Ls.cw; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .25 * Math.sin(Math.PI * fo); c.filter = 'blur(8px)'; c.drawImage(Ls.dry, 0, 0); c.filter = 'none'; c.restore(); }
  }
  // third drop: in front of the client, on «chiedi»
  const du = seg(t, T.ask, T.ask + .26);
  if (du > 0 && du < 1) drop(L, 300, lerp(1350, 1850, du * du));
  rings(L, 300, 1850, t - (T.ask + .26), { n: 3, r: 230, life: 4, sq: .3, w: 5, seed: 23 });
  // the brush: retrace along the arch (left half, then right), then the drop, then leaves
  if (t > T.repeat - .7 && t < T.decide + .4) {
    let tip;
    const s0 = LY.bridge.L[1], s1 = LY.bridge.R[1];
    const at = (s, p) => { const P = s.P, m = (P.length - 1) * clamp(p), k = Math.floor(m), f = m - k, a2 = P[k], b2 = P[Math.min(P.length - 1, k + 1)]; return [lerp(a2[0], b2[0], f), lerp(a2[1], b2[1], f)]; };
    const p = eio(rp);
    tip = rp < .5 ? at(s0, p * 2) : at(s1, (p - .5) * 2);
    const bin = eo(seg(t, T.repeat - .7, T.repeat - .05));
    tip = [lerp(1300, tip[0], bin), lerp(900, tip[1], bin)];
    const go = eo(seg(t, T.him + .15, T.ask - .1)), back = eo(seg(t, T.ask + .25, T.decide + .4));
    tip = [lerp(tip[0], 300, go), lerp(tip[1], 1340, go)];
    tip = [lerp(tip[0], 1400, back), lerp(tip[1], 800, back)];
    brush(L, tip[0], tip[1], -1.0, { s: .55, wet: 1, drop: seg(t, T.ask - .35, T.ask) * (t < T.ask ? 1 : 0) });
  }
  // «Ci devo pensare» in the mist of the end, then it evaporates
  const lp = seg(t, T.end18, T.end18 + .56), ev = seg(t, T.fine18 - .02, T.cut19 - .06);
  if (lp > 0) { title(Ls, 'CI DEVO', 520, 2390, 136, clamp(lp * 2), { evap: clamp(ev * 2 - .8), am: .78 }); title(Ls, 'PENSARE', 520, 2545, 136, clamp(lp * 2 - .9), { evap: clamp(ev * 2), am: .78 }); }
  // drifting mist streaks
  for (let i = 0; i < 5; i++) { const y = 2200 + i * 70, x0 = ((t * (14 + i * 3) + i * 230) % 1400) - 300; draw(L, mk([[x0, y], [x0 + 380, y + 6]], { w: 22, tone: .12, dry: .3, wet: .9, prof: 'lens', seed: 330 + i }), 1, .7); }
  return { paper: paperOf(cam), bleed: 5, rim: .95 };
}
// 19–20 — hard cut ECU: the seal on «all'inizio»; pull back to the whole scroll; DOMANDE
const SEAL = [868, 640];
const cam19 = t => {
  const u = eio(seg(t, T.cta - .15, T.domande - .25)), v = seg(t, T.domande - .25, DUR);
  const z = lerp(3.1 + .1 * seg(t, T.cut19, T.seal) + .16 * ss(seg(t, T.seal, T.cta + .4)), .9, u) - .07 * v;
  return { x: lerp(SEAL[0] - 40, 540, u), y: lerp(SEAL[1] + 10, 1420, u) + 20 * v, z };
};
function sceneEnd(Ls, t) {
  const cam = cam19(t); riverBase(Ls, cam, t); useCam(Ls, cam);
  riverTree(Ls, t);
  const L = Ls.ink;
  bridgeDraw(Ls, 1, 1, t);
  bankReeds(Ls);
  coin(L, COIN[0], COIN[1], 38, 1);
  client(Ls, POSE.stand, 262, K[1] + deckY(262 - K[0]) + 2, 2.3, t, { seed: 5 });
  // the first stroke at the top of the scroll (the beginning), the seal beside it
  draw(L, LY.oneTop, 1, 1);
  const sk = seg(t, T.seal - .04, T.seal + .06);
  if (sk > 0) { const c = Ls.cc; c.save(); seal(c, SEAL[0], SEAL[1], 132 * (1 + .06 * (1 - sk)), .96 * sk, 5); c.restore(); }
  // DOMANDE written on «DOMANDE»
  const dp = seg(t, T.domande - .1, T.domande + .9);
  if (dp > 0) {
    title(Ls, 'DOMANDE', 520, 1000, 132, dp, { track: .12 });
    draw(L, LY.under, eo(seg(t, T.domande + .45, T.domande + .95)), 1);
  }
  // water keeps moving: rings every ~1.6 s under the bridge, a last drop on «privato»
  for (let k = 0; k < 6; k++) rings(L, 430 + k * 37 % 220, 1860 + (k % 3) * 22, t - (T.cta + k * 1.25), { n: 2, r: 220, life: 3.4, sq: .28, w: 4, seed: 70 + k, am: .7 });
  const du = seg(t, T.privato, T.privato + .3);
  if (du > 0 && du < 1) drop(L, 760, lerp(1200, 1900, du * du));
  rings(L, 760, 1900, t - (T.privato + .3), { n: 4, r: 320, life: 3.5, sq: .3, w: 6, seed: 81 });
  for (let i = 0; i < 4; i++) { const y = 2200 + i * 80, x0 = ((t * (18 + i * 4) + i * 300) % 1500) - 360; draw(L, mk([[x0, y], [x0 + 420, y + 6]], { w: 24, tone: .12, dry: .3, wet: .9, prof: 'lens', seed: 360 + i }), 1, .7); }
  let shake = [0, 0]; const k = t - T.seal; if (k > 0 && k < .25) { const a = (1 - k / .25) * 6; shake = [Math.sin(k * 70) * a, Math.cos(k * 60) * a]; }
  return { paper: paperOf(cam), bleed: 5, rim: .95, shake };
}

// ---------------- dispatcher ----------------
function frameAt(t, Ls) {
  if (t < T.cut2) return sceneBank1(Ls, t);
  if (t < T.x3a) return sceneIncense(Ls, t, inc2);
  if (t < T.x5a) return sceneBank3(Ls, t);
  if (t < T.lift) return scenePage(Ls, t);
  if (t < T.x10a) return sceneWater(Ls, t);
  if (t < T.q2 - .1) { const r = sceneRiver10(Ls, t, riverCam10); return { paper: paperOf(r.cam), bleed: 5, rim: .95, shake: r.shake }; }
  if (t < T.cut12) return sceneRiver11(Ls, t);
  if (t < T.cut14) return sceneDot(Ls, t);
  if (t < T.x15a) return sceneIncense(Ls, t, inc14);
  if (t < T.cut19) return sceneRiver15(Ls, t);
  return sceneEnd(Ls, t);
}
// ink-bloom transitions: [start, end, center fn, scene A time policy]
const TRANS = [
  { a: T.x3a, b: T.x3b, c: () => [560, 300], before: (t, Ls) => sceneIncense(Ls, t, inc2) },
  { a: T.x5a, b: T.x5b, c: () => [700, 1000], before: (t, Ls) => sceneBank3(Ls, t) },
  { a: T.lift, b: T.lift + .62, c: () => [540, 960], before: (t, Ls) => scenePage(Ls, t) },
  { a: T.x10a, b: T.x10b, c: t => w2s(waterCam(t), D1), before: (t, Ls) => sceneWater(Ls, t) },
  { a: T.x15a, b: T.x15b, c: () => [600, 420], before: (t, Ls) => sceneIncense(Ls, t, inc14) },
];
export const frame = makeFrame({ frameAt, TRANS, sub });
// ---------------- subtitles placement (screen space, in each shot's empty paper) ----------------
const SUBPOS = {
  S01: [70, 330], S02: [70, 330], S03: [70, 330], S04: [70, 330], S05: [70, 1290], S06: [70, 1300], S07: [70, 1300],
  S08: [70, 330], S09: [70, 420], S10: [70, 330], S11: [70, 420], S12: [70, 330], S13: [70, 330], S14: [70, 330],
  S15: [70, 330], S16: [70, 330], S17: [70, 330], S18: [70, 1330], S19: [70, 1300], S20: [70, 720],
};
// SUB_CENTRATI: false = come nel film originale (sottotitoli a sinistra, x=70, piccoli: DIFETTO NOTO).
// Per i NUOVI reel metti true: frase centrata su x=540, corpo 68, margini simmetrici (vedi SAFE in motore/base.js).
const SUB_CENTRATI = false;
let SUBBOX = [];
function sub(t, Ls, quiet = false) {
  SUBBOX = [];
  for (const c of CUES) {
    if (t < c.t0 || t > c.t1) continue;
    const a = Math.min(clamp((t - c.t0) / .3), clamp((c.t1 - t) / .3));
    const [x, y] = c.id === 'S20' && c.text.startsWith('Vuoi') ? [70, 1330] : SUBPOS[c.id];
    if (SUB_CENTRATI) {
      if (c.big) label(Ls, c.big, SAFE.margin + 40, y - 110, a, 34);
      inscription(Ls, c.text, SAFE.cx, y, a, { size: 68, center: true });
    } else if (c.big) {
      label(Ls, c.big, x + 6, y - 96, a, 32);
      inscription(Ls, c.text, x, y, a, { size: 62 });
    } else {
      inscription(Ls, c.text, x, y, a, { size: 56 });
    }
  }
}

// ---------------- texts for readcheck (titles and labels; subtitles are checked by the .srt) ----------------
const TB = {};
function tbox(key, text, cx, y, size, track = .1) {
  if (!TB[key]) { const c = document.createElement('canvas').getContext('2d'); c.font = `600 ${size}px CormorantSC`; c.letterSpacing = `${size * track}px`; const W = c.measureText(text).width - size * track; TB[key] = { x0: cx - W / 2, x1: cx + W / 2, y0: y - size * .72, y1: y + size * .06 }; }
  return TB[key];
}
export function texts(t) {
  const out = [];
  const sbox = (cam, b) => { const a = w2s(cam, [b.x0, b.y0]), c = w2s(cam, [b.x1, b.y1]); return { x0: a[0], y0: a[1], x1: c[0], y1: c[1] }; };
  const box = (W, cam, y0, y1) => { const a = w2s(cam, [W.x0, y0]), b = w2s(cam, [W.x0 + W.width, y1]); return { x0: a[0], y0: a[1], x1: b[0], y1: b[1] }; };
  if (t >= T.title + .75 && t < T.client + .2) { const cam = pageCam(t); out.push({ id: 'title5a', text: 'CI DEVO', ...sbox(cam, tbox('a', 'CI DEVO', 485, 640, 150)) }); out.push({ id: 'title5b', text: 'PENSARE', ...sbox(cam, tbox('b', 'PENSARE', 485, 810, 150)) }); }
  if (t >= T.end18 + .3 && t < T.fine18 + .5) { const cam = cam15(t); out.push({ id: 'title18a', text: 'CI DEVO', ...sbox(cam, tbox('c', 'CI DEVO', 520, 2390, 136)) }); }
  if (t >= T.end18 + .56 && t < T.fine18 + .2) { const cam = cam15(t); out.push({ id: 'title18b', text: 'PENSARE', ...sbox(cam, tbox('d', 'PENSARE', 520, 2545, 136)) }); }
  if (t >= T.domande + .7) { const cam = cam19(t); out.push({ id: 'domande', text: 'DOMANDE', ...sbox(cam, tbox('e', 'DOMANDE', 520, 1000, 132, .12)) }); }
  for (const c of CUES) if (c.big && t >= c.t0 + .3 && t <= c.t1 - .3) out.push({ id: 'label' + c.id, text: c.big, x0: 76, y0: SUBPOS[c.id][1] - 130, x1: 400, y1: SUBPOS[c.id][1] - 80 });
  return out;
}

// ---------------- sound events (for mix.py) ----------------
export function events() {
  const E = [{ t: 0, type: 'vo' }];
  const ev = (t, type, gain = 1, o = {}) => E.push({ t: +t.toFixed(3), type, gain, ...o });
  // 1
  for (let i = 0; i < 4; i++) ev(.05 + i * .5, 'step', .35);
  ev(T.hookMist, 'mist', .5); ev(T.coin1, 'brush', .45, { dur: .4 }); ev(T.coin1 + .35, 'tick', .5);
  // 2
  ev(T.cut2, 'cut', .9); ev(T.ashFall + .02, 'ash', .8); ev(T.ashFall + .5, 'ashland', .6); ev(T.rewind, 'rewind', .7, { dur: .9 });
  ev(T.x3a, 'mist', .6);
  // 3–4
  TRIES.forEach(([a, b]) => { ev(a, 'brush', .55, { dur: b - a }); ev(b + .05, 'dissolve', .45); });
  ev(T.dry - .22, 'scratch', 1.0, { dur: .45 });
  ev(T.x5a + .1, 'bloom', .5);
  // 5–7
  ev(T.title, 'brush', .35, { dur: 1.1 }); ev(T.one + .03, 'onestroke', 1.0);
  ev(T.client, 'brush', .4, { dur: .8 }); ev(T.ring, 'brush', .4, { dur: .55 }); ev(T.client - .1, 'dissolve', .3);
  ev(T.brushIn - .5, 'air', .5);
  BANNERS.forEach((b, i) => ev(b.t0, 'banner', .6 + .05 * i));
  ev(T.lift - .02, 'bloom', .7);
  // 8–9
  ev(T.lit, 'ignite', .5); ev(T.drop1 + .26, 'drip', 1.0); ev(T.drop2 + .38, 'drip', .9);
  ev(T.x10a, 'bloom', .6);
  // 10–11
  ev(CRACK, 'crack', .8); ev(SPLIT, 'collapse', .9); ev(SPLIT + .5, 'splash', 1.0);
  ev(T.tell, 'brush', .35, { dur: 1.0 }); ev(T.q2 + .3, 'drip', .9);
  ev(T.what - .05, 'flood', 1.0, { dur: T.sil0 - T.what + .05 });
  ev(T.sil0 + .35, 'drip', .8);
  // 12–13
  ev(T.cut12, 'paper', .3); ev(T.slam, 'slam', 1.0); ev(T.slam + .02, 'splatter', .9); ev(T.exit, 'air', .6);
  ev(T.spread, 'spread', .7, { dur: T.serve - T.spread }); ev(T.serve, 'join', .7);
  // 14
  ev(T.cut14, 'cut', .7); ev(T.dopo + .02, 'ash', .7); ev(T.dopo + .5, 'ashland', .5); ev(T.x15a, 'mist', .5);
  // 15–18
  ev(T.price, 'brush', .45, { dur: .45 }); ev(T.price + .42, 'tick', .55);
  ev(T.nodef, 'brush', .3, { dur: .35 }); ev(T.nodef + .5, 'dissolve', .4);
  ev(T.repeat - .05, 'brush', .6, { dur: T.him - T.repeat + .15 });
  ev(T.ask + .26, 'drip', .8); ev(T.decide - .05, 'step', .3); ev(T.decide + .45, 'step', .3);
  ev(T.end18 + .1, 'brush', .3, { dur: .9 }); ev(T.evap, 'dissolve', .5);
  // 19–20
  ev(T.cut19, 'paper', .3); ev(T.seal, 'seal', 1.0);
  ev(T.domande - .1, 'brush', .5, { dur: 1.0 }); ev(T.privato + .3, 'drip', .7);
  // silences (whole bus to zero) and ambience beds
  E.push({ type: 'silence', t0: T.hush0, t1: T.x5a + .2, soft: 1 });
  E.push({ type: 'silence', t0: T.sil0, t1: T.cut12 + .02 });
  E.push({ type: 'amb', kind: 'wind', t0: 0, t1: T.cut2 }); E.push({ type: 'amb', kind: 'wind', t0: T.x3a - .3, t1: T.x5a });
  E.push({ type: 'amb', kind: 'room', t0: T.cut2, t1: T.x3a + .3 }); E.push({ type: 'amb', kind: 'room', t0: T.x5a, t1: T.lift + .3 });
  E.push({ type: 'amb', kind: 'water', t0: T.lift, t1: T.what }); E.push({ type: 'amb', kind: 'rain', t0: T.what - .05, t1: T.sil0 });
  E.push({ type: 'amb', kind: 'water', t0: T.cut12 + .3, t1: T.cut14 }); E.push({ type: 'amb', kind: 'room', t0: T.cut14, t1: T.x15b });
  E.push({ type: 'amb', kind: 'water', t0: T.x15a, t1: DUR }); E.push({ type: 'amb', kind: 'wind', t0: T.end18 - .4, t1: T.cut19 });
  E.push({ type: 'marks', T });
  E.push({ type: 'cues', cues: CUES.map(c => ({ id: c.id, text: c.text, a: c.a, b: c.b, t0: c.t0, t1: c.t1 })) });
  return E;
}

// ---------------- model sheets with the real engine ----------------
export function test(mode, t, A, B) {
  const L = A.ink; A.xf(1, 0, 0);
  if (mode === 'props') {
    coin(L, 200, 260, 90, 1);
    incense(L, 560, 700, { s: .9, h: 560, burn: .3, t: 2, ash: .6 });
    brush(L, 820, 520, -1.05, { s: .8, wet: 1 });
    brush(L, 960, 980, -1.15, { s: .55, wet: .1, splay: 1 });
    banner(L, 60, 760, 260, 700, 61, 1, 1);
    A.xf(.62, 330, 380); bridgeDraw(A, 1, 1, 0); A.xf(1, 0, 0);
    writeWord(L, brushWord('CI DEVO', 540, 1480, 110, { center: true }), 1);
    writeWord(L, brushWord('DOMANDE', 540, 1640, 110, { center: true, seed: 3 }), 1);
    seal(A.cc, 960, 300, 120, .96, 5);
    return { bleed: 5, rim: .9 };
  }
  if (mode === 'client') {
    client(A, POSE.wait, 220, 800, 5.4, t, { seed: 4 });
    client(A, POSE.stand, 560, 800, 5.4, t, { seed: 5 });
    client(A, walkPose(.25), 880, 800, 5.4, t, { seed: 3 });
    client(A, POSE.back, 300, 1650, 5.4, t, { seed: 6 });
    plum(L, 1060, 1200, 1.1, 1, 1);
    inscription(A, 'Se un cliente ti dice\n«ci devo pensare»,', 70, 1820 - 300, 1);
    return { bleed: 5, rim: .9 };
  }
  return {};
}
