// MOTORE.JS — il motore dello stile Risograph: lastre, camera, deriva, parallasse, respiro, sottotitoli, render.
// Non contiene il copione: quello è in scene.js (registrato con registerScene).
import { g, W, H, clear, rect, rrect, line, circle, ellipse, poly, text, over, layer, measure, inkA, ring } from './draw.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash } from '/core/lib.js';
import { person, chair, table, PAL, bust } from './chars.js';
import { sky, ground, sunPos, sunClock, bubble, bubblePath, priceTag, tagString, shield, cloud, smallSun, qmark, arrow, wordLines, sheet, envelope, badge, meadow, clouds, birds, cup, floaters, foreground, fgBig } from './props.js';

export let DUR = 70;
let SC = null;
export function registerScene(s) { SC = s; DUR = s.DUR; }
export let SHOTS = []; export const setShots = a => { SHOTS = a; };
let KICKS = []; export const setKicks = a => { KICKS = a; };
export const EV = [];
export const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
export const WD = {}, WE = {}; let SUBS = [];
export function setTiming(vt, subs) {
  for (const k of Object.keys(WD)) delete WD[k]; for (const k of Object.keys(WE)) delete WE[k];
  for (const w of vt.words) { (WD[w.scene] = WD[w.scene] || []).push(w.start); (WE[w.scene] = WE[w.scene] || []).push(w.end); }
  SUBS = subs;
  SC.build();
}
export const w = (s, i) => WD[s][i];
export function shotAt(t) { for (const s of SHOTS) if (t >= s[1] && t < s[2]) return s; return SHOTS[SHOTS.length - 1]; }
export const setDW = v => { DW = v; }; export const setDR = v => { DR = v; };
export function regist(t) {
  const si = SHOTS.indexOf(shotAt(t));
  const base = [[0, 0], [3, -2], [-3, 2.5]];
  const off = base.map((b, i) => [b[0] + (hash(si * 3 + i) - .5) * (i ? 3 : 1.4), b[1] + (hash(si * 7 + i + 50) - .5) * (i ? 3 : 1.4)]);
  for (const [tk, amp] of KICKS) {
    const x = t - tk; if (x < 0 || x > .5) continue;
    const e = Math.exp(-x * 11) * Math.cos(x * 34);
    for (let i = 0; i < 3; i++) { const a = hash(tk * 13 + i * 5) * 6.283; off[i][0] += Math.cos(a) * amp * e * (i ? 1 : .5); off[i][1] += Math.sin(a) * amp * e * (i ? 1 : .5); }
  }
  // il silenzio prima di "zitto": le lastre si separano piano, poi scatto a registro
  const sl = SC.silence && SC.silence(), z = sl ? sl[1] : 0;
  if (sl && t >= sl[0] && t < z + .6) {
    const d = t < z ? ss(seg(t, sl[0], z - .05)) : Math.exp(-(t - z) * 16) * Math.cos((t - z) * 40);
    const dv = [[-8, 6], [26, -14], [-24, 16]];
    for (let i = 0; i < 3; i++) { off[i][0] += dv[i][0] * d; off[i][1] += dv[i][1] * d; }
  }
  return off;
}

