// Props painted in code: coin, incense, the brush (= you), drops, rings, bridge, banners, brush capitals, plum branch, seal.
import { mk, draw, drawSeq, mass, blot, TONE } from './lib/ink.js';
import { ripple } from './lib/land.js';
import { clamp, lerp, mulberry, vnoise, eo, ss } from '/core/lib.js';
export const VERM = [176, 46, 34];

// ---------- stroke cache: strokes are rebuilt only when their geometry key changes ----------
const CACHE = new Map();
export function cached(key, build) { let v = CACHE.get(key); if (!v) { v = build(); CACHE.set(key, v); if (CACHE.size > 4000) CACHE.clear(); } return v; }

// ---------- Coin with a square hole: wash ring + two loaded half-circles + the square, in drawing order ----------
export function coin(L, x, y, r, p = 1, am = 1, seed = 11) {
  if (p <= 0) return;
  const S = cached(`coin${x},${y},${r},${seed}`, () => {
    const arc = (a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [x + Math.cos(a) * r, y + Math.sin(a) * r, .8 + .35 * Math.sin(Math.PI * i / n)]; });
    const h = r * .27;
    return [
      mk(arc(-Math.PI * .55, -Math.PI * 1.52 + Math.PI * 2 - Math.PI * 2), { w: r * .16, tone: TONE.jiao, darkDir: [-1, 0], side: .7, dry: .32, wet: .35, prof: 'even', seed }),
      mk(arc(-Math.PI * .5, Math.PI * .52), { w: r * .15, tone: TONE.jiao, darkDir: [1, 0], side: .7, dry: .36, wet: .35, prof: 'even', seed: seed + 1 }),
      mk([[x - h, y - h], [x + h, y - h * 1.04]], { w: r * .08, tone: TONE.nong, dry: .3, prof: 'even', seed: seed + 2 }),
      mk([[x + h, y - h], [x + h * 1.02, y + h]], { w: r * .08, tone: TONE.nong, dry: .3, prof: 'even', seed: seed + 3 }),
      mk([[x - h, y - h], [x - h * .98, y + h]], { w: r * .08, tone: TONE.nong, dry: .3, prof: 'even', seed: seed + 4 }),
      mk([[x - h, y + h], [x + h, y + h * 1.02]], { w: r * .08, tone: TONE.nong, dry: .3, prof: 'even', seed: seed + 5 }),
    ];
  });
  // pale wash body (the hole stays paper)
  const wa = clamp(p * 3) * am;
  if (wa > 0) {
    const c = L.wet, h = r * .27; c.save(); c.globalAlpha = .26 * wa; c.fillStyle = '#000';
    c.beginPath(); c.arc(x, y, r * .93, 0, 7); c.rect(x - h, y - h, h * 2, h * 2); c.fill('evenodd'); c.restore();
  }
  // four tiny marks around the hole (abstract, not lettering)
  drawSeq(L, S, p, am, .1);
  if (p > .85) { const k = clamp((p - .85) / .15) * am; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 - Math.PI / 2, d = r * .6; blot(L.dry, x + Math.cos(a) * d, y + Math.sin(a) * d, r * .055, .7 * k, a, .45, seed + i); } }
}

