// swiss-motion ENGINE (reusable, do not edit per reel): palette, grid, voice-timing lookup, type, word-blocks, 2D camera, primitives, drift, frame loop.
// The content of a reel (scenes, key times, bespoke drawings, sound events) lives in scene.js.
// A grid of 6 columns × 8 rows of square modules, read like text. Black = main voice; red = the ONE signal colour (the exception, linear and unsnapped).
import { clamp, lerp, seg, E, snap, lin, steps, track, E8, E16, E32, BEAT } from './ease.js';

export * from './ease.js';
export const W = 1080, H = 1920;
let DUR = 70.067;
export const DURATION = () => DUR;
export const C = {
  page: '#ECEAE4', paper: '#FFFFFF', ink: '#111111', red: '#FF4A1A',
  line: '#D2CDC4', pline: '#DDD9D2', grey: '#C3BEB4', lead: '#716D65', quote: '#D6D1C8',
};
export const FAM = '"Inter Tight"';
export const X0 = 64, CW = 120, PIT = 144, GY = 256, XR = 904;
// SAFE ZONE: the 840-px grid block (x 64..904) is centred on x=540 by shifting the whole frame +56 px (symmetric margins 120/120).
// Free only: top band (y<250), bottom band (y>1470), bottom-right corner (x>900,y>950). Set 0 to get the original off-centre layout.
export const SAFE_SHIFT = 56;
export const colX = c => X0 + c * PIT;
export const rowY = r => GY + r * PIT;
export const modR = k => [colX(k % 6), rowY(Math.floor(k / 6)), CW, CW];