export const step = t => Math.floor(t * 12) / 12;                 // personaggi a passo due
export let CAM = { z: 1, fx: 540, fy: 960, sx: 540, sy: 960 };
export let DR = { x: 0, y: 0 };            // deriva della grafica della ripresa (px schermo)
export let DW = { x: 0, y: 0 };            // deriva del mondo (camera)
export let TNOW = 0;
export function cam(c) { CAM = c; g.setTransform(c.z, 0, 0, c.z, c.sx - c.fx * c.z, c.sy - c.fy * c.z); }
export const ws = (p) => [(p[0] - CAM.fx) * CAM.z + CAM.sx, (p[1] - CAM.fy) * CAM.z + CAM.sy];
export const wsO = (p) => { const q = ws(p); return [q[0] - DR.x, q[1] - DR.y]; };   // punto mondo nelle coordinate della grafica
export const idT = () => g.setTransform(1, 0, 0, 1, 0, 0);                       // schermo vero (cielo, sottotitoli)
export const id = () => g.setTransform(1, 0, 0, 1, DR.x, DR.y);                  // grafica della ripresa (segue la deriva)
// deriva: camera c + velocità (px/s sullo schermo) dall'inizio a della ripresa; vz = spinta lenta (frazione al secondo)
export function drift(c, t, a, vx, vy = 0, vz = 0, ovk = 1) {
  const sh = shotAt(t), tc = (sh[1] + Math.min(sh[2], DUR)) / 2, d = t - (a === 'c' ? tc : a); DW = { x: vx * d, y: vy * d }; DR = { x: DW.x * ovk, y: DW.y * ovk };
  return { ...c, z: c.z * (1 + vz * d), sx: c.sx + DW.x, sy: c.sy + DW.y };
}
// respiro e piccoli movimenti della testa, a passo due
export const breathOf = (t, ph) => 2.6 * Math.sin(2 * Math.PI * .32 * step(t) + ph);
export const swayOf = (t, ph) => .025 * Math.sin(2 * Math.PI * .21 * step(t) + ph);
export const camMix = (a, b, k) => ({ z: lerp(a.z, b.z, k), fx: lerp(a.fx, b.fx, k), fy: lerp(a.fy, b.fy, k), sx: lerp(a.sx, b.sx, k), sy: lerp(a.sy, b.sy, k) });
// bocca che parla, a passo due
export function talk(t, ranges) {
  for (const [a, b] of ranges) if (t >= a && t < b) { const f = Math.floor(t * 12); return [.25, .9, .5, 1, .1, .7][Math.floor(hash(f * 1.7) * 6)]; }
  return 0;
}
export const blinkAt = (t, seed) => { const f = Math.floor(t * 12); const ph = (f + Math.floor(seed * 37)) % 41; return ph < 2; };

// mondo del tavolino (coordinate mondo; a z = 1 è la mezza figura a due)
export const SXp = 250, CXp = 760, HYp = 1110, TXp = 505, HZ = 1000;
export const MOUTH = { s: [SXp + 70, HYp - 184], c: [CXp - 70, HYp - 184] };
export const HEAD = { s: [SXp + 30, HYp - 212], c: [CXp - 30, HYp - 212] };
export const CAM2 = { z: 1.15, fx: 505, fy: 1040, sx: 490, sy: 1040 };   // mezza figura a due standard
export const WIDE = { z: .55, fx: 505, fy: 1060, sx: 492, sy: 1150 };     // totale: piedi sopra la striscia dei sottotitoli
export const CU_C = { z: 4.3, fx: 730, fy: 898, sx: 740, sy: 900 };       // PP del cliente (testa a 740,900)
export const CU_S = { z: 4.3, fx: 280, fy: 898, sx: 340, sy: 900 };       // PP di te
export function mouthOf(k, lean = 0) { const m = MOUTH[k]; return [m[0] + (k === 's' ? 1 : -1) * lean * 60, m[1]]; }

