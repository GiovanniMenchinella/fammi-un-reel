// CONTENT of the reel «Ci devo pensare» (swiss-motion). To make a new reel: rewrite THIS file only (engine.js stays).
// A SCENE here = a "cue" (subtitle line + its word blocks) hooked to the voice words:
//   CUE_DEF  ['c01', 'S01', 0, 12]  -> cue id, voice scene (id from vo-timing.json OR its 1-based number), first word, last word.
//   key times T.xxx = ws(scene, wordIndex) (word start) / we(...) (word end): every animation lands on a word, never on a typed second.
//   blk({cue, lines:[tks(sc,a,b)], x,y,size, wt, col, mode:'up'|'down'|'knife', maxW, pos:track(..)})  words appear one by one on the voice.
//   drawing functions draw(g,t) per shot on the grid world; buildEvents() lists sound cues (kind from the families in tools/cues.py).
import { HOOK, T, CUES, BLOCKS, W, H, C, X0, CW, PIT, GY, XR, colX, rowY, modR, ws, we, wd, tk, tks, blk, font, reveal, setTiming, DURATION,
  ID, camFor, w2s, rs, outline, wipeRect, collapseRect, lerpR, mul, makeDrift, moveTimes, renderFilm,
  clamp, lerp, seg, E, snap, lin, steps, track, E8, E16, E32, BEAT } from './engine.js';
export { setTiming, DURATION, renderFilm };

const CUE_DEF = [
  ['c01', 'S01', 0, 12], ['c02', 'S02', 0, 7], ['c03', 'S03', 0, 9], ['c04', 'S04', 0, 4], ['c05', 'S05', 0, 7],
  ['c06a', 'S06', 0, 5], ['c06b', 'S06', 6, 11], ['c07a', 'S07', 0, 5], ['c07b', 'S07', 6, 11],
  ['c08a', 'S08', 0, 3], ['c08b', 'S08', 4, 6], ['c09a', 'S09', 0, 0], ['c09b', 'S09', 1, 7],
  ['c10a', 'S10', 0, 2], ['c10b', 'S10', 3, 4], ['c11a', 'S11', 0, 0], ['c11b', 'S11', 1, 10], ['c12', 'S12', 0, 3],
  ['c13a', 'S13', 0, 6], ['c13b', 'S13', 7, 9], ['c14', 'S14', 0, 7], ['c15', 'S15', 0, 6], ['c16', 'S16', 0, 7],
  ['c17', 'S17', 0, 7], ['c18a', 'S18', 0, 2], ['c18b', 'S18', 3, 7], ['c19', 'S19', 0, 2], ['c20a', 'S20', 0, 9], ['c20b', 'S20', 10, 17],
];

// ---------------- camera on the call grid (world → screen) ----------------
const K47 = modR(47), BOX = [64, 572, 820, 820];
const CAM_K47 = camFor(K47[0], K47[1], BOX[0], BOX[1], BOX[2] / CW);
const R1 = [352, 832, 408, 408], R1BOX = [64, 764, 632, 632];
const CAM_R1 = camFor(R1[0], R1[1], R1BOX[0], R1BOX[1], R1BOX[2] / R1[2]);
const CAM_S8 = [540, 576, 1];
const CAM_PAN = [540, 1680, 1];
const CAM_OV = camFor(X0, GY, 64, 842, .48);
const CAM_OPEN = camFor(K47[0], K47[1], 470, 880, 3);
const gridCam = track([[0, CAM_OPEN], [1.61, ID, 1.34], [8.61, CAM_K47, .37], [14.06, ID, .001], [17.45, CAM_R1, .44], [23.45, ID, .34],
  [26.10, CAM_S8, .001], [44.50, ID, .001], [49.74, CAM_PAN, .37], [58.90, CAM_K47, .36], [62.30, CAM_OV, .67]]);

let RANK_R1 = [], RANK_K0 = [];