// ---------------- voice timing ----------------
// scene.js registers its hooks here: build() (blocks, key times), world(g,t), caption(g,t), labels(t)
export const HOOK = {};
export const T = {}, CUES = {}, BLOCKS = [];   // key times, subtitle cues, word blocks
let WD = [], SC = {};
// vo-timing.json: words[{w,start,end,scene}] — scene ids are whatever the file has (no fixed S01..S20); `sc` below is that id OR the 1-based scene number.
export function setTiming(vt) {
  WD = []; SC = {}; ids = [];
  WD = vt.words.map(w => ({ w: w.w, s: w.start, e: w.end, sc: w.scene }));
  ids = (vt.scenes || []).map(s => s.id);
  WD.forEach((w, i) => { const s = SC[w.sc] ??= { i0: i, i1: i }; s.i1 = i; });
  DUR = vt.totalSeconds;
  HOOK.build();
}
let ids = [];
const key = sc => typeof sc === 'number' ? ids[sc - 1] : sc;
export const wd = (sc, i) => WD[SC[key(sc)].i0 + i];
export const ws = (sc, i) => wd(sc, i).s;
export const we = (sc, i) => wd(sc, i).e;
export const clean = s => s.replace(/["“”]/g, '');
export const tk = (sc, i, o = {}) => ({ txt: clean(wd(sc, i).w), t: ws(sc, i), ...o });
export const tks = (sc, a, b, o = {}) => { const r = []; for (let i = a; i <= b; i++) r.push(tk(sc, i, o)); return r; };

// ---------------- type ----------------
export function font(g, wt, size) {
  g.font = `${wt} ${size}px ${FAM}`;
  g.letterSpacing = size >= 90 ? `${(-size * 0.02).toFixed(2)}px` : '0px';
}
export function reveal(g, s, x, y, size, p, q, down, base = .3) {
  if (p <= 0) return;
  const w = g.measureText(s).width;
  g.save(); g.beginPath(); g.rect(x - size * .12, y - size * 1.0, w + size * .3, size * (1 + base)); g.clip();
  g.fillText(s, x, y + (1 - p) * size * 1.05 + (down ? 1 : -1) * q * size * 1.3);
  g.restore();
}

// A block: lines of word tokens, revealed word by word on the voice; leaves upward ('up'), downward ('down') or by a knife cut ('knife').
export function blk(o) {
  const B = { lh: 1.08, wt: 800, col: C.ink, mode: 'up', ...o };
  B.t0 = Math.min(...B.lines.flat().map(x => x.t));
  if (B.cue && B.out === undefined) B.out = CUES[B.cue].H;
  BLOCKS.push(B); return B;
}
function fitSize(g, B, size) {
  if (!B.maxW) return size;
  let s = size;
  for (let k = 0; k < 6; k++) {
    let wmax = 0;
    for (const L of B.lines) { let w = 0; for (const x of L) { font(g, x.wt ?? B.wt, s * (x.scale ?? 1)); w += g.measureText(x.txt + ' ').width; } wmax = Math.max(wmax, w); }
    if (wmax <= B.maxW) break; s *= B.maxW / wmax * .995;
  }
  return s;
}
function blockGeom(g, B, t) {
  let [x, y, size] = B.pos ? B.pos(t) : [B.x, B.y, B.size];
  if (B.rel) { const [ox, oy] = B.rel(t); x += ox; y += oy; }
  size = fitSize(g, B, size);
  return [x, y, size, B.lh * size];
}
export function drawBlock(g, B, t) {
  if (t < B.t0 - .02) return;
  let q = 0, k = 1, kl = 0;
  if (B.out != null && t >= B.out) {
    if (B.mode === 'knife') { kl = lin(t, B.out, B.out + E16); k = 1 - snap(t, B.out + E16 + E8, E8); if (k <= 0) return; }
    else if (B.mode !== 'none') { q = snap(t, B.out + E8, E8); if (q >= 1) return; }
  }
  if (B.hideAfter != null && t >= B.hideAfter) return;
  const [x, y, size, lh] = blockGeom(g, B, t), n = B.lines.length;
  const ymid = y - size * .36 + (n - 1) * lh / 2;
  g.save();
  if (B.clip) { const r = B.clip(t); g.beginPath(); g.rect(r[0], r[1], r[2], r[3]); g.clip(); }
  if (k < 1) { g.translate(0, ymid); g.scale(1, Math.max(.001, k)); g.translate(0, -ymid); }
  let wmax = 0;
  for (let li = 0; li < n; li++) {
    let cx = x; const ly = y + li * lh;
    B.lines[li].forEach((x_, j) => {
      const sz = size * (x_.scale ?? 1);
      font(g, x_.wt ?? B.wt, sz);
      if (j === 0 && sz >= 140) cx = x - (-g.measureText(x_.txt).actualBoundingBoxLeft);   // optical flush left
      g.fillStyle = x_.col ?? B.col;
      const p = B.steps ? steps(t, x_.t, x_.t + (B.stepsDur ?? .32), B.steps) : snap(t, x_.t + E16, E16);
      reveal(g, x_.txt, cx, ly, sz, p, q, B.mode === 'down', B.base ?? .3);
      const ww = g.measureText(x_.txt).width;
      if (x_.under && t > x_.under) {   // ruling-pen underline, linear
        g.fillStyle = C.ink; g.fillRect(cx, ly + sz * .16, ww * lin(t, x_.under, x_.under + .5), Math.max(6, sz * .07));
      }
      cx += g.measureText(x_.txt + ' ').width;
      wmax = Math.max(wmax, cx - x);
    });
  }
  if (B.strike && t > B.strike) {      // the price struck through
    font(g, B.wt, size); const ww = g.measureText(B.lines[0][0].txt.replace('.', '')).width;
    g.fillStyle = C.ink; g.fillRect(x - 8, y - size * .29, (ww + 16) * lin(t, B.strike, B.strike + E16), size * .075);
  }
  g.restore();
  if (kl > 0 && k > 0) { g.fillStyle = B.knifeCol ?? C.ink; g.fillRect(x - 16, ymid - 1.5, (wmax + 32) * kl, 3); }
}
export function blockBox(g, B, t) {
  const [x, y, size, lh] = blockGeom(g, B, t);
  let wmax = 0;
  for (const L of B.lines) { let w = 0; for (const x_ of L) { font(g, x_.wt ?? B.wt, size * (x_.scale ?? 1)); w += g.measureText(x_.txt + ' ').width; } wmax = Math.max(wmax, w); }
  return [x, y - size * .95, x + wmax, y + (B.lines.length - 1) * lh + size * .3];
}
export const ID = [540, 960, 1];
export const camFor = (wx, wy, sx, sy, s) => [wx + (540 - sx) / s, wy + (960 - sy) / s, s];
export const w2s = (cam, x, y) => [(x - cam[0]) * cam[2] + 540, (y - cam[1]) * cam[2] + 960];
export const rs = (cam, r) => { const [x, y] = w2s(cam, r[0], r[1]); return [x, y, r[2] * cam[2], r[3] * cam[2]]; };

export function outline(g, r, col, lw = 2) { g.strokeStyle = col; g.lineWidth = lw; g.strokeRect(r[0] + lw / 2, r[1] + lw / 2, r[2] - lw, r[3] - lw); }
export function wipeRect(g, r, p, dir = 'left') {   // a flat block wiped in
  if (p <= 0) return;
  const [x, y, w, h] = r;
  if (dir === 'left') g.fillRect(x, y, w * p, h);
  else if (dir === 'up') g.fillRect(x, y + h * (1 - p), w, h * p);
  else if (dir === 'right') g.fillRect(x + w * (1 - p), y, w * p, h);
  else g.fillRect(x, y, w, h * p);
}
export function collapseRect(r, k) { const m = r[1] + r[3] / 2; return [r[0], m - r[3] * k / 2, r[2], r[3] * k]; }
export const lerpR = (a, b, p) => a.map((v, i) => lerp(v, b[i], p));
export const mul = s => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// ---------------- drift: a slow 3-5% push between one hit and the next (never still > 1.3 s) ----------------
let DRIFT = null;
export const DAX = 484, DAY = 845;   // centre of the grid block in world space (it lands on x=540 after SAFE_SHIFT)
// b = boundaries (cue starts + landing hits), force = a time that must land on scale 1
export function makeDrift(b, force) {
  b = [...b, force].sort((a, c) => a - c);
  const m = [b[0]]; for (const x of b) if (x - m[m.length - 1] >= 1.0) m.push(x);
  m[m.length - 1] = DUR;
  const iz = m.findIndex(x => Math.abs(x - force) < .01);
  if (iz > 0 && iz % 2 === 1) m.splice(iz, 0, (m[iz - 1] + m[iz]) / 2);
  const keys = [[0, [1, 0]]];
  for (let k = 1; k < m.length; k++) {
    const len = m[k] - m[k - 1], amp = Math.min(.05, Math.max(.03, .013 * len));
    keys.push([m[k], k % 2 ? [1 - amp, k % 4 === 1 ? 11 : -11] : [1, 0], len]);
  }
  DRIFT = track(keys);
}
export function renderFilm(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  g.setTransform(1, 0, 0, 1, SAFE_SHIFT, 0);
  g.fillStyle = '#E2DED6'; for (let c = 0; c < 6; c++) { g.fillRect(colX(c), 0, 1, H); g.fillRect(colX(c) + CW - 1, 0, 1, H); }
  g.fillStyle = C.ink; g.fillRect(64, 204, 840 * lin(t, 0, .25), 8);   // head rule
  if (!DRIFT) HOOK.drift();
  const [ds, dx] = DRIFT(t);
  g.setTransform(ds, 0, 0, ds, DAX * (1 - ds) + dx + SAFE_SHIFT, DAY * (1 - ds));
  HOOK.world(g, t);
  for (const B of BLOCKS) drawBlock(g, B, t);
  g.setTransform(1, 0, 0, 1, SAFE_SHIFT, 0);
  HOOK.caption(g, t);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
// Camera / panel moves: the frame of peak speed and the frame where the motion has stopped, measured on the curves themselves (sound sync).
export function moveTimes(fn, a, b) {
  const fps = 30, sp = [];
  for (let f = Math.floor(a * fps); f <= Math.ceil(b * fps) + 1; f++) {
    const v0 = [].concat(fn((f - 1) / fps)), v1 = [].concat(fn(f / fps));
    const cam = v0.length === 3;
    sp.push([f / fps, cam ? (Math.abs(v1[0] - v0[0]) + Math.abs(v1[1] - v0[1])) * v0[2] + Math.abs(Math.log(v1[2] / v0[2])) * 800 : v0.reduce((s, x, i) => s + Math.abs(v1[i] - x), 0)]);
  }
  let best = sp[0]; for (const x of sp) if (x[1] > best[1]) best = x;
  let land = sp[sp.length - 1][0]; for (const x of sp) if (x[0] > best[0] && x[1] < .05 * best[1]) { land = x[0]; break; }
  return { peak: best[0], land };
}