// cielo + nuvole + uccelli + sole + prato dalla camera corrente (piani lontani con parallasse)
export function backdrop(o) {
  idT();
  const hy = ws([0, HZ])[1];
  const px = (CAM.sx - CAM.fx * CAM.z) - (492 - 505 * CAM.z);             // spostamento laterale della camera
  sky(o.phase, hy, o.night || 0);
  if (o.clouds !== false) clouds(TNOW, hy, -px, o.night || 0, o.phase);
  if (o.sun !== false) {
    const sp = o.sunXY ? [o.sunXY[0] + DW.x * .15, o.sunXY[1] + DW.y * .15] : sunPos(o.phase, { cx: (o.arcCx ?? 492) + px * .15, hy, rx: o.arcRx ?? 470, ry: o.arcRy ?? 760 });
    sunClock(sp[0], sp[1], o.sunR ?? 120, { ...(o.clock || {}), ...(o.clock && o.clock.clock && o.secs !== false ? { hand2: (o.clock.hand2 ?? -.6) + TNOW * .9 } : {}) });
  }
  if (o.birds && !(o.night > .5)) birds(TNOW, hy, -px);
  ground(hy, o.night || 0, Math.sqrt(CAM.z), -px);
}
// i due personaggi al tavolino. so, co = pose (coordinate locali delle mani). Respirano e muovono appena la testa.
export function scene2(t, so = {}, co = {}, onTable, night = 0) {
  cam(CAM);
  const tt = step(t);
  meadow(night);
  chair(SXp - 6, HYp + 4, 1, 1); chair(CXp + 6, HYp + 4, 1, -1);
  const S = { kind: 's', s: 1, dir: 1, blink: blinkAt(tt, .2), breath: breathOf(t, 0), ...so }, C = { kind: 'c', s: 1, dir: -1, blink: blinkAt(tt, .7), breath: breathOf(t, 2), ...co };
  for (const [P_, ph] of [[S, 0], [C, 1.3]]) if (P_.talk > 0 && P_.hand) P_.hand = [P_.hand[0] + 16 * Math.sin(tt * 7 + ph), P_.hand[1] - 22 * Math.abs(Math.sin(tt * 4.5 + ph))];
  S.headTilt = (S.headTilt || 0) + swayOf(t, 0); C.headTilt = (C.headTilt || 0) + swayOf(t, 1.7);
  layer(() => person(SXp, HYp, { ...S, part: 'body' }), 5);
  layer(() => person(CXp, HYp, { ...C, part: 'body' }), 5);
  if (S.behind) S.behind();
  layer(() => table(TXp, HYp, 1), 4);
  if (CAM.z < 3) layer(() => cup(TXp + 100, HYp - 78, .9, t), 3);
  if (onTable) onTable();
  if (S.arms !== 'over') {
    layer(() => person(SXp, HYp, { ...S, part: 'arm' }), 4);
    layer(() => person(CXp, HYp, { ...C, part: 'arm' }), 4);
  } else {
    layer(() => { person(SXp, HYp, { ...S, part: 'arm' }); over(() => person(CXp, HYp, { ...C, part: 'arm' })); }, 4);
  }
  foreground(DW.x / CAM.z, night);
  idT(); floaters(t, night);
  if (CAM.z < 3) fgBig(DW.x, t, night);
}
// pose comuni (mano davanti / mano dietro in coordinate locali, rivolto a destra)
export const POSE = {
  table: { hand: [148, -84], handB: [120, -86] },
  chin: { hand: [66, -168], handB: [118, -86] },
  cross: { hand: [56, -104], handB: [64, -112] },
  open: { hand: [150, -120], handB: [118, -110] },
  up: { hand: [130, -230], handB: [118, -96] },
  point: { hand: [190, -150], handB: [118, -90] },
};
export const poseMix = (a, b, k) => ({ hand: [lerp(a.hand[0], b.hand[0], k), lerp(a.hand[1], b.hand[1], k)], handB: [lerp(a.handB[0], b.handB[0], k), lerp(a.handB[1], b.handB[1], k)] });

// titolo a doppia battuta: teal (knockout) + rosa sfalsato in sovrastampa
export function dhit(s, x, y, size, align = 'center', off = [8, 6], font = 'Bricolage') {
  const f = `800 ${size}px ${font}`;
  text(s, x, y, f, [1, 0, 0], align, 'alphabetic', size * .02);
  over(() => text(s, x + off[0], y + off[1], f, [0, .95, 0], align, 'alphabetic', size * .02));
}
// testo knockout dentro un fumetto
export function ko(s, x, y, size, align = 'center', font = 'Bricolage', wgt = 800) { text(s, x, y, `${wgt} ${size}px ${font}`, [0, 0, 0], align, 'alphabetic', size * .01); }
export const TX = [];                      // testi visibili per readcheck (riempito a ogni render)
export function addText(id, s, x0, y0, x1, y1) { TX.push({ id, text: s, x0: Math.round(x0 + DR.x), y0: Math.round(y0 + DR.y), x1: Math.round(x1 + DR.x), y1: Math.round(y1 + DR.y) }); }