// ---------- Incense: tripod censer, stick, vermilion ember, ash, smoke ----------
// burn 0 = fresh stick, 1 = burnt to the base. lit 0..1. t drives the smoke. ash: length of the hanging ash curl (0..1); ashDrop: 0..1 progress of a falling piece
export function incense(L, x, y, o = {}) {
  const s = o.s ?? 1, H = (o.h ?? 900) * s, burn = o.burn ?? 0, t = o.t ?? 0, am = o.am ?? 1;
  // censer (ding): bowl mass + loaded contour + rim + three legs + two ears
  const C = cached(`censer${x},${y},${s}`, () => {
    const W = 170 * s, Hb = 120 * s;
    return {
      bowl: [[x - W, y - Hb * .1], [x - W * .96, y + Hb * .35], [x - W * .7, y + Hb * .82], [x, y + Hb], [x + W * .7, y + Hb * .82], [x + W * .96, y + Hb * .35], [x + W, y - Hb * .1]],
      st: [
        mk([[x - W * 1.04, y - Hb * .1, .8], [x - W * .96, y + Hb * .38], [x - W * .66, y + Hb * .84], [x - W * .1, y + Hb * 1.0, .7]], { w: 26 * s, tone: .8, darkDir: [-1, .3], side: .85, brWet: true, body: .25, dry: .4, wet: .9, prof: 'robe', seed: 301 }),
        mk([[x + W * 1.04, y - Hb * .1, .8], [x + W * .96, y + Hb * .38], [x + W * .66, y + Hb * .84], [x + W * .1, y + Hb * 1.0, .7]], { w: 24 * s, tone: .72, darkDir: [1, .3], side: .85, brWet: true, body: .25, dry: .45, wet: .9, prof: 'robe', seed: 302 }),
        mk([[x - W * 1.1, y - Hb * .12], [x, y - Hb * .2], [x + W * 1.1, y - Hb * .12]], { w: 7 * s, tone: TONE.jiao, dry: .35, wet: .2, prof: 'even', seed: 303 }),
        mk([[x - W * 1.06, y + Hb * .02], [x, y - Hb * .02], [x + W * 1.06, y + Hb * .02]], { w: 3 * s, tone: TONE.zhong, dry: .6, prof: 'tip', seed: 304 }),
        mk([[x - W * .62, y + Hb * .78], [x - W * .72, y + Hb * 1.22], [x - W * .8, y + Hb * 1.5]], { w: 14 * s, tone: TONE.nong, dry: .35, wet: .3, prof: 'nail', seed: 305 }),
        mk([[x + W * .62, y + Hb * .78], [x + W * .72, y + Hb * 1.22], [x + W * .8, y + Hb * 1.5]], { w: 14 * s, tone: TONE.nong, dry: .35, wet: .3, prof: 'nail', seed: 306 }),
        mk([[x, y + Hb * .96], [x + 2 * s, y + Hb * 1.32], [x, y + Hb * 1.56]], { w: 13 * s, tone: TONE.zhong, dry: .4, wet: .3, prof: 'nail', seed: 307 }),
        mk([[x - W * .8, y - Hb * .14], [x - W * .86, y - Hb * .5], [x - W * .66, y - Hb * .56], [x - W * .62, y - Hb * .16]], { w: 6 * s, tone: TONE.nong, dry: .4, prof: 'even', seed: 308 }),
        mk([[x + W * .8, y - Hb * .14], [x + W * .86, y - Hb * .5], [x + W * .66, y - Hb * .56], [x + W * .62, y - Hb * .16]], { w: 6 * s, tone: TONE.nong, dry: .4, prof: 'even', seed: 309 }),
        mk([[x - W * .5, y + Hb * .4], [x - W * .1, y + Hb * .46], [x + W * .3, y + Hb * .38]], { w: 3 * s, tone: TONE.zhong, dry: .7, prof: 'tip', seed: 310 }),
      ],
    };
  });
  mass(L.wet, C.bowl, .2 * am, 3 * s, 7, [x, y - 20 * s, x, y + 130 * s, .5, 1.3]);
  for (const st of C.st) draw(L, st, 1, am);
  // ash bed
  for (let i = 0; i < 7; i++) blot(L.dry, x - 70 * s + i * 23 * s, y - 24 * s + Math.sin(i * 2.1) * 3 * s, 7 * s, .35 * am, i, .4, 40 + i);
  // stick
  const base = [x + 4 * s, y - 22 * s], top = [x + 4 * s + 10 * s * (1 - burn), y - 22 * s - H * (1 - burn)];
  const stick = mk([base, [lerp(base[0], top[0], .5) - 3 * s, lerp(base[1], top[1], .5)], top], { w: 9 * s, tone: TONE.zhong, dry: .28, wet: .15, prof: 'even', rough: .05, seed: 320 });
  draw(L, stick, 1, am);
  draw(L, mk([[base[0], base[1]], [base[0], base[1] - 60 * s]], { w: 12 * s, tone: TONE.nong, dry: .3, prof: 'even', seed: 321 }), 1, am);   // red-wood handle end (ink)
  const lit = o.lit ?? 1;
  // hanging ash curl on the tip
  const ash = o.ash ?? .3;
  if (ash > 0 && lit > 0) {
    const L2 = 70 * s * ash, ax = top[0], ay = top[1];
    const pts = [[ax, ay], [ax + L2 * .25, ay - L2 * .5], [ax + L2 * .6, ay - L2 * .78], [ax + L2, ay - L2 * .7]];
    draw(L, mk(pts, { w: 10 * s, tone: TONE.qing * 1.4, dry: .55, wet: .2, prof: 'even', seed: 330 }), 1, am * lit);
  }
  // falling ash piece
  if (o.ashDrop > 0 && o.ashDrop < 1) {
    const u = o.ashDrop, L2 = 70 * s, ax = top[0] + L2 * .5 + 40 * s * u, ay = top[1] - L2 * .4 + 900 * s * u * u;
    const a = u * 3.2;
    const pts = [[-L2 * .5, 0], [-L2 * .15, -L2 * .3], [L2 * .25, -L2 * .35], [L2 * .5, -L2 * .2]].map(([px, py]) => [ax + px * Math.cos(a) - py * Math.sin(a), ay + px * Math.sin(a) + py * Math.cos(a)]);
    draw(L, mk(pts, { w: 10 * s, tone: TONE.qing * 1.5, dry: .55, wet: .2, prof: 'even', seed: 331 }), 1, am * (1 - u * .4));
  }
  // ember (vermilion, the only small red before the seal) + glow
  if (lit > 0) {
    const c = L.col; c.save(); c.globalAlpha = am * lit;
    const g = c.createRadialGradient(top[0], top[1], 0, top[0], top[1], 22 * s);
    g.addColorStop(0, `rgba(${VERM.join(',')},.95)`); g.addColorStop(.35, `rgba(${VERM.join(',')},.55)`); g.addColorStop(1, `rgba(${VERM.join(',')},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(top[0], top[1], 22 * s, 0, 7); c.fill();
    c.fillStyle = `rgba(${VERM.join(',')},1)`; c.beginPath(); c.ellipse(top[0], top[1], 5.5 * s, 8 * s, 0, 0, 7); c.fill(); c.restore();
  }
  // smoke: two wavering strands of clear ink rising from the ember
  const sm = (o.smoke ?? 1) * lit;
  if (sm > 0) smoke(L, top[0], top[1] - 6 * s, (o.smokeH ?? 700) * s * sm, t, s, am * Math.min(1, sm * 1.5), o.smokeW ?? 1);
  return { top, base };
}
export function smoke(L, x, y, h, t, s = 1, am = 1, wk = 1) {
  for (let k = 0; k < 2; k++) {
    const pts = [], n = 22;
    for (let i = 0; i <= n; i++) {
      const u = i / n, yy = y - h * u;
      const sway = (vnoise(u * 3.2 - t * .55 + k * .35) - .5) * 190 * Math.sqrt(s) * Math.pow(u, .85) + Math.sin(u * 7 - t * 1.7 + k * .6) * 30 * Math.sqrt(s) * Math.pow(u, .7);   // both strands drift together (no loop)
      pts.push([x + sway + k * 10 * s * u, yy, .5 + u * 1.2]);
    }
    draw(L, mk(pts, { w: (5 + 10 * k) * s * wk, tone: k ? .1 : .2, dry: .15, wet: .95, prof: 'rise', rough: .3, seed: 340 + k }), 1, am * (k ? .8 : 1));
  }
}

// ---------- The brush (= you): bamboo handle, ferrule, hair. tip = contact point, ang = direction from tip to handle ----------
// o: {len (handle length), hair (hair length), wet 0..1, splay 0..1, am}
export function brush(L, tx, ty, ang, o = {}) {
  const am = o.am ?? 1; if (am <= 0) return;
  const s = o.s ?? 1, hair = (o.hair ?? 150) * s, len = (o.len ?? 1500) * s, wet = o.wet ?? 1, splay = o.splay ?? 0;
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const P = (a, b) => [tx + dx * a + nx * b, ty + dy * a + ny * b];
  const bw = 34 * s;  // hair base width
  // hair: a loaded teardrop (wet dark), or splayed bristles when dry
  const hairPoly = [];
  for (let i = 0; i <= 14; i++) { const u = i / 14, wv = bw * .5 * Math.pow(Math.sin(Math.PI * Math.min(1, u * .9 + .02)), .7) * (u > .85 ? lerp(1, .78, (u - .85) / .15) : 1); hairPoly.push(P(u * hair, wv * (1 + splay * .5 * u * 0))); }
  for (let i = 14; i >= 0; i--) { const u = i / 14, wv = bw * .5 * Math.pow(Math.sin(Math.PI * Math.min(1, u * .9 + .02)), .7) * (u > .85 ? lerp(1, .78, (u - .85) / .15) : 1); hairPoly.push(P(u * hair, -wv)); }
  if (splay < .5) mass(L.dry, hairPoly, (.55 + .4 * wet) * am * (1 - splay * 1.6), 0, 3);
  // bristle lines (always, more visible when splayed)
  const R = mulberry(77);
  for (let j = 0; j < 16; j++) {
    const off = (j / 15 - .5) * bw * .8, fan = (j / 15 - .5) * splay * 70 * s;
    const pts = [P(hair * .92, off * .75), P(hair * .45, off * 1.05 + fan * .25), P(hair * .02 + R() * 8 * s * splay, off * .2 + fan)];
    draw(L, mk(pts, { w: 2.6 * s, tone: TONE.jiao, dry: .2 + splay * .3, prof: 'tip', seed: 400 + j }), 1, am * (.35 + splay * .55));
  }
  // ferrule band
  mass(L.dry, [P(hair * .95, bw * .55), P(hair * 1.2, bw * .52), P(hair * 1.2, -bw * .52), P(hair * .95, -bw * .55)], .78 * am, 0, 4);
  // bamboo handle: pale wash + loaded edges + nodes
  const hw = 15 * s;
  mass(L.wet, [P(hair * 1.18, hw), P(len, hw * 1.1), P(len, -hw * 1.1), P(hair * 1.18, -hw)], .2 * am, 0, 5);
  draw(L, mk([P(hair * 1.2, hw * .8), P(len * .5, hw * .9), P(len, hw)], { w: 9 * s, tone: .7, darkDir: [nx, ny], side: .9, brWet: true, body: .25, dry: .45, wet: .85, prof: 'even', seed: 410 }), 1, am);
  draw(L, mk([P(hair * 1.2, -hw * .8), P(len * .5, -hw * .9), P(len, -hw)], { w: 5 * s, tone: .45, dry: .6, prof: 'even', seed: 411 }), 1, am);
  for (let k = 0; k < 4; k++) {
    const a = hair * 1.2 + (k + .6) * 330 * s;
    if (a > len) break;
    draw(L, mk([P(a - 4 * s, hw * 1.25), P(a, 0), P(a - 4 * s, -hw * 1.25)], { w: 5 * s, tone: TONE.nong, dry: .4, prof: 'tip', seed: 420 + k }), 1, am);
    draw(L, mk([P(a + 26 * s, hw * .5), P(a + 70 * s, hw * .6)], { w: 2 * s, tone: TONE.zhong, dry: .7, prof: 'tip', seed: 430 + k }), 1, am);
  }
  // a hanging drop at the tip when very wet
  if (o.drop > 0) blot(L.wet, tx, ty + 10 * s * o.drop, 6 * s * o.drop, .9 * am, 0, 1.2, 9);
}

// ---------- falling drop ----------
export function drop(L, x, y, s = 1, am = 1) {
  const c = L.wet; c.save(); c.globalAlpha = .95 * am; c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, y, 7 * s, 11 * s, 0, 0, 7); c.fill(); c.restore();
  draw(L, mk([[x, y - 70 * s], [x, y - 10 * s]], { w: 3 * s, tone: .3, dry: .6, prof: 'tip', seed: 5 }), 1, .5 * am);
}
// water ring at age u (seconds)
export function rings(L, x, y, age, o = {}) {
  if (age < 0) return;
  const n = o.n ?? 3, sq = o.sq ?? .32, R0 = o.r ?? 260, life = o.life ?? 3.2, s = o.s ?? 1;
  for (let k = 0; k < n; k++) {
    const a = age - k * .32; if (a <= 0) continue;
    const r = R0 * Math.pow(a / life, .6) * (1 - k * .14) + 6;
    const al = clamp(1 - a / (life * (o.fadeK ?? 1))) * (k ? .65 : 1) * (o.am ?? 1);
    ripple(L, x, y, r, al, (o.seed ?? 1) + k * 3, sq, (o.w ?? 5) * s * (1 - k * .2));
  }
}

// ---------- Arched stone bridge (moon bridge). Local frame: keystone top at (0,0); water at y = 274 ----------
export const BR = { ra: 206, crown: 32, half: 395, water: 238, rise: 148 };
export const deckY = x => { const u = x / BR.half; return BR.rise * u * u; };
export function bridgeStrokes(cx, cy, seed = 50) {
  const X = (x, y, p = 1) => [cx + x, cy + y, p];
  const arch = side => { const pts = []; for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + side * (i / 12) * Math.PI / 2; pts.push(X(Math.cos(a) * BR.ra * side * side, BR.crown + BR.ra + Math.sin(a) * BR.ra, 1.1 - .3 * i / 12)); } return pts; };
  const archL = arch(-1).map(([x, y, p]) => [cx - Math.abs(x - cx), y, p]);
  const archR = arch(1).map(([x, y, p]) => [cx + Math.abs(x - cx), y, p]);
  const deck = side => Array.from({ length: 11 }, (_, i) => { const x = side * (i / 10) * BR.half; return X(x, deckY(x), 1.05 - .25 * i / 10); });
  const para = side => Array.from({ length: 11 }, (_, i) => { const x = side * (i / 10) * (BR.half - 30); return X(x, deckY(x) - 30, .9); });
  const S = { L: [], R: [] };
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    S[key].push(mk(deck(side), { w: 24, tone: .86, darkDir: [0, -1], side: .85, brWet: true, body: .3, dry: .35, wet: .9, prof: 'even', seed: seed + side * 2 }));
    S[key].push(mk(side < 0 ? archL : archR, { w: 30, tone: .82, darkDir: [0, 1], side: .85, brWet: true, body: .3, dry: .38, wet: .9, prof: 'even', seed: seed + 10 + side }));
    S[key].push(mk(para(side), { w: 5, tone: TONE.nong, dry: .45, prof: 'even', seed: seed + 20 + side }));
    for (let k = 1; k <= 5; k++) { const x = side * k * 75; S[key].push(mk([X(x, deckY(x) - 30), X(x, deckY(x) - 4)], { w: 5, tone: TONE.nong, dry: .35, prof: 'nail', seed: seed + 30 + k * side })); }
    // voussoirs (radial stones along the arch)
    for (let k = 1; k <= 6; k++) { const a = -Math.PI / 2 + side * k * .23, r0 = BR.ra + 4, r1 = BR.ra + 40; const ox = 0, oy = BR.crown + BR.ra; S[key].push(mk([X(ox + Math.cos(a) * r0, oy + Math.sin(a) * r0), X(ox + Math.cos(a) * r1, oy + Math.sin(a) * r1)], { w: 4, tone: TONE.zhong, dry: .55, prof: 'tip', seed: seed + 40 + k * side })); }
    // abutment + bank edge
    S[key].push(mk([X(side * BR.half, deckY(BR.half) + 4), X(side * (BR.half - 20), BR.water - 30), X(side * (BR.ra + 10), BR.water)], { w: 18, tone: .7, darkDir: [side, 0], side: .8, brWet: true, body: .2, dry: .5, wet: .9, prof: 'rise', seed: seed + 60 + side }));
  }
  return S;
}
export function bridgeWash(c, cx, cy, am = 1) {   // pale spandrel wash between deck and arch
  const pts = [];
  for (let i = 0; i <= 20; i++) { const x = -BR.half + i / 20 * BR.half * 2; pts.push([cx + x, cy + deckY(x) + 6]); }
  pts.push([cx + BR.half - 10, cy + BR.water - 10]);
  for (let i = 0; i <= 20; i++) { const a = 0 - i / 20 * Math.PI; pts.push([cx + Math.cos(a) * BR.ra * 1.0, cy + BR.crown + BR.ra + Math.sin(a) * BR.ra]); }
  pts.push([cx - BR.half + 10, cy + BR.water - 10]);
  mass(c, pts, .1 * am, 3, 13, [cx, cy, cx, cy + BR.water, .5, 1.4]);
}
export function bridgeTexture(L, cx, cy, am = 1) {   // dry texture strokes on the stone (cun), darker near the abutments
  const R = mulberry(88);
  for (let i = 0; i < 22; i++) {
    const side = i % 2 ? 1 : -1, x = side * (BR.ra + 30 + R() * (BR.half - BR.ra - 40)), y = deckY(x) + 30 + R() * (BR.water - deckY(x) - 60);
    const l = 22 + R() * 30;
    draw(L, mk([[cx + x, cy + y], [cx + x - side * l * .3, cy + y + l * .5], [cx + x - side * l * .4, cy + y + l]], { w: 7 + R() * 6, tone: .55, dry: .65, wet: .35, prof: 'nail', seed: 700 + i }), 1, am * .8);
  }
  for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * .3, r = BR.ra + 20; draw(L, mk([[cx + Math.cos(a) * r, cy + BR.crown + BR.ra + Math.sin(a) * r], [cx + Math.cos(a + .1) * (r + 8), cy + BR.crown + BR.ra + Math.sin(a + .1) * (r + 8)]], { w: 5, tone: .5, dry: .7, prof: 'tip', seed: 760 + i }), 1, am * .7); }
}
export function bridgeReflection(L, cx, cy, am = 1, t = 0) {   // the arch mirrored in the water: completes the moon circle
  const wy = cy + BR.water;
  { const c = L.wet, pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI; pts.push([cx + Math.cos(a) * BR.ra * .98, wy + Math.sin(a) * BR.ra * .94]); }
    mass(c, pts, .1 * am, 2.5, 21, [cx, wy, cx, wy + BR.ra, 1.2, .25]); }
  for (let k = 0; k < 7; k++) {
    const a0 = Math.PI * (k / 7), a1 = Math.PI * ((k + .72) / 7);
    const pts = []; for (let i = 0; i <= 5; i++) { const a = lerp(a0, a1, i / 5); pts.push([cx + Math.cos(a) * BR.ra + Math.sin(t * 1.3 + k) * 3, wy + Math.sin(a) * BR.ra * .96]); }
    draw(L, mk(pts, { w: 14, tone: .26, dry: .55, wet: .7, prof: 'lens', seed: 470 + k }), 1, am);
  }
  for (let k = 0; k < 5; k++) { const y = wy + 30 + k * 34, w2 = 260 - k * 30; draw(L, mk([[cx - w2 + Math.sin(t + k) * 8, y], [cx + w2 * .9, y + 2]], { w: 3, tone: .3, dry: .7, prof: 'tip', seed: 480 + k }), 1, am * .8); }
}

// ---------- Advertising banner (shop flag): pale cloth + loaded edges + a big abstract mark ----------
export function banner(L, x, y, w, h, seed, am = 1, p = 1) {
  if (am <= 0 || p <= 0) return;
  const R = mulberry(seed), hh = h * eo(clamp(p));
  draw(L, mk([[x - w * .15, y], [x + w * 1.15, y - 4]], { w: 9, tone: TONE.jiao, dry: .3, prof: 'even', seed: seed * 3 }), 1, am);
  mass(L.wet, [[x, y], [x + w, y], [x + w * 1.02, y + hh], [x + w * .5, y + hh * .94], [x - w * .02, y + hh]], .52 * am, 4, seed, [x, y, x, y + hh, 1.15, .8]);
  draw(L, mk([[x, y], [x - 2, y + hh * .5], [x - w * .02, y + hh]], { w: 16, tone: .85, darkDir: [-1, 0], side: .85, brWet: true, body: .3, dry: .4, wet: .9, prof: 'even', seed: seed * 3 + 1 }), 1, am);
  draw(L, mk([[x + w, y], [x + w + 3, y + hh * .5], [x + w * 1.02, y + hh]], { w: 14, tone: .8, darkDir: [1, 0], side: .85, brWet: true, body: .3, dry: .45, wet: .9, prof: 'even', seed: seed * 3 + 2 }), 1, am);
  if (p > .4) {   // the shouting mark: two or three heavy strokes + a dot (abstract)
    const k = clamp((p - .4) / .6), cx = x + w / 2, cy = y + hh * .45, sz = Math.min(w, hh) * .36;
    const v = (seed % 3);
    draw(L, mk([[cx - sz * .75, cy - sz * .55 + v * 6], [cx, cy - sz * .62], [cx + sz * .75, cy - sz * .5]], { w: sz * .22, tone: TONE.jiao, dry: .3, wet: .3, prof: 'brush', seed: seed * 5 }), clamp(k * 2), am);
    draw(L, mk([[cx + sz * .05, cy - sz * .95], [cx, cy], [cx + sz * .02, cy + sz * .8], [cx - sz * .3, cy + sz * .6]], { w: sz * .24, tone: TONE.jiao, dry: .32, wet: .3, prof: 'nail', seed: seed * 5 + 1 }), clamp(k * 2 - .5), am);
    draw(L, mk([[cx - sz * .7, cy + sz * .05], [cx - sz * .35, cy + sz * .45]], { w: sz * .2, tone: TONE.jiao, dry: .3, prof: 'nail', seed: seed * 5 + 2 }), clamp(k * 2 - .8), am);
    draw(L, mk([[cx + sz * .65, cy - sz * .05], [cx + sz * .4, cy + sz * .5]], { w: sz * .2, tone: TONE.jiao, dry: .3, prof: 'nail', seed: seed * 5 + 3 }), clamp(k * 2 - .9), am);
    blot(L.dry, cx + (R() - .5) * sz * .3, cy + sz * 1.25, sz * .14, .95 * am * k, R() * 3, .8, seed);
  }
}

// ---------- Brush capitals (skeletons, cap height 100, baseline 100). Each letter: [width, strokes[[x,y,p]...]] ----------
const LET = {
  C: [74, [[[80, 18, .6], [60, 3, .9], [32, 7, 1], [11, 30, 1.05], [7, 56, 1.05], [17, 82, 1], [42, 98, .95], [66, 94, .8], [82, 80, .5]]]],
  I: [36, [[[18, -1, .7], [20, 30, .95], [20, 70, 1], [19, 101, .85]]]],
  D: [86, [[[15, 0, .7], [16, 50, 1], [15, 100, .9]], [[14, 2, .6], [46, 1, .9], [74, 18, 1], [84, 50, 1.05], [75, 82, 1], [46, 99, .9], [13, 98, .6]]]],
  E: [72, [[[15, 0, .7], [16, 50, 1], [15, 100, .9]], [[14, 2, .7], [44, 1, .95], [70, 1, .7]], [[16, 50, .7], [38, 49, .9], [58, 48, .6]], [[14, 98, .8], [44, 98, 1], [74, 96, .7]]]],
  V: [84, [[[3, -1, .8], [22, 48, 1], [41, 100, 1.1]], [[43, 98, .9], [61, 48, .85], [80, -1, .6]]]],
  O: [96, [[[52, 2, .7], [22, 9, .95], [6, 46, 1.05], [17, 85, 1], [50, 99, 1], [80, 86, .95], [92, 50, .9], [80, 14, .8], [54, 2, .55]]]],
  P: [74, [[[15, 0, .7], [16, 50, 1], [15, 100, .9]], [[14, 3, .6], [48, 1, .95], [70, 14, 1], [70, 38, 1], [50, 53, .9], [17, 53, .55]]]],
  N: [86, [[[14, 100, .9], [14, 50, 1], [15, 0, .8]], [[15, 1, .9], [44, 50, 1], [74, 99, 1.05]], [[74, 99, .7], [75, 50, .95], [76, 0, .7]]]],
  S: [76, [[[72, 14, .6], [55, 2, .85], [28, 4, .95], [12, 22, 1], [22, 43, 1], [50, 54, 1], [72, 71, 1], [67, 91, .95], [40, 100, .9], [10, 91, .55]]]],
  A: [86, [[[5, 100, .8], [24, 50, 1], [42, -1, 1]], [[44, -1, 1], [63, 50, 1], [82, 100, .9]], [[22, 63, .75], [44, 62, .95], [66, 62, .7]]]],
  R: [80, [[[15, 0, .7], [16, 50, 1], [15, 100, .9]], [[14, 3, .6], [48, 1, .95], [70, 14, 1], [69, 37, 1], [48, 51, .9], [17, 51, .55]], [[40, 52, .8], [60, 76, 1], [80, 100, 1.05]]]],
  M: [104, [[[10, 100, .85], [11, 50, 1], [13, 0, .9]], [[13, 1, .9], [33, 42, 1], [52, 82, 1]], [[52, 82, .8], [72, 42, .95], [91, 0, .9]], [[91, 0, .8], [92, 50, 1], [93, 100, .95]]]],
  ' ': [40, []],
};
// lay out one line of capitals: returns {strokes, width}
export function brushWord(text, x, y, cap, o = {}) {
  const k = cap / 100, track = o.track ?? 14;
  let width = 0; for (const ch of text) width += (LET[ch]?.[0] ?? 60) + track; width -= track;
  const x0 = o.center ? x - width * k / 2 : x;
  const strokes = []; let cx = 0, li = 0;
  for (const ch of text) {
    const L = LET[ch]; if (!L) continue;
    for (const st of L[1]) {
      const n = st.length;
      const pts = st.map(([px, py, p], i) => {
        const u = i / (n - 1), taper = u < .12 ? .55 + u / .12 * .45 : u > .85 ? lerp(1, .5, (u - .85) / .15) : 1;
        const a = st[Math.max(0, i - 1)], b = st[Math.min(n - 1, i + 1)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const nib = .5 + .62 * Math.abs(Math.sin(ang - .5));   // verticals and down-strokes heavy, horizontals light
        return [x0 + (cx + px) * k, y + py * k, (.55 + (p - .55) * 1.7) * taper * nib];
      });
      strokes.push({ li, s: mk(pts, { w: (o.w ?? 21) * k, tone: TONE.jiao, dry: o.dry ?? .34, wet: o.wet ?? .3, prof: 'even', rough: .16, nb: 48, solid: true, seed: (o.seed ?? 900) + strokes.length * 7 }) });
    }
    cx += L[0] + track; li++;
  }
  return { strokes, width: width * k, x0 };
}
// write by progress p (0..1, letter after letter), or un-write (am fades in reverse order when rev=true)
export function writeWord(L, W, p, am = 1, o = {}) {
  const N = W.strokes.length; if (!N) return;
  for (let i = 0; i < N; i++) {
    const a = i / N * .85, b = a + 1.6 / N;
    let q = clamp((p - a) / (b - a)), aa = am;
    if (o.evap != null) { const e = clamp((o.evap - (1 - (i + 1) / N) * .8) / .25); aa *= 1 - e; }
    if (q > 0 && aa > 0) draw(L, W.strokes[i].s, q, aa);
  }
}

// ---------- Plum branch with blossoms (spring) ----------
export function plum(L, x, y, s, p = 1, am = 1, seed = 61) {
  const k = clamp(p);
  const main = [[x, y], [x - 120 * s, y + 40 * s], [x - 200 * s, y + 10 * s], [x - 300 * s, y + 60 * s], [x - 380 * s, y + 30 * s]];
  draw(L, cached(`plum${x},${y},${s}`, () => mk(main, { w: 22 * s, tone: .8, darkDir: [0, 1], side: .85, brWet: true, body: .3, dry: .5, wet: .85, prof: 'press', seed })), clamp(k * 1.6), am);
  const tw = [[[x - 120 * s, y + 40 * s], [x - 150 * s, y - 40 * s], [x - 140 * s, y - 100 * s]], [[x - 200 * s, y + 10 * s], [x - 230 * s, y + 90 * s], [x - 270 * s, y + 130 * s]], [[x - 300 * s, y + 60 * s], [x - 330 * s, y - 10 * s]]];
  tw.forEach((b, i) => draw(L, mk(b, { w: 8 * s, tone: TONE.jiao, dry: .4, prof: 'tip', seed: seed + 10 + i }), clamp(k * 2 - .5 - i * .1), am));
  const R = mulberry(seed);
  const fl = [[-140, -100], [-150, -50], [-90, 30], [-230, 90], [-270, 130], [-330, -10], [-380, 30], [-180, 0], [-260, 50], [-60, 20]];
  fl.forEach(([fx, fy], i) => {
    const q = clamp((k - .4 - i * .045) * 5); if (q <= 0) return;
    const cx = x + fx * s, cy = y + fy * s, r = 13 * s * q;
    for (let j = 0; j < 5; j++) { const a = j * 1.2566 + R() * .3, px = cx + Math.cos(a) * r * .8, py = cy + Math.sin(a) * r * .8; draw(L, mk([[px - r * .4, py], [px, py - r * .45], [px + r * .4, py], [px, py + r * .4], [px - r * .38, py + .1]], { w: 1.8 * s, tone: TONE.nong, dry: .35, prof: 'even', seed: seed + 100 + i * 5 + j }), 1, am * .9); }
    for (let j = 0; j < 4; j++) blot(L.dry, cx + (R() - .5) * r * .7, cy + (R() - .5) * r * .7, 1.6 * s, .9 * am, 0, 1, i * 9 + j);
  });
}

// ---------- Vermilion seal (白文): carved "one" over "mouth" = the first word ----------
export function seal(c, x, y, size, am = 1, seed = 3) {
  if (am <= 0) return;
  c.save(); c.translate(x - size / 2, y - size / 2);
  const S = size, jit = S * .02;
  c.beginPath();
  for (let i = 0; i < 32; i++) {
    const t = i / 32 * 4, side = Math.floor(t), u = t - side;
    let px, py; if (side === 0) { px = u * S; py = 0; } else if (side === 1) { px = S; py = u * S; } else if (side === 2) { px = S - u * S; py = S; } else { px = 0; py = S - u * S; }
    px += (vnoise(seed + i * 1.3) - .5) * jit * 2; py += (vnoise(seed + 40 + i * 1.3) - .5) * jit * 2;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath(); c.fillStyle = `rgba(${VERM.join(',')},${clamp(am)})`; c.fill();
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.strokeStyle = '#000'; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = S * .085;
  const Pt = pts => { c.beginPath(); pts.forEach(([a, b], i) => { const X = a * S + (vnoise(seed + i * 2.1 + a * 9) - .5) * jit, Y = b * S + (vnoise(seed + 7 + i * 2.1 + b * 9) - .5) * jit; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); };
  Pt([[.16, .26], [.5, .23], [.84, .26]]);                                        // 一
  Pt([[.26, .46], [.27, .84]]); Pt([[.26, .46], [.74, .45], [.73, .84]]); Pt([[.27, .82], [.73, .82]]);   // 口
  Pt([[.5, .56], [.5, .7]]);
  for (let i = 0; i < 80; i++) { const a = vnoise(seed + i * 3.7), b = vnoise(seed + 91 + i * 2.9); c.globalAlpha = .5 + .5 * vnoise(i * 1.1); c.beginPath(); c.arc(a * S, b * S, S * (.004 + .012 * vnoise(i * 5.3)), 0, 7); c.fill(); }
  c.restore();
}

// ---------- Old plum tree on the left bank (bare; winter snow and spring blossoms are added on top) ----------
export function treeStrokes(x, y, seed = 140, sc = 1) {
  const Q = ([px, py, pp]) => [x + (px - x) * sc, y + (py - y) * sc, pp ?? 1];
  const T = [[x, y, 1.1], [x + 46, y - 150, 1], [x + 20, y - 300, .95], [x + 96, y - 430, .85], [x + 170, y - 520, .7]];
  const B = [
    [[x + 30, y - 250], [x + 140, y - 300], [x + 250, y - 290], [x + 340, y - 340]],
    [[x + 96, y - 430], [x + 200, y - 440], [x + 300, y - 500], [x + 380, y - 490]],
    [[x + 150, y - 500], [x + 150, y - 600], [x + 210, y - 680]],
    [[x + 40, y - 170], [x - 10, y - 260], [x - 20, y - 330]],
  ];
  const tw = [];
  B.forEach(b => { const e = b[b.length - 1], m = b[1]; tw.push([[m[0], m[1]], [m[0] + 30, m[1] - 60], [m[0] + 20, m[1] - 110]]); tw.push([[e[0], e[1]], [e[0] + 50, e[1] + 30], [e[0] + 90, e[1] + 20]]); tw.push([[e[0], e[1]], [e[0] + 20, e[1] - 50]]); });
  const Tq = T.map(Q), Bq = B.map(b => b.map(Q)); tw.splice(0, tw.length, ...tw.map(b => b.map(Q)));
  T.splice(0, T.length, ...Tq); B.splice(0, B.length, ...Bq);
  const S = [mk(T, { w: 36 * sc, tone: .8, darkDir: [1, 0], side: .85, brWet: true, body: .3, dry: .5, wet: .85, prof: 'press', seed })];
  B.forEach((b, i) => S.push(mk(b, { w: (15 - i * 1.5) * sc, tone: .8, darkDir: [0, 1], side: .8, brWet: true, body: .3, dry: .5, wet: .7, prof: 'tip', seed: seed + 1 + i })));
  tw.forEach((b, i) => S.push(mk(b, { w: 5, tone: TONE.jiao, dry: .45, prof: 'tip', seed: seed + 20 + i })));
  const tips = []; B.forEach(b => b.forEach(p => tips.push(p))); tw.forEach(b => tips.push(b[b.length - 1], b[1] || b[0]));
  const R = mulberry(seed); for (let i = 0; i < 8; i++) { const k = 2 + Math.floor(R() * (T.length - 2)); }
  return { S, tips, B, tw };
}
export function blossom(L, cx, cy, r, am = 1, seed = 1) {
  if (am <= 0 || r <= .5) return;
  const R = mulberry(seed);
  for (let j = 0; j < 5; j++) { const a = j * 1.2566 + R() * .3, px = cx + Math.cos(a) * r * .8, py = cy + Math.sin(a) * r * .8; draw(L, mk([[px - r * .42, py], [px, py - r * .46], [px + r * .42, py], [px, py + r * .42], [px - r * .4, py + .1]], { w: 1.8, tone: TONE.nong, dry: .35, prof: 'even', seed: seed * 7 + j }), 1, am * .9); }
  for (let j = 0; j < 4; j++) blot(L.dry, cx + (R() - .5) * r * .7, cy + (R() - .5) * r * .7, 1.7, .9 * am, 0, 1, seed + j);
}

// ---------- Title written on the painting (Cormorant SC), letters soak in wet → dry one after another; evap = reverse ----------
export function title(Ls, text, cx, y, size, p, o = {}) {
  const N = text.length, ls = size * (o.track ?? .1), font = `600 ${size}px CormorantSC`;
  const cd = Ls.cd, cw = Ls.cw;
  cd.save(); cd.font = font; cd.letterSpacing = `${ls}px`;
  const W = cd.measureText(text).width - ls; const xs = [];
  for (let i = 0; i < N; i++) xs.push(cd.measureText(text.slice(0, i)).width);
  cd.restore();
  const x0 = cx - W / 2, am = o.am ?? 1;
  for (let i = 0; i < N; i++) {
    if (text[i] === ' ') continue;
    const q = clamp((p * (N + 3) - i) / 3); if (q <= 0) continue;
    const f = o.evap ? clamp((o.evap * (N + 3) - (N - 1 - i)) / 3) : 0;
    const a = eo(q) * (1 - f) * am; if (a <= 0 && f <= 0) continue;
    for (const [ctx, k, blur] of [[cw, (1 - q) * .85 + f * (1 - f) * 1.6, 3 + f * 10], [cd, q * (1 - f), 0]]) {
      if (k <= .002) continue;
      ctx.save(); ctx.font = font; ctx.letterSpacing = '0px'; ctx.fillStyle = '#000'; ctx.globalAlpha = clamp(k * (f > 0 ? 1 : a) * .97);
      if (blur) ctx.filter = `blur(${blur}px)`;
      ctx.fillText(text[i], x0 + xs[i], y - f * 18);
      ctx.restore();
    }
  }
  return { x0, x1: x0 + W, y0: y - size * .72, y1: y + size * .06, W };
}
