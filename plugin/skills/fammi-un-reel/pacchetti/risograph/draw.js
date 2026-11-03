// Strumenti di disegno a lastre separate (adattati dal motore Risograph della libreria Lemo-Opuscar, MIT).
// Un colore = densità sulle tre lastre [teal, rosa, girasole] (0..1). Disegno normale = knockout; dentro over() = sovrastampa.
export const W = 1080, H = 1920;
export const plate = document.createElement('canvas');
plate.width = W; plate.height = H;
const G0 = plate.getContext('2d', { alpha: false });
export let g = G0;
const layerC = document.createElement('canvas'); layerC.width = W; layerC.height = H;
const LG = layerC.getContext('2d');
// Livello personaggio: disegna su un livello trasparente, timbra un alone carta (knockout) di halo px, poi incolla il livello
export function layer(fn, halo = 5) {
  LG.setTransform(1, 0, 0, 1, 0, 0); LG.globalCompositeOperation = 'source-over'; LG.clearRect(0, 0, W, H);
  const prev = g; LG.setTransform(prev.getTransform()); g = LG; try { fn(); } finally { g = prev; }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if (halo > 0) {
    g.filter = 'brightness(0)';
    const n = 12; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.drawImage(layerC, Math.cos(a) * halo, Math.sin(a) * halo); }
    g.filter = 'none';
  }
  g.drawImage(layerC, 0, 0);
  g.restore();
}
const c255 = v => Math.round(Math.max(0, Math.min(1, v)) * 255);
export const ink = (a = 0, b = 0, c = 0) => `rgb(${c255(a)},${c255(b)},${c255(c)})`;
export const inkA = a => ink(a[0], a[1], a[2]);
export const PAPERINK = [0, 0, 0];
const col = c => Array.isArray(c) ? inkA(c) : c;

export function clear(c = [0, 0, 0]) { g.globalCompositeOperation = 'source-over'; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = inkA(c); g.fillRect(0, 0, W, H); }
export function over(fn) { const o = g.globalCompositeOperation; g.globalCompositeOperation = 'lighter'; try { fn(); } finally { g.globalCompositeOperation = o; } }
export function fill(c) { g.fillStyle = col(c); g.fill(); }
export function circle(x, y, r, c) { g.beginPath(); g.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2); fill(c); }
export function ellipse(x, y, rx, ry, rot, c) { g.beginPath(); g.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, Math.PI * 2); fill(c); }
export function rect(x, y, w, h, c) { g.fillStyle = col(c); g.fillRect(x, y, w, h); }
export function rrect(x, y, w, h, r, c) { g.beginPath(); g.roundRect(x, y, w, h, r); fill(c); }
export function poly(pts, c) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); fill(c); }
export function blob(pts, c) {
  const n = pts.length; g.beginPath();
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let s = m(pts[n - 1], pts[0]); g.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], q = m(p, pts[(i + 1) % n]); g.quadraticCurveTo(p[0], p[1], q[0], q[1]); }
  g.closePath(); fill(c);
}
export function line(pts, w, c, cap = 'round') {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.lineWidth = w; g.lineCap = cap; g.lineJoin = 'round'; g.strokeStyle = col(c); g.stroke();
}
export function curve(pts, w, c) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) { const q = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; g.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); }
  const L = pts[pts.length - 1]; g.lineTo(L[0], L[1]);
  g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col(c); g.stroke();
}
export function ring(x, y, r, w, c) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.lineWidth = w; g.strokeStyle = col(c); g.stroke(); }
export function ik(a, t, l1, l2, bend = 1) {
  const dx = t[0] - a[0], dy = t[1] - a[1]; let d = Math.hypot(dx, dy);
  const dmax = l1 + l2 - 0.01; if (d > dmax) d = dmax;
  const base = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA))) * bend;
  const j = [a[0] + Math.cos(base + A) * l1, a[1] + Math.sin(base + A) * l1];
  const e = [a[0] + Math.cos(base) * d, a[1] + Math.sin(base) * d];
  return [j, e];
}
export function text(s, x, y, font, c, align = 'left', base = 'alphabetic', track = 0) {
  g.font = font; g.fillStyle = col(c); g.textAlign = align; g.textBaseline = base;
  g.letterSpacing = track ? track + 'px' : '0px';
  g.fillText(s, x, y);
  g.letterSpacing = '0px';
}
export function measure(s, font, track = 0) { g.font = font; g.letterSpacing = track ? track + 'px' : '0px'; const w = g.measureText(s).width; g.letterSpacing = '0px'; return w; }
export function clipTo(fnPath, fn) { g.save(); g.beginPath(); fnPath(); g.clip(); try { fn(); } finally { g.restore(); } }