// fumetto "CI DEVO PENSARE" del cliente: rosa pieno, parole in knockout che arrivano una per volta
export function cdpBubble(cx, cy, bw, bh, tail, words, size, idp) {
  bubble(cx, cy, bw, bh, Math.min(bw, bh) * .22, tail[0], tail[1], [0, 1, 0]);
  const l1 = 'CI DEVO', l2 = 'PENSARE';
  const y1 = cy - size * .08, y2 = cy + size * .82;
  g.save();
  const wd = measure('CI ', `800 ${size}px Bricolage`, size * .01), wl1 = measure(l1, `800 ${size}px Bricolage`, size * .01);
  const x0 = cx - wl1 / 2;
  if (words[0] > 0) popText('CI', x0, y1, size, words[0]);
  if (words[1] > 0) popText('DEVO', x0 + wd, y1, size, words[1]);
  if (words[2] > 0) popText(l2, cx - measure(l2, `800 ${size}px Bricolage`, size * .01) / 2, y2, size, words[2]);
  g.restore();
  if (words[0] > 0 && idp) { const wl2 = measure(l2, `800 ${size}px Bricolage`); addText(idp, 'CI DEVO PENSARE', Math.min(x0, cx - wl2 / 2), y1 - size * .78, Math.max(x0 + wl1, cx + wl2 / 2), y2 + size * .1); }
}
export function popText(s, x, y, size, k) {
  const sc = k >= 1 ? 1 : back(clamp(k, 0, 1), 2.2);
  const wd = measure(s, `800 ${size}px Bricolage`, size * .01);
  g.save(); g.translate(x + wd / 2, y - size * .35); g.scale(sc, sc); ko(s, -wd / 2, size * .35, size, 'left'); g.restore();
}
export const pk = (t, t0, d = .16) => clamp((t - t0) / d, 0, 1);

// ───────── le riprese ─────────
// ───────── sottotitoli: striscia carta + testo sulla lastra teal ─────────
export function subtitle(t) {
  for (const c of SUBS) {
    if (t < c.t0 || t >= c.t1) continue;
    idT();
    const lines = c.text.split('\n'), F = '600 46px Jost', lh = 58;
    const wmax = Math.max(...lines.map(s => measure(s, F, .3))) + 64;
    const h = lines.length * lh + 26, cy = 1352;
    rrect(540 - wmax / 2, cy - h / 2, wmax, h, 10, [0, 0, 0]);
    lines.forEach((s, i) => text(s, 540, cy - h / 2 + 13 + lh * (i + .5) + 16, F, [1, 0, 0], 'center', 'alphabetic', .3));
  }
}

export const Q = new URLSearchParams(location.search);
export const NOSUB = Q.has('nosub');
export function renderFilm(t) {
  TX.length = 0; DR = { x: 0, y: 0 }; DW = { x: 0, y: 0 }; TNOW = t;
  clear();
  const s = shotAt(t);
  idT();
  SC.SHOT[s[0]](t);
  idT();
  if (!NOSUB) subtitle(t);
  // la lastra rosa entra col rullo nel primo mezzo secondo
  const sw = t < .7 ? lerp(-60, W + 200, eio(seg(t, .02, .6))) : 1e5;
  return {
    seed: Math.floor(t * 12), sheet: SHOTS.indexOf(s) * 3.7,
    off: regist(t), rot: [0, .0005, -.0004], period: 8, grain: .55,
    gate: [1, 1, 1], sweep: [1e5, sw, 1e5],
  };
}
export const texts = () => TX.slice();
// ZONA SICURA (regola per ogni nuovo reel): composizione centrata su x=540, margini simmetrici ~80-90 px;
// libere solo la fascia alta (y<250), la bassa (y>1470, ~450 px) e l'angolo in basso a destra (x>900, y>950).
// Nota: le camere di QUESTO reel (CAM2/WIDE/MT, sx ~ 490) sono centrate su ~492, non su 540: tenute cosi' per restare identiche. Nei nuovi reel usa sx = ZONA.cx.
export const ZONA = { cx: 540, margine: 85, altaLibera: 250, bassaLibera: 450, angolo: { x: 900, y: 950 } };