function build() {
  BLOCKS.length = 0;
  for (const [id, sc, a, b] of CUE_DEF) {
    const t0 = ws(sc, a), te = we(sc, b), H_ = Math.max(te + .6, t0 + 1.8);
    let text = []; for (let i = a; i <= b; i++) text.push(wd(sc, i).w.replace(/^"/, '“').replace(/"/, '”'));
    CUES[id] = { id, t0, te, H: H_, text: text.join(' ') };
  }

  // ranks for the re-flow into one module (nearest to R1 first) and the collapse away from module 0
  const d1 = k => { const r = modR(k); return Math.hypot(r[0] + 60 - (R1[0] + R1[2] / 2), r[1] + 60 - (R1[1] + R1[3] / 2)); };
  RANK_R1 = [...Array(48).keys()].sort((a, b) => d1(a) - d1(b)).reduce((m, k, i) => (m[k] = i, m), []);
  const d0 = k => Math.hypot(modR(k)[0] - X0, modR(k)[1] - GY);
  RANK_K0 = [...Array(48).keys()].sort((a, b) => d0(a) - d0(b)).reduce((m, k, i) => (m[k] = i, m), []);

  T.red47 = ws('S01', 7); T.black5 = ws('S02', 5); T.five = ws('S02', 6);
  T.list = [ws('S03', 2), ws('S03', 3), ws('S03', 4), ws('S03', 5), ws('S03', 6), ws('S03', 7), ws('S03', 8), ws('S03', 9)];
  T.tardi = ws('S04', 4); T.knife3 = T.tardi - E16;
  T.paper = CUES.c04.H; T.cosa = ws('S05', 6); T.sola = ws('S05', 7);
  T.reflow = ws('S05', 6);
  T.quello = ws('S07', 6); T.sembra = ws('S07', 10); T.pubb = ws('S07', 11); T.cut7 = CUES.c07b.H;
  T.primi = ws('S08', 2); T.due = ws('S08', 5); T.domande = ws('S08', 6);
  T.split = we('S08', 6); T.push9 = CUES.c08b.H; T.adesso = ws('S09', 7);
  T.qual = ws('S10', 0); T.fatt = ws('S10', 3); T.pan11 = CUES.c10b.H;
  T.sei = ws('S11', 3); T.tutto = ws('S11', 5); T.stop = 41.93;
  T.stai = ws('S12', 2); T.zitto = ws('S12', 3);
  T.li = ws('S13', 0); T.flow0 = CUES.c12.H; T.cambia = ws('S14', 4); T.arriva = ws('S14', 6); T.dopo = ws('S14', 7);
  T.prezzo = ws('S15', 3); T.def = [ws('S15', 4), ws('S15', 5), ws('S15', 6)]; T.gli = ws('S16', 0); T.detto = ws('S16', 6);
  T.decidere = ws('S17', 7); T.push16 = CUES.c17.H; T.cut18 = ws('S18', 7) + .08; T.si = ws('S19', 0); T.iniz = ws('S19', 2);
  T.lista = ws('S20', 2); T.listDone = ws('S20', 5); T.endCut = 69.15; T.commenta = ws('S20', 10); T.domandeCTA = ws('S20', 11);

  const S = (sc, i, txt, o = {}) => tk(sc, i, { txt, ...o });
  // ---- shot 1: hook
  blk({ cue: 'c01', lines: [tks('S01', 0, 4)], x: 64, y: 330, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c01', lines: [[S('S01', 5, '“ci'), tk('S01', 6)], [S('S01', 7, 'pensare”')]], x: 64, y: 1190, size: 150, lh: 1.0, col: C.red, mode: 'down' });
  blk({ cue: 'c01', lines: [tks('S01', 8, 11)], x: 64, y: 760, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c01', lines: [[tk('S01', 12)]], x: 64, y: 930, size: 170, mode: 'knife', strike: we('S01', 12) - .23 });
  // ---- shot 2: lost in the first five minutes
  blk({ cue: 'c02', lines: [tks('S02', 0, 1), tks('S02', 2, 3)], x: 64, y: 480, size: 104 });
  blk({ cue: 'c02', lines: [tks('S02', 4, 5)], x: 496, y: 1120, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c02', lines: [[S('S02', 6, '5')]], x: 64, y: 1384, size: 720, mode: 'down', steps: 4, base: .01 });
  blk({ cue: 'c02', lines: [[tk('S02', 7)]], x: 496, y: 1240, size: 104 });
  // ---- shot 3: searching for the right line at the end
  blk({ cue: 'c03', lines: [tks('S03', 0, 2)], size: 56, wt: 500, col: C.lead, pos: track([[0, [64, 740, 56]], [CUES.c02.H + .25, [64, 330, 56], .25]]) });
  blk({ cue: 'c03', lines: [tks('S03', 3, 5)], x: 64, y: 462, size: 104 });
  blk({ cue: 'c03', lines: [tks('S03', 6, 9)], x: 64, y: 538, size: 56, wt: 500, col: C.lead });
  // ---- shot 4: too late
  blk({ cue: 'c04', lines: [tks('S04', 0, 3)], x: 104, y: 668, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c04', lines: [[tk('S04', 4)]], x: 104, y: 1318, size: 230 });
  // ---- shot 5: one thing only
  blk({ cue: 'c05', lines: [[S('S05', 0, '“ci'), tk('S05', 1)], [S('S05', 2, 'pensare”')]], x: 64, y: 390, size: 140, lh: 1.0, col: C.red });
  blk({ cue: 'c05', lines: [tks('S05', 3, 4)], x: 64, y: 640, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c05', lines: [tks('S05', 5, 7)], x: 64, y: 762, size: 104 });
  // ---- shot 6: the empty module
  blk({ cue: 'c06a', lines: [tks('S06', 0, 3), tks('S06', 4, 5)], size: 56, lh: 1.12, wt: 500, col: C.lead, pos: track([[0, [64, 1300, 56]], [17.45, [64, 330, 56], .32]]) });
  blk({ cue: 'c06b', lines: [tks('S06', 6, 8)], x: 64, y: 470, size: 104 });
  blk({ cue: 'c06b', lines: [tks('S06', 9, 10), [tk('S06', 11)]], x: 64, y: 584, size: 104 });
  // ---- shot 7: what you say looks like an ad
  blk({ cue: 'c07a', lines: [tks('S07', 0, 5)], x: 64, y: 330, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c07b', lines: [tks('S07', 6, 7), tks('S07', 8, 9)], x: 64, y: 470, size: 104 });
  blk({ cue: 'c07b', lines: [[tk('S07', 10)]], x: 112, y: 818, size: 56, wt: 500, col: C.paper, mode: 'knife', knifeCol: C.page });
  blk({ cue: 'c07b', lines: [[tk('S07', 11)]], x: 112, y: 1000, size: 140, col: C.paper, maxW: 760, mode: 'knife', knifeCol: C.page });
  // ---- shot 8: two questions
  blk({ cue: 'c08a', lines: [tks('S08', 0, 3)], x: 64, y: 330, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c08b', lines: [tks('S08', 4, 6)], x: 64, y: 470, size: 104, maxW: 840 });
  // ---- shot 9-10: the first question, the red story
  blk({ cue: 'c09a', lines: [[tk('S09', 0)]], x: 64, y: 330, size: 56, wt: 500, col: C.lead });
  const cell1 = t => { const r = CELL1(t); return [r[0], r[1]]; }, cell2 = t => { const r = CELL2(t); return [r[0], r[1]]; };
  blk({ cue: 'c09b', out: T.pan11, mode: 'none', hideAfter: T.pan11 + 1, lines: [tks('S09', 1, 3), tks('S09', 4, 5), [tk('S09', 6), tk('S09', 7, { under: T.adesso + .1 })]],
    rel: cell1, size: 88, lh: 1.12, maxW: 770, pos: track([[0, [40, 300, 88]], [T.fatt + .5, [40, 236, 62], .5]]) });
  blk({ cue: 'c10a', out: T.pan11, mode: 'none', hideAfter: T.pan11 + 1, lines: [[tk('S10', 0)], tks('S10', 1, 2)], rel: cell1, x: 40, y: 690, size: 76, lh: 1.05 });
  blk({ cue: 'c10b', out: T.pan11, mode: 'none', hideAfter: T.pan11 + 1, lines: [tks('S10', 3, 4)], rel: cell1, x: 40, y: 884, size: 76 });
  // ---- shot 11: the second question
  blk({ cue: 'c11a', lines: [[tk('S11', 0)]], x: 64, y: 372, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c11b', out: T.stai, mode: 'knife', lines: [tks('S11', 1, 2).concat([S('S11', 3, '6'), tk('S11', 4)]), tks('S11', 5, 8), tks('S11', 9, 10)],
    rel: cell2, x: 40, y: 300, size: 88, lh: 1.12, maxW: 770 });
  // ---- shot 12: and then shut up
  blk({ cue: 'c12', lines: [tks('S12', 0, 1)], x: 64, y: 372, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c12', lines: [[tk('S12', 2)]], x: 64, y: 520, size: 104 });
  blk({ cue: 'c12', lines: [[tk('S12', 3)]], x: 64, y: 968, size: 360, maxW: 850 });
  // ---- shot 13: the client explains himself
  blk({ cue: 'c13a', lines: [tks('S13', 0, 4)], x: 64, y: 1080, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c13a', lines: [tks('S13', 5, 6)], x: 64, y: 1200, size: 104 });
  blk({ cue: 'c13b', lines: [tks('S13', 7, 9)], x: 64, y: 1322, size: 104, maxW: 840 });
  // ---- shot 14: what comes after
  const panY = (y0) => track([[0, [64, y0, 0]], [T.dopo, [64, y0 - 720, 0], .37]]);
  blk({ cue: 'c14', lines: [tks('S14', 0, 3)], size: 56, wt: 500, col: C.lead, pos: (p => t => { const v = p(t); return [v[0], v[1], 56]; })(panY(1080)) });
  blk({ cue: 'c14', lines: [tks('S14', 4, 5)], size: 104, pos: (p => t => { const v = p(t); return [v[0], v[1], 104]; })(panY(1200)) });
  blk({ cue: 'c14', lines: [tks('S14', 6, 7)], size: 104, pos: (p => t => { const v = p(t); return [v[0], v[1], 104]; })(panY(1312)) });
  // ---- shots 15-17: the price page, a programme of three rules
  const L = C.lead;
  blk({ cue: 'c15', out: T.push16, lines: [tks('S15', 0, 3, { col: L, wt: 500 }), tks('S15', 4, 6)], x: 64, y: 1002, size: 58, lh: 1.14, maxW: 840 });
  blk({ cue: 'c16', out: T.push16, lines: [tks('S16', 0, 1, { col: L, wt: 500 }), tks('S16', 2, 7)], x: 64, y: 1150, size: 58, lh: 1.14, maxW: 840 });
  blk({ cue: 'c17', out: T.push16, lines: [tks('S17', 0, 2, { col: L, wt: 500 }), tks('S17', 3, 7)], x: 64, y: 1298, size: 58, lh: 1.14, maxW: 840 });
  // ---- shot 16: "ci devo pensare" is cut from the end
  blk({ cue: 'c18a', out: T.cut18, mode: 'knife', knifeCol: C.ink, lines: [[S('S18', 0, '“ci'), tk('S18', 1)], [S('S18', 2, 'pensare”')]], col: C.red, lh: 1.0,
    pos: track([[0, [64, 400, 140]], [T.push16 + .46, [112, 900, 130], .46]], x => x) });
  blk({ cue: 'c18b', lines: [tks('S18', 3, 5), tks('S18', 6, 7)], x: 64, y: 340, size: 96, lh: 1.1 });
  // ---- shot 17: prevented at the start
  blk({ cue: 'c19', lines: [tks('S19', 0, 1)], x: 64, y: 604, size: 104 });
  blk({ cue: 'c19', lines: [[tk('S19', 2)]], x: 64, y: 772, size: 150, maxW: 840 });
  // ---- shot 18: call to action
  blk({ cue: 'c20a', out: T.endCut, mode: 'knife', lines: [tks('S20', 0, 3)], x: 64, y: 330, size: 56, wt: 500, col: C.lead });
  blk({ cue: 'c20a', out: T.endCut + E32, mode: 'knife', lines: [tks('S20', 4, 5), tks('S20', 6, 9)], x: 64, y: 452, size: 88, lh: 1.12, maxW: 840 });
  blk({ cue: 'c20b', out: null, lines: [[tk('S20', 10)]], x: 104, y: 716, size: 50, wt: 700 });
  blk({ cue: 'c20b', out: null, lines: [[S('S20', 11, 'DOMANDE')]], x: 104, y: 862, size: 150, maxW: 680 });
  blk({ cue: 'c20b', out: null, lines: [tks('S20', 12, 17)], x: 64, y: 966, size: 52, wt: 500, col: C.lead });
}

// ---------------- the cells of the two questions (screen space) ----------------
const CELL1 = t => track([[0, [64, 640, 120, 120]], [T.split, [64, 640, 840, 360], .38], [T.push9 + .33, [64, 420, 840, 940], .33], [T.pan11 + .36, [64, -660, 840, 940], .36]])(t);
const CELL2 = t => track([[0, [208, 640, 120, 120]], [T.split - .19, [64, 1040, 120, 120], .19], [T.split + .12, [64, 1040, 840, 360], .31], [T.push9 + .33, [64, 1500, 840, 940], .33], [T.pan11 + .36, [64, 420, 840, 940], .36]])(t);

// ---------------- the grid world ----------------
function gridLines(g, cam, col, t, from = 0, alive = () => true, focus = 47) {
  g.lineWidth = 2; g.strokeStyle = col;
  for (let k = 0; k < 48; k++) {
    if (!alive(k)) continue;
    const r = rs(cam, modR(k));
    if (r[2] > 420 && k !== focus) continue;
    if (r[0] > W || r[1] > H || r[0] + r[2] < 0 || r[1] + r[3] < 0) continue;
    g.strokeRect(r[0] + 1, r[1] + 1, r[2] - 2, r[3] - 2);
  }
}
// opening cascade of the module outlines (reading order)
const cascade = (t, t0, k) => t >= t0 + k * .006;

function drawWorldA(g, t) {        // 0 → paper wipe: the call, the red end, the black start, the end module up close
  const cam = gridCam(t);
  gridLines(g, cam, C.line, t, 0, k => cascade(t, 0, k));
  // red end module (the client's words at the end of the call)
  if (t < CUES.c01.H + E8) {
    const r = rs(cam, modR(47)), kk = 1 - snap(t, CUES.c01.H + E8, E8);
    g.fillStyle = C.red; wipeRect(g, collapseRect(r, kk), 1, 'up');
  }
  // the first five minutes, black
  for (let i = 0; i < 5; i++) {
    const t1 = T.black5 + i * E16;
    if (t < t1) continue;
    g.fillStyle = C.ink; wipeRect(g, rs(cam, modR(i)), snap(t, t1 + E16, E16), 'left');
  }
  if (t > CUES.c02.H) drawEndBox(g, t, cam);
}
function drawEndBox(g, t, cam) {   // inside the last module: the phrases arrive one per word, the search frame follows, the knife, the end rule
  const R = rs(cam, modR(47)), u = R[2] / BOX[2];
  if (u < .05) return;
  g.save(); g.beginPath(); g.rect(R[0], R[1], R[2], R[3]); g.clip();
  g.fillStyle = C.page; g.fillRect(R[0], R[1], R[2], R[3]);
  const rnd = mul(47), n = T.list.length;
  const lens = Array.from({ length: n }, () => .72 + rnd() * .28);
  const pitch = 64 * u, top = R[1] + 150 * u, rows = 8;
  // which bar is selected: the newest one; the column scrolls one row when it is full, and creeps up slowly (linear) all the time
  const sel = T.list.reduce((a, on, i) => t >= on ? i : a, -1);
  const fullScroll = T.list.reduce((a, on, i) => a + (i >= rows - 1 ? snap(t, on + E16, E16) : 0), 0);
  const creep = lin(t, T.list[0], T.tardi) * .55;
  const off = (fullScroll + creep) * pitch;
  const selY = top + (Math.max(0, sel) + .5) * pitch - off;
  const kn = t > T.knife3 ? lin(t, T.knife3, T.tardi) : 0;
  g.save(); g.beginPath(); g.rect(R[0], R[1] + 128 * u, R[2], 600 * u); g.clip();
  for (let i = 0; i < n; i++) {
    if (t < T.list[i]) continue;
    const yy = top + (i + .5) * pitch - off;
    let h = 36 * u, y0 = yy - h / 2;
    if (t > T.tardi) {   // collapse to the knife line, nearest first
      const rank = Math.abs(yy - selY) / pitch, kk = 1 - snap(t, T.tardi + E8 + rank * E32, E8);
      if (kk <= 0) continue;
      const ny = lerp(selY, yy, kk); h *= kk; y0 = ny - h / 2;
    }
    g.fillStyle = i === sel ? C.ink : C.grey;
    wipeRect(g, [R[0] + 48 * u, y0, (BOX[2] - 96) * lens[i] * u, h], snap(t, T.list[i] + E16, E16), 'left');
  }
  if (sel >= 0) {    // the search frame jumps to the newest phrase
    const kk = t > T.tardi ? 1 - snap(t, T.tardi + E8, E8) : 1;
    const y = lerp(top + (Math.max(0, sel - 1) + .5) * pitch - off, selY, snap(t, T.list[sel] + E16, E16));
    if (kk > 0) outline(g, [R[0] + 30 * u, y - 30 * u * kk, (BOX[2] - 60) * u, 60 * u * kk], C.ink, 4);
  }
  g.restore();
  if (kn > 0 && t < T.tardi + E8) { g.fillStyle = C.ink; g.fillRect(R[0] + 16 * u, selY - 1.5, (BOX[2] - 32) * u * kn, 3); }
  // the end rule, drawn during the silence
  if (t > T.tardi + .25) { g.fillStyle = C.ink; g.fillRect(R[0] + 40 * u, R[1] + 790 * u, (BOX[2] - 80) * u * lin(t, T.tardi + .25, T.paper - .3), 8 * u); }
  g.restore();
  outline(g, R, C.ink, 3);
}

// paper sheet (13.78 → knife at 26.05): shots 5, 6, 7
function drawPaper(g, t) {
  if (t < T.paper || t > T.cut7 + E16 + E8 + .01) return;
  const top = lerp(H, 0, snap(t, T.paper + .25, .25));
  const kk = t > T.cut7 + E16 ? 1 - snap(t, T.cut7 + E16 + E8, E8) : 1, mid = 1000;
  g.save();
  g.beginPath(); const y0 = lerp(mid, top, kk), y1 = lerp(mid, H + 120, kk); g.rect(-120, y0, W + 240, y1 - y0); g.clip();
  g.translate(0, mid); g.scale(1, Math.max(.001, kk)); g.translate(0, -mid);
  g.fillStyle = C.paper; g.fillRect(-120, -120, W + 240, H + 240);
  const cam = t < 14.06 ? ID : gridCam(t);
  // modules: grid → re-flow into one → push → split back → black flood → merged poster
  const tSplit = T.quello;
  for (let k = 0; k < 48; k++) {
    let r = modR(k);
    const pr = snap(t, T.reflow + Math.floor(RANK_R1[k] / 6) * E16 + E8, E8);
    const pb = t > tSplit ? snap(t, tSplit + .34, .34) : 0;
    const pin = pr * (1 - pb);
    r = lerpR(r, R1, pin);
    const S = rs(cam, r);
    const black = k >= 18 && t > T.quello + .34 + (k - 18) * .018;
    if (black) {
      const pm = snap(t, T.pubb, T.pubb - T.sembra), c = k % 6, row = Math.floor(k / 6);
      let ex = [S[0] - 12 * pm, S[1] - 12 * pm, S[2] + 24 * pm, S[3] + 24 * pm];
      if (c === 5) ex[2] += (W + 80 - (ex[0] + ex[2])) * pm;
      if (row === 7) ex[3] += (H + 80 - (ex[1] + ex[3])) * pm;
      g.fillStyle = C.ink; wipeRect(g, ex, snap(t, T.quello + .34 + (k - 18) * .018 + E32, E32), 'left');
    } else {
      g.lineWidth = 2; g.strokeStyle = C.pline; g.strokeRect(S[0] + 1, S[1] + 1, S[2] - 2, S[3] - 2);
    }
  }
  // the one module: paper with a black frame, empty quotes and a waiting caret
  if (t > T.sola && t < tSplit + .2) {
    const S = rs(cam, R1), u = S[2] / R1BOX[2], kk2 = t > tSplit ? 1 - snap(t, tSplit + E8, E8) : 1;
    g.fillStyle = C.paper; g.fillRect(S[0], S[1], S[2], S[3]);
    outline(g, S, C.ink, 4 * snap(t, T.sola + E16, E16) + .01);
    if (kk2 > 0 && u > .8) {
      g.save(); g.beginPath(); g.rect(S[0], S[1], S[2], S[3]); g.clip();
      font(g, 800, 380 * u); g.fillStyle = C.quote; g.letterSpacing = '0px';
      const pq = snap(t, 17.45 + E16, E16);
      reveal(g, '“', S[0] + 34 * u, S[1] + 330 * u, 380 * u, pq * kk2, 0);
      reveal(g, '”', S[0] + S[2] - 210 * u, S[1] + S[3] + 110 * u, 380 * u, snap(t, 17.45 + E8 + E16, E16) * kk2, 0);
      if (t > 17.7 && ((t - 17.7) % 1) < .5) { g.fillStyle = C.ink; g.fillRect(S[0] + S[2] / 2 - 5 * u, S[1] + S[3] / 2 - 56 * u, 10 * u, 112 * u * kk2); }
      g.restore();
    }
  }
  // notes beside the empty module
  if (t > 17.45 && t < tSplit + E8) {
    const qk = t > tSplit ? snap(t, tSplit + E8, E8) : 0;
    font(g, 700, 30); g.fillStyle = C.ink; reveal(g, 'parole sue', 728, 806, 30, snap(t, 17.45 + E8, E16), qk);
    font(g, 500, 30); g.fillStyle = C.lead; reveal(g, 'ancora', 728, 846, 30, snap(t, 17.45 + E8 + E32, E16), qk); reveal(g, 'nessuna', 728, 884, 30, snap(t, 17.45 + E8 + E16, E16), qk);
    g.fillStyle = C.ink; g.fillRect(728, 760, 176 * lin(t, 17.45, 17.7), 2);
  }
  // the poster: "sembra / pubblicità." knocked out white, a white stamp frame
  if (t > T.pubb) {
    const p = snap(t, T.pubb + E16, E16);
    g.strokeStyle = C.paper; g.lineWidth = 6;
    const fw = 800 * p; g.strokeRect(92, 868, fw, 178);
  }
  g.restore();
  if (t > T.cut7 && t < T.cut7 + E16 + E8) {   // the knife across the whole sheet
    g.fillStyle = C.page; g.fillRect(-120, mid - 2, (W + 240) * lin(t, T.cut7, T.cut7 + E16), 4);
  }
}

function drawWorldC(g, t) {        // shot 8: the first row of the call, two modules become two cells
  if (t < T.cut7 || t > T.split + .5) return;
  const cam = CAM_S8;
  for (let k = 0; k < 48; k++) {
    let r = rs(cam, modR(k));
    if (k > 1) {
      const kk = 1 - snap(t, T.split - .3 + RANK_K0[k] * .006 + E16, E16);
      if (kk <= 0) continue;
      r = collapseRect(r, kk);
    }
    const hi = k < 5 && t > T.primi + k * E16 && !(k > 1 && t > T.due);
    if (k < 2 && t > T.due) continue;   // drawn as cell labels
    outline(g, r, hi ? C.ink : C.line, hi ? 2 + 3 * snap(t, T.primi + k * E16 + E16, E16) : 2);
  }
}
function drawCells(g, t) {
  if (t < T.due || t > T.flow0 + .05) return;
  const lift = lin(t, T.li, T.flow0) * 420, c1r = CELL1(t); c1r[1] -= lift;
  const cells = [[c1r, '01', T.due], [CELL2(t), '02', T.due + E16]];
  cells.forEach(([r, lab, t1], i) => {
    let kk = 1;
    if (i === 1 && t > T.stai + .3) kk = 1 - snap(t, T.zitto, T.zitto - T.stai - .3);
    if (kk <= 0) return;
    const rr = collapseRect(r, kk);
    if (r[2] > 121) { g.fillStyle = C.paper; g.fillRect(rr[0], rr[1], rr[2], rr[3]); }
    // label square
    const lr = collapseRect([r[0], r[1], 120, 120], kk);
    const lk = i === 1 && t > T.stai ? 1 - snap(t, T.stai + E16 + E8, E8) : 1;
    if (lk > 0) {
      g.fillStyle = C.ink; wipeRect(g, collapseRect(lr, lk), snap(t, t1 + E16, E16), 'left');
      font(g, 800, 46); g.fillStyle = C.paper; reveal(g, lab, r[0] + 20, r[1] + 100 - (1 - lk) * 50, 46, snap(t, t1 + E8, E16), 0);
    }
  });
  // cell 1: the red story (linear, off grid)
  if (t > T.qual) {
    const r = CELL1(t), ox = r[0], oy = r[1] - lin(t, T.li, T.flow0) * 420;
    const enter = lin(t, T.qual, T.qual + .57);
    let R = [lerp(1120 - ox, 620, enter), 607, 190, 190];
    const g1 = lin(t, T.fatt, T.fatt + .6), g2 = lin(t, T.fatt + .73, T.fatt + 1.8);
    R = lerpR(R, [0, 607, 840, 190], g1);
    R = lerpR(R, [0, 607, 840, 333], g2);
    g.fillStyle = C.red; g.fillRect(ox + R[0], oy + R[1], R[2], R[3]);
    // readout next to the red while it is still a module
    if (t > T.qual + .57) {
      font(g, 500, 26); g.fillStyle = C.ink; g.fillText('fuori griglia', ox + 620, oy + 590);
    }
  }
  // cell 2: two sub-cells, today / in six months
  if (t > T.sei) {
    const r = CELL2(t), ox = r[0], oy = r[1], p = snap(t, T.sei + E16, E16);
    const subs = [[40, 610, 370, 290, 'oggi'], [430, 610, 370, 290, 'tra 6 mesi']];
    const L0 = [[24, 120, 250], [24, 170, 160], [24, 220, 300]], R0 = [[150, 120, 120], [24, 170, 300], [90, 220, 190]];
    subs.forEach(([x, y, w, h, lab], j) => {
      const rank = j, kk = t > T.stai ? 1 - snap(t, T.stai + (2 - rank) * E32 + E16 + E8, E8) : 1;
      if (kk <= 0) return;
      const S = collapseRect([ox + x, oy + y, w * p, h], kk);
      g.fillStyle = C.page; g.fillRect(S[0], S[1], S[2], S[3]);
      g.save(); g.translate(0, S[1] + S[3] / 2); g.scale(1, kk); g.translate(0, -(S[1] + S[3] / 2));
      font(g, 700, 34); g.fillStyle = C.ink; reveal(g, lab, ox + x + 24, oy + y + 56, 34, snap(t, T.sei + E8, E16), 0);
      for (let b = 0; b < 3; b++) {
        let bx = L0[b][0], bw = L0[b][2];
        if (j === 1) { const pc = snap(t, T.tutto + b * E16 + E16, E16); bx = lerp(R0[b][0], L0[b][0], pc); bw = lerp(R0[b][2], L0[b][2], pc); }
        g.fillStyle = C.ink; g.fillRect(ox + x + bx, oy + y + L0[b][1] + 30, bw * snap(t, T.sei + E8 + b * E32, E16), 26);
      }
      g.restore();
    });
  }
}

// shots 12 → end: the grid again (identity → pan → end module → overview → the list)
function drawWorldD(g, t) {
  if (t < T.li) return;
  const cam = gridCam(t);
  const listing = t > T.lista;
  // outlines
  for (let k = 0; k < 48; k++) {
    if (!cascade(t, T.li, k)) continue;
    let r = rs(cam, modR(k));
    if (listing) {   // rows merge into bars
      const row = Math.floor(k / 6), pm = snap(t, T.lista + .34 + row * E32, .34);
      if (pm > .98) continue;
    }
    if (r[0] > W || r[1] > H || r[0] + r[2] < 0 || r[1] + r[3] < 0 || (r[2] > 420 && k !== 47)) continue;
    g.lineWidth = 2; g.strokeStyle = C.line; g.strokeRect(r[0] + 1, r[1] + 1, r[2] - 2, r[3] - 2);
  }
  // the red front: the client fills the call, row by row, linear and unsnapped, crossing the gutters
  if (t > T.flow0 && t < T.push16 + .5) {
    const u = redFront(t);
    for (let row = 0; row < 5; row++) {
      const f = clamp(u - row * 6, 0, 6) / 6;
      if (f <= 0) continue;
      let y = rowY(row) + 5, x = X0, w = 840 * f;
      // "cambia tutto": the rows slide into one bar (linear)
      const m = lin(t, T.cambia, T.cambia + .67);
      y = lerp(y, rowY(4) + 5, m);
      // "gli ripeti": the bar travels down next to the price, pausing once
      const d = lin(t, T.gli, T.gli + .45) * .45 + lin(t, T.gli + .58, T.detto) * .55;
      const tgt = [424, 1420 + 5, 336];
      if (d > 0) { x = lerp(x, tgt[0], d); y = lerp(y, tgt[1], d); w = lerp(w, tgt[2], d); }
      const S = rs(cam, [x, y, w, 120]);
      g.fillStyle = C.red; g.fillRect(S[0], S[1], S[2] + (f < 1 ? 0 : 1), S[3]);
    }
    if (t > T.flow0 + .1 && t < T.cambia) {   // readout
      const S = w2s(cam, XR, rowY(5) - 4);
      font(g, 500, 26); g.fillStyle = C.ink; g.textAlign = 'right'; g.fillText('fuori griglia', S[0], S[1]); g.textAlign = 'left';
    }
  }
  // the price page (world = screen + 720): one row = price | his words | the decision; three rules below
  if (t > T.dopo - .3 && t < T.push16 + .5) {
    const P = (x, y, w, h) => rs(cam, [x, y + 720, w, h]);
    [[64, 336], [424, 336], [784, 120]].forEach(([x, w], i) => { const r = P(x, 700, w, 120), p = snap(t, T.dopo + (i + 1) * E16, E16); if (p > 0) outline(g, [r[0], r[1], Math.max(4, r[2] * p), r[3]], C.line, 2); });
    g.fillStyle = C.ink; wipeRect(g, P(64, 700, 336, 120), snap(t, T.prezzo + E16, E16), 'left');
    const pr = P(64, 700, 336, 120);
    font(g, 800, 60 * cam[2]); g.fillStyle = C.paper; reveal(g, 'prezzo', pr[0] + 28 * cam[2], pr[1] + 80 * cam[2], 60 * cam[2], snap(t, T.prezzo + E8, E16), 0);
    // three grey defences where his words should go, then the knife
    const tk_ = T.def[2] + .3;
    T.def.forEach((td, i) => {
      if (t < td) return;
      const kk = t > tk_ ? 1 - snap(t, tk_ + E16 + E8 + Math.abs(i - 1) * E32, E8) : 1;
      if (kk <= 0) return;
      let r = P(424, 700 + i * 44, 336, 32); const m = P(424, 760, 1, 1)[1];
      r = [r[0], lerp(m, r[1] + r[3] / 2, kk) - r[3] * kk / 2, r[2], r[3] * kk];
      g.fillStyle = C.grey; wipeRect(g, r, snap(t, td + E16, E16), 'right');
    });
    if (t > tk_ && t < tk_ + E16 + E8) { const r = P(410, 759, 364, 3); g.fillStyle = C.ink; g.fillRect(r[0], r[1], r[2] * lin(t, tk_, tk_ + E16), 3); }
    // the decision: an empty paper module with a caret
    if (t > T.decidere) {
      const r = P(784, 700, 120, 120), p = snap(t, T.decidere + E16, E16);
      g.fillStyle = C.paper; wipeRect(g, r, p, 'left'); outline(g, [r[0], r[1], Math.max(4, r[2] * p), r[3]], C.ink, 3);
      if (((t - T.decidere) % 1) < .5) { g.fillStyle = C.ink; g.fillRect(r[0] + r[2] / 2 - 4, r[1] + 26 * cam[2], 8 * cam[2], r[3] - 52 * cam[2]); }
    }
    // programme rules above the three lines
    [[924, ws('S15', 0)], [1072, T.gli], [1220, ws('S17', 0)]].forEach(([y, t1]) => {
      if (t < t1) return; const r = P(64, y, 840, 1); g.fillStyle = C.ink; g.fillRect(r[0], r[1], r[2] * lin(t, t1, t1 + .25), 2);
    });
  }
  // the end module: "ci devo pensare" lives here, then is cut
  if (t > T.push16 - .1 && t < T.si + .9) {
    const R = rs(cam, modR(47));
    if (t > T.cut18 + .3) { /* empty */ }
    outline(g, R, C.ink, 3);
  }
  // the first five minutes, red: the same rhythm as the black at the start
  for (let i = 0; i < 5; i++) {
    const t1 = T.iniz + i * E16;
    if (t < t1 || listing && t > T.lista + .34) continue;
    g.fillStyle = C.red; wipeRect(g, rs(cam, modR(i)), snap(t, t1 + E16, E16), 'left');
  }
  if (t > T.iniz && t < T.listDone) {   // notes beside the overview
    const a = w2s(cam, XR + 50, rowY(0) + 74), b = w2s(cam, XR + 50, rowY(7) + 74), k = 1 - snap(t, T.listDone - .1 + E8, E8);
    font(g, 700, 30); g.fillStyle = C.ink;
    reveal(g, 'inizio', a[0], a[1], 30, snap(t, T.iniz + E16, E16), 1 - k); reveal(g, 'fine', b[0], b[1], 30, snap(t, T.iniz + E8, E16), 1 - k);
  }
  if (listing) drawList(g, t, cam);
}
function redFront(t) {    // modules filled, 0 → 30, with one pause
  const a = T.flow0, b = a + 1.15, c = b + .25, d = T.cambia - .05;
  return 13 * lin(t, a, b) + 17 * lin(t, c, d);
}
function drawList(g, t, cam) {   // rows merge into bars, the bars become an endless list of questions
  const rnd = mul(20), v = 64, kc = t > T.endCut ? 1 - snap(t, T.endCut + E16 + E8, E8) : 1, mid = 1196;
  if (kc <= 0) return;
  if (t > T.endCut && t < T.endCut + E16 + E8) { g.fillStyle = C.ink; g.fillRect(48, mid - 1.5, 872 * lin(t, T.endCut, T.endCut + E16), 3); }
  const lens = Array.from({ length: 60 }, (_, i) => i === 0 ? .62 : .34 + rnd() * .6);
  const scroll = Math.max(0, t - (T.listDone + .5)) * v;
  for (let i = 0; i < 60; i++) {
    const row = Math.min(i, 7);
    const pl = snap(t, T.listDone + row * E32 + E8 * 2, E8 * 2);
    let Bm = [64, 1016 + i * 50 - scroll, 840 * lens[i], 20];
    if (kc < 1) Bm = [Bm[0], lerp(mid, Bm[1] + 10, kc) - 10 * kc, Bm[2], 20 * kc];
    let r;
    if (i < 8) {
      const pw = snap(t, T.lista + row * E32 + E8, E8);
      if (pw <= 0) continue;
      r = lerpR(rs(cam, [X0, rowY(row), 840 * pw, 120]), Bm, pl);
    } else { if (pl < 1) continue; r = Bm; }
    g.save();
    if (pl >= 1) { g.beginPath(); g.rect(0, 1000, W, 392); g.clip(); }
    if (kc < 1 && i < 8 && pl < 1) { g.restore(); continue; }
    g.fillStyle = i === 0 ? C.red : pl >= 1 ? C.grey : C.ink; g.fillRect(r[0], r[1], r[2], r[3]);
    g.restore();
  }
}

// ---------------- the CTA red block ----------------
function drawCTA(g, t) {
  if (t < T.commenta) return;
  g.fillStyle = C.red; wipeRect(g, [64, 640, 840, 260], snap(t, T.commenta + E8, E8), 'left');
  if (t > T.domandeCTA + .4) {     // caret after DOMANDE, to the last frame
    font(g, 800, 150); g.letterSpacing = `${(-150 * .02).toFixed(2)}px`;
    let w = g.measureText('DOMANDE').width; const fs = Math.min(1, 680 / (w + 1)); w *= fs;
    if (((t - T.domandeCTA - .4) % .8) < .45) { g.fillStyle = C.ink; g.fillRect(104 + w + 20, 760, 12, 124); }
  }
}


// ---------------- caption row (technical notes) ----------------
const CHAP = [[0, 'il problema'], [13.43, 'cosa vuol dire'], [25.70, 'le due domande'], [42.13, 'il silenzio'], [47.87, 'il prezzo'], [58.20, 'la regola'], [63.43, 'per te']];
const WHERE = [[0, 'fine'], [4.9, 'inizio'], [7.9, 'fine'], [13.43, null], [25.70, 'inizio'], [47.87, 'dopo'], [58.20, 'fine'], [61.63, 'inizio'], [63.43, null]];
const atT = (arr, t) => { let v = arr[0]; for (const a of arr) if (t >= a[0]) v = a; return v; };
function drawCaption(g, t) {
  g.fillStyle = C.ink; g.fillRect(64, 1402, 840 * lin(t, 0, .5), 2);
  const [tc, lab] = atT(CHAP, t);
  font(g, 700, 28); g.fillStyle = C.ink; reveal(g, lab, 64, 1440, 28, snap(t, tc + E16 + (tc === 0 ? .3 : 0), E16), 0);
  const where = atT(WHERE, t)[1];
  g.textAlign = 'left';
  const words = ['inizio', 'dopo', 'fine'];
  font(g, 500, 28); let x = XR; const ws_ = words.map(w => g.measureText(w).width), sep = g.measureText(' · ').width;
  x -= ws_.reduce((a, b) => a + b, 0) + sep * 2;
  words.forEach((w, i) => {
    font(g, w === where ? 700 : 500, 28); g.fillStyle = w === where ? C.ink : C.lead; g.fillText(w, x, 1440);
    x += ws_[i]; if (i < 2) { g.fillStyle = C.lead; font(g, 500, 28); g.fillText(' · ', x, 1440); x += sep; }
  });
}
// labels reported to readcheck (non-subtitle text)
function labels(t) {
  const out = [];
  const [tc, lab] = atT(CHAP, t);
  out.push({ id: 'chap', text: lab, x0: 64, y0: 1412, x1: 300, y1: 1448 });
  out.push({ id: 'where', text: 'inizio · dopo · fine', x0: 640, y0: 1412, x1: 904, y1: 1448 });
  if (t > T.due + E16 && t < T.zitto) {
    const c1 = CELL1(t), c2 = CELL2(t);
    if (c1[1] + 120 > 0) out.push({ id: 'l01', text: '01', x0: c1[0], y0: Math.max(0, c1[1]), x1: c1[0] + 120, y1: c1[1] + 120 });
    if (t < T.stai) out.push({ id: 'l02', text: '02', x0: c2[0], y0: c2[1], x1: c2[0] + 120, y1: Math.min(H, c2[1] + 120) });
  }
  if (t > T.sei + E8 && t < T.stai) { const c = CELL2(t); out.push({ id: 'oggi', text: 'oggi', x0: c[0] + 64, y0: c[1] + 630, x1: c[0] + 200, y1: c[1] + 680 }, { id: 'sei', text: 'tra 6 mesi', x0: c[0] + 454, y0: c[1] + 630, x1: c[0] + 660, y1: c[1] + 680 }); }
  if (t > T.prezzo + E8 && t < T.push16) out.push({ id: 'prezzo', text: 'prezzo', x0: 92, y0: 720, x1: 320, y1: 800 });
  if (t > 17.45 + E8 + E16 && t < T.quello) out.push({ id: 'paroleSue', text: 'parole sue ancora nessuna', x0: 728, y0: 770, x1: 904, y1: 900 });
  if (t > T.qual + .6) { const c = CELL1(t); const y = c[1] + 565; if (y > 0) out.push({ id: 'fg1', text: 'fuori griglia', x0: c[0] + 620, y0: y, x1: c[0] + 790, y1: y + 32 }); }
  if (t > T.flow0 + .1 && t < T.cambia) out.push({ id: 'fg2', text: 'fuori griglia', x0: 734, y0: 1000, x1: 904, y1: 1032 });
  if (t > T.iniz + E8 && t < T.listDone - .1) out.push({ id: 'ovI', text: 'inizio', x0: 520, y0: 850, x1: 640, y1: 890 }, { id: 'ovF', text: 'fine', x0: 520, y0: 1335, x1: 600, y1: 1375 });
  return out;
}

// ---------------- hooks for the engine ----------------
HOOK.build = build;
HOOK.world = (g, t) => {
  if (t < T.paper + .3) drawWorldA(g, t);
  drawWorldC(g, t);
  drawPaper(g, t);
  drawCells(g, t);
  drawWorldD(g, t);
  drawCTA(g, t);
};
HOOK.caption = drawCaption;
HOOK.labels = labels;
HOOK.drift = () => {   // boundaries: every subtitle start and the landing hits; one slow push in the silence before «zitto» that lands on the hit
  const b = [0, ...Object.values(CUES).map(c => c.t0), 1.433, 24.367, 26.433, 49.733, 62.3, T.endCut, DURATION()].filter(x => !(x > 40.9 && x < T.zitto + .1));
  makeDrift(b, T.zitto + E16);
};
export function TEXTS(t) { return labels(t); }

export function buildEvents() {
  const ev = [], add = (t, type, o = {}) => ev.push({ t: +t.toFixed(4), type, ...o });
  // sound cues: kind = which family of real recording, w = hero/support, vis = what qa.py checks against the picture
  let n = 0; const fx = (t, kind, o = {}) => add(t, 'sfx', { id: `${kind}${++n}`, kind, w: 'support', ...o });
  const mv = (fn, a, b, o = {}) => { const m = moveTimes(fn, a, b); fx(m.peak, o.kind || 'whoosh', { vis: 'move', ...o, kind: o.kind || 'whoosh' }); return m; };
  const camXY = t => gridCam(t);

  // 0 → 5: the hook
  const open = mv(camXY, .27, 1.7, { kind: 'whoosh', id: 'pullOpen' });
  fx(open.land, 'chimeThump', { w: 'hero', vis: 'land', id: 'hook' });
  fx(we('S01', 12) - .23 + E16, 'swish', { id: 'strike' });
  fx(CUES.c01.H + E8, 'swish', { id: 'out01' });
  // the first five minutes: typewriter keys, the numeral lands
  for (const i of [0, 2]) fx(T.black5 + i * E16 + E16, 'key');
  fx(T.five + .32, 'thumpTap', { w: 'hero', id: 'five' });
  // the end module: push in, the search, the knife, «tardi.»
  mv(camXY, CUES.c02.H, 8.7, { id: 'pushEnd' });
  { let last = -9; T.list.forEach(on => { if (on - last >= .2) { fx(on + E16, 'tick'); last = on; } }); }
  fx(T.tardi + E16, 'hitBoom', { w: 'hero', id: 'tardi' });
  // after the first silence: the client's words, then the paper
  fx(ws('S05', 0) + E16, 'chime', { w: 'hero', id: 'ci2', stop: true });
  fx(T.paper + .2, 'paper', { id: 'paper1' });
  fx(T.reflow + E8, 'paperSlide', { id: 'reflow' });
  mv(camXY, 17.0, 17.5, { id: 'pushOne' });
  // what you say: typewriter rows, the stamp
  mv(camXY, T.quello, T.quello + .4, { id: 'pullFlood' });
  for (const r of [0, 2, 4]) fx(T.quello + .34 + r * 6 * .018 + E32, 'key');
  fx(T.pubb, 'stamp', { w: 'hero', vis: 'land', id: 'pubb' });
  fx(T.cut7 + E16 * .7, 'swish', { id: 'knife7' });
  fx(T.cut7 + E16 + E8, 'paper', { id: 'sheet', vis: 'land' });
  // two questions
  for (const i of [0, 2, 4]) fx(T.primi + i * E16 + E16, 'tick');
  fx(T.due + E16, 'key', { id: 'dueKey' });
  fx(T.split + .12, 'paperSlide', { id: 'cells' });
  mv(t => CELL1(t), T.push9, T.push9 + .4, { kind: 'swishSoft', id: 'pushCell' });
  fx(T.adesso + .12, 'swish', { id: 'under' });
  const red = moveTimes(t => { const e = lin(t, T.qual, T.qual + .57); return [lerp(1120, 684, e)]; }, T.qual - .1, T.qual + .7);
  fx(T.qual + .57, 'chimeThump', { id: 'redlands' });
  mv(t => CELL1(t), T.pan11, T.pan11 + .4, { id: 'panCell' });
  fx(T.sei + E16, 'tick');
  for (const b of [0, 2]) fx(T.tutto + b * E16 + E16, 'tickMetal');
  // silence, then «zitto.»
  fx(T.stai + E16 * .7, 'swishSoft', { id: 'knife12' });
  fx(T.zitto + E16, 'hitBoom', { w: 'hero', id: 'zitto', stop: true });
  fx(T.li + .25, 'paperSlide', { id: 'gridback' });
  fx(T.flow0, 'shimmer', { id: 'redflow' });
  // after: the pan into the price page
  fx(T.cambia + .3, 'swishSoft', { id: 'merge' });
  const pan = moveTimes(camXY, T.arriva, T.dopo + .1);   // the riser carries the pan
  fx(pan.land, 'hitBoom', { w: 'hero', vis: 'land', id: 'dopo', build: true });
  fx(T.prezzo + E16, 'thump', { id: 'price' });
  [T.def[0], T.def[2]].forEach(td => fx(td + E16, 'tickMetal'));
  fx(T.def[2] + .3 + E16 * .7, 'swish', { id: 'knifeDef' });
  fx(T.detto, 'chime', { id: 'redprice' });
  fx(T.decidere + E16, 'tap', { id: 'decide' });
  // the end module again: cut «ci devo pensare», pull out to the start
  fx(ws('S18', 0) + E16, 'chime', { id: 'ci3' });
  mv(camXY, T.push16, T.push16 + .45, { id: 'pushEnd2' });
  fx(T.cut18 + E16 + E8, 'hit', { w: 'hero', id: 'cut18' });
  const pull = mv(camXY, T.si, T.iniz + .1, { id: 'pullStart' });
  fx(T.iniz, 'chimeThump', { w: 'hero', id: 'inizio' });
  for (const i of [2, 4]) fx(T.iniz + i * E16 + E16, 'tick');
  // the list, the comment, the end
  fx(T.lista + .34 + E8, 'paperSlide', { id: 'rows' });
  fx(T.listDone + E8 * 2, 'swishSoft', { id: 'list' });
  fx(T.commenta + E8, 'paper', { id: 'redblock' });
  fx(T.domandeCTA + E16, 'hitChime', { w: 'hero', id: 'domande' });
  fx(T.endCut + E16 * .7, 'swishSoft', { id: 'endcut' });
  // music data (rendered inside the score: notes of the modules, the red's sine voice)
  for (let i = 0; i < 5; i++) add(T.black5 + i * E16, 'note', { m: [62, 65, 69, 72, 74][i], g: .8 });
  for (let k = 18; k < 48; k++) add(T.quello + .34 + (k - 18) * .018, 'note', { m: [50, 53, 57, 60, 62, 65][k % 6] + 12 * (Math.floor(k / 6) % 2), g: .42 });
  add(T.due, 'note', { m: 62, g: .7 }); add(T.due + E16, 'note', { m: 69, g: .7 });
  add(T.red47, 'redNote', { m: 74, g: .7 });
  add(T.qual, 'redGlide', { d: .57, m0: 64, m1: 69, g: .8 });
  add(T.fatt, 'redGlide', { d: .6, m0: 69, m1: 74, g: .7 }); add(T.fatt + .73, 'redGlide', { d: 1.07, m0: 74, m1: 72, g: .6 });
  add(T.li, 'redFlow', { a: T.flow0, b: T.cambia - .05, g: .7 });
  add(T.gli, 'redGlide', { d: T.detto - T.gli, m0: 76, m1: 69, g: .6 });
  for (let i = 0; i < 5; i++) add(T.iniz + i * E16, 'redNote', { m: [62, 65, 69, 72, 74][i], g: .85 });
  for (const c of Object.values(CUES)) {
    const Bs = BLOCKS.filter(B => B.cue === c.id), outs = Bs.map(B => B.out).filter(x => x != null);
    add(c.t0, 'cue', { t1: outs.length ? Math.min(...outs) : DURATION(), te: c.te, text: c.text });
  }
  return ev.sort((a, b) => a.t - b.t);
}