// Oggetti e mondo: cielo a bande retinate, sole-orologio, prato, fumetti, cartellino, scudo, volantini, nuvola, foglio, busta.
import { g, W, H, circle, ellipse, rect, rrect, poly, blob, line, curve, ring, text, over, measure } from './draw.js';
import { clamp, lerp, seg, ss } from '/core/lib.js';

const mixA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
// ricette di cielo: 4 bande dall'alto verso l'orizzonte (densità [teal, rosa, girasole])
const SKY = {
  night: [[1, .5, 0], [1, .45, 0], [1, .4, 0], [1, .34, 0]],
  sunset: [[0, .2, 0], [0, .42, 0], [0, .62, .4], [0, .6, 1]],
  day: [[0, 0, 0], [.12, 0, 0], [.12, 0, .2], [.0, 0, .38]],
  dawn: [[0, 0, 0], [0, 0, .22], [0, .2, .4], [0, .42, .7]],
};
export function skyRecipe(p, night = 0) {
  // p = fase del giorno 0 (alba) .. 1 (tramonto)
  let r;
  if (p < .18) r = SKY.dawn.map((b, i) => mixA(b, SKY.day[i], ss(seg(p, .05, .18))));
  else if (p < .72) r = SKY.day;
  else r = SKY.day.map((b, i) => mixA(b, SKY.sunset[i], ss(seg(p, .72, .9))));
  if (night > 0) r = r.map((b, i) => mixA(b, SKY.night[i], night));
  return r;
}
// cielo a bande sopra l'orizzonte hy (coordinate schermo)
export function sky(p, hy, night = 0, top = 0) {
  const r = skyRecipe(p, night);
  const h = (hy - top);
  const edges = [0, .34, .6, .82, 1].map(e => top + h * e);
  for (let i = 0; i < 4; i++) rect(-20, edges[i] - 1, W + 40, edges[i + 1] - edges[i] + 2, r[i]);
  if (night > .5) {   // stelle: piccoli knockout carta
    for (let i = 0; i < 46; i++) {
      const sx = (Math.sin(i * 91.7) * .5 + .5) * W, sy = top + (Math.sin(i * 37.3) * .5 + .5) * h * .8;
      circle(sx, sy, 2 + (i % 3), [0, 0, 0]);
    }
  }
}
// prato sotto l'orizzonte
export function ground(hy, night = 0, z = 1, px = 0) {
  const a = mixA([.24, 0, 1], [1, .3, 0], night), b = mixA([.58, 0, 1], [1, .55, 0], night), c2 = mixA([.42, 0, 1], [1, .42, 0], night);
  rect(-20, hy, W + 40, H - hy + 20, a);
  const col = v => `rgb(${Math.round(v[0] * 255)},${Math.round(v[1] * 255)},${Math.round(v[2] * 255)})`;
  // colline lontane (parallasse 0.35) e più vicine (0.7): si muovono meno del prato
  const hill = (k, amp, off, fillc, base) => {
    g.beginPath(); g.moveTo(-20, hy + base * z);
    for (let x = -20; x <= W + 20; x += 24) { const X = x - px * k; g.lineTo(x, hy - amp * z - Math.sin(X * .011 + off) * 16 * z - Math.sin(X * .027 + 1 + off) * 8 * z); }
    g.lineTo(W + 20, hy + base * z); g.closePath(); g.fillStyle = col(fillc); g.fill();
  };
  hill(.35, 18, 0, b, 26);
  hill(.7, 2, 2.3, c2, 30);
  for (let i = 0; i < 6; i++) {
    const yy = hy + (40 + i * i * 22) * z;
    if (yy > H) break;
    rect(-20, yy, W + 40, 5 + i * 2 * z, b);
  }
}
// nuvole a retino che vanno col vento (piano lontano, parallasse 0.2)
export function clouds(t, hy, px = 0, night = 0, phase = .5) {
  const c = night > .5 ? [.6, .2, 0] : [0, 0, 0];
  const c2 = night > .5 ? [.45, .12, 0] : phase > .78 ? [0, .22, .12] : phase < .15 ? [0, .1, .16] : [.12, 0, .06];
  const span = W + 900;
  for (let i = 0; i < 6; i++) {
    const sp = 30 + i * 11, y = 290 + ((i * 151) % Math.max(80, hy - 400));
    let x = ((i * 433 + t * sp - px * .25) % span + span) % span - 450;
    const w = 260 + (i % 3) * 110, h = 56 + (i % 2) * 22;
    if (y + h > hy - 30) continue;
    rrect(x - w / 2, y - h / 2 + 10, w, h, h / 2, c2);
    rrect(x - w / 2, y - h / 2, w, h, h / 2, c);
    rrect(x - w * .22, y - h * .95, w * .52, h * .9, h * .45, c);
  }
}
// semi di tarassaco (giorno) o lucciole (notte) che fluttuano sul quadro
export function floaters(t, night = 0, n = 26) {
  for (let i = 0; i < n; i++) {
    const sp = 40 + (i % 5) * 14, ph = i * 1.37;
    const x = (((i * 97.3 + t * sp) % (W + 120)) + W + 120) % (W + 120) - 60 + Math.sin(t * 1.3 + ph) * 26;
    const y = 300 + ((i * 211.7 - t * (12 + (i % 3) * 8)) % 1500 + 1500) % 1500 + Math.cos(t * 1.1 + ph) * 18;
    if (night > .5) { if ((Math.floor(t * 12) + i * 3) % 11 < 6) circle(x, y, 5 + (i % 2) * 2, [0, 0, 1]); }
    else { circle(x, y, 5 + (i % 3), [0, 0, 0]); line([[x, y], [x - 9, y + 12]], 2.5, [.6, 0, 0]); }
  }
}
// primo piano: ciuffi d'erba alti e margherite davanti ai personaggi (coordinate mondo, parallasse extra pxw)
export function foreground(pxw = 0, night = 0) {
  const blade = night > .5 ? [1, .55, 0] : [.9, 0, 1], dark = night > .5 ? [1, .7, 0] : [1, .25, .8];
  for (let i = 0; i < 26; i++) {
    const y = 1270 + (i % 5) * 70, sc = 1 + (i % 5) * .45;
    const x = ((-900 + i * 157 - pxw * (.3 + (i % 5) * .12)) % 2600 + 2600) % 2600 - 900;
    for (let k = -2; k <= 2; k++) line([[x + k * 9 * sc, y], [x + k * 15 * sc + Math.sin(i + k) * 6, y - (60 + Math.abs(k) * -8) * sc]], 7 * sc, k % 2 ? dark : blade);
    if (i % 3 === 0 && night < .5) { for (let q = 0; q < 6; q++) { const a = q / 6 * Math.PI * 2; circle(x + 30 * sc + Math.cos(a) * 10 * sc, y - 70 * sc + Math.sin(a) * 10 * sc, 7 * sc, [0, 0, 0]); } circle(x + 30 * sc, y - 70 * sc, 6 * sc, [0, 1, 1]); }
  }
}
// uccelli: piccoli segni a V che battono le ali a passo due e attraversano il cielo
export function birds(t, hy, px = 0) {
  for (let k = 0; k < 3; k++) {
    const T = (t * .9 + k * 2.7) % 9, x = -80 + T * 150 - px * .25 + k * 40, y = 360 + k * 46 + Math.sin(T * 2 + k) * 14;
    if (x < -60 || x > W + 60 || y > hy - 60) continue;
    const f = Math.floor(t * 12 + k) % 4, wy = [-10, -3, 6, -3][f];
    line([[x - 16, y + wy], [x, y], [x + 16, y + wy]], 4, [1, .4, 0]);
  }
}
// tazza col vapore: ogni lastra ondeggia con la sua fase (riflesso a lastre separate)
export function cup(x, y, s, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  rrect(-26, -44, 52, 44, 10, [0, 1, .0]); ring(30, -24, 12, 7, [0, 1, 0]); rect(-30, -4, 60, 6, [.6, 1, 0]);
  over(() => {
    for (let p = 0; p < 2; p++) for (let k = 0; k < 2; k++) {
      const pts = []; for (let j = 0; j <= 8; j++) { const yy = -54 - j * 11; pts.push([-8 + k * 16 + Math.sin(j * .9 + t * 3.1 + p * 1.7 + k) * (5 + j * .8), yy]); }
      curve(pts, 6, p === 0 ? [.32, 0, 0] : [0, .38, 0]);
    }
  });
  g.restore();
}
// posizione del sole sull'arco della ripresa
export function sunPos(p, arc) {
  const th = Math.PI * (1 - p);
  return [arc.cx + arc.rx * Math.cos(th), arc.hy - arc.ry * Math.sin(th)];
}
// sole-orologio. o: {clock:0..1 tacche, wedge:0..1 spicchio dei 5 minuti, hand: angolo lancetta (rad, 0 = ore 12), face}
export function sunClock(x, y, r, o = {}) {
  circle(x, y, r, [0, 0, 1]);
  if (o.wedge > 0) {
    over(() => { g.beginPath(); g.moveTo(x, y); g.arc(x, y, r * .96, -Math.PI / 2, -Math.PI / 2 + Math.PI / 6 * o.wedge); g.closePath(); g.fillStyle = 'rgb(0,255,0)'; g.fill(); });
  }
  if (o.clock > 0) {
    for (let i = 0; i < 12; i++) {
      const k = clamp(o.clock * 12 - i, 0, 1); if (k <= 0) continue;
      const a = i / 12 * Math.PI * 2 - Math.PI / 2, r0 = r * .8, r1 = r * (.8 + .12 * k);
      line([[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], i % 3 ? r * .03 : r * .05, [1, 0, 1]);
    }
    if (o.hand !== undefined) {
      const a = o.hand - Math.PI / 2;
      line([[x, y], [x + Math.cos(a) * r * .68, y + Math.sin(a) * r * .68]], r * .05, [1, 0, 1]);
      const a2 = (o.hand2 ?? -0.6) - Math.PI / 2;
      line([[x, y], [x + Math.cos(a2) * r * .45, y + Math.sin(a2) * r * .45]], r * .07, [1, 0, 1]);
      circle(x, y, r * .07, [1, 0, 1]);
    }
  }
}
// fumetto: rettangolo arrotondato con coda verso (tx,ty). c = colore, grow 0..1 = scala dall'attacco della coda
export function bubblePath(x, y, w, h, r, tx, ty) {
  g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, r);
  const side = (tx > x + w / 2 || tx < x - w / 2) && ty > y - h / 2 + r && ty < y + h / 2 - r + 60;
  if (side) {   // coda dal fianco
    const bxs = tx > x ? x + w / 2 - 2 : x - w / 2 + 2, bys = clamp(ty - 30, y - h / 2 + r + 10, y + h / 2 - r - 40);
    const bw = Math.min(40, h * .16);
    g.moveTo(bxs, bys - bw); g.lineTo(tx, ty); g.lineTo(bxs, bys + bw * .4); g.closePath();
    return;
  }
  // coda: base sul bordo più vicino alla punta
  const bx = clamp(tx, x - w / 2 + r + 20, x + w / 2 - r - 20), by = ty > y ? y + h / 2 - 2 : y - h / 2 + 2;
  const bw = Math.min(46, w * .18);
  g.moveTo(bx - bw, by); g.lineTo(tx, ty); g.lineTo(bx + bw * .3, by); g.closePath();
}
export function bubble(x, y, w, h, r, tx, ty, c) {
  bubblePath(x, y, w, h, r, tx, ty); g.fillStyle = `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`; g.fill('nonzero');
}
// cartellino del prezzo (solo il simbolo, nessuna cifra)
export function priceTag(x, y, s, rot, c = [1, 0, 0]) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  poly([[-70, -40], [40, -40], [80, 0], [40, 40], [-70, 40]], c);
  circle(46, 0, 9, [0, 0, 0]);
  text('€', -16, 26, '800 76px Bricolage', [0, 0, 0], 'center', 'alphabetic');
  g.restore();
}
export function tagString(x0, y0, x1, y1, c = [1, 0, 0]) { line([[x0, y0], [x1, y1]], 4, c); }
// scudo
export function shield(x, y, s, rot, c = [1, 0, 0]) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.moveTo(0, -80); g.quadraticCurveTo(46, -64, 64, -70); g.quadraticCurveTo(70, 10, 0, 84); g.quadraticCurveTo(-70, 10, -64, -70); g.quadraticCurveTo(-46, -64, 0, -80); g.closePath();
  g.fillStyle = `rgb(${c[0] * 255},${c[1] * 255},${c[2] * 255})`; g.fill();
  line([[0, -56], [0, 54]], 10, [0, 0, 0]); line([[-40, -18], [40, -18]], 10, [0, 0, 0]);
  g.restore();
}
// nuvola col fulmine (il "qualcosa è successo")
export function cloud(x, y, s, c = [1, 0, 0], bolt = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  blob([[-70, 20], [-80, -6], [-56, -30], [-30, -34], [-14, -58], [20, -60], [40, -40], [66, -40], [84, -14], [74, 20]], c);
  if (bolt > 0) {
    g.save(); g.beginPath(); g.rect(-60, 10, 120, 110 * bolt); g.clip();
    poly([[-8, 16], [22, 16], [6, 50], [30, 50], [-16, 112], [-4, 64], [-24, 64]], [0, 0, 1]);
    g.restore();
  }
  g.restore();
}
// piccolo sole calmo
export function smallSun(x, y, r) {
  circle(x, y, r, [0, 0, 1]);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; line([[x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3], [x + Math.cos(a) * r * 1.65, y + Math.sin(a) * r * 1.65]], r * .2, [0, 0, 1]); }
}
// punto interrogativo tipografico
export function qmark(x, y, size, c, rot = 0, label = '') {
  g.save(); g.translate(x, y); g.rotate(rot);
  text('?', 0, size * .36, `800 ${size}px Bricolage`, c, 'center', 'alphabetic');
  if (label) badge(size * .36, size * .24, size * .17, label);
  g.restore();
}
// freccia
export function arrow(x0, y0, x1, y1, w, c, dash = 0) {
  if (dash) g.setLineDash([dash, dash * .9]);
  const a = Math.atan2(y1 - y0, x1 - x0), hl = w * 3.2;
  line([[x0, y0], [x1 - Math.cos(a) * hl * .6, y1 - Math.sin(a) * hl * .6]], w, c, dash ? 'butt' : 'round');
  g.setLineDash([]);
  poly([[x1, y1], [x1 - Math.cos(a - .5) * hl, y1 - Math.sin(a - .5) * hl], [x1 - Math.cos(a + .5) * hl, y1 - Math.sin(a + .5) * hl]], c);
}
// testo a righe finte (parole del cliente): barre arrotondate
export function wordLines(x, y, w, n, lh, c, seed = 1, k = 1) {
  for (let i = 0; i < n; i++) {
    const L = w * (.6 + .4 * Math.abs(Math.sin(seed * 7.1 + i * 3.3)));
    const kk = clamp(k * n - i, 0, 1); if (kk <= 0) continue;
    let xx = x;
    const words = 2 + Math.floor(Math.abs(Math.sin(seed * 3 + i * 1.7)) * 3);
    for (let j = 0; j < words; j++) {
      const ww = (L / words) - 14; const e = Math.min(xx + ww, x + L * kk);
      if (e > xx) rrect(xx, y + i * lh - lh * .18, e - xx, lh * .36, lh * .18, c);
      xx += ww + 14;
    }
  }
}
// foglio stampato (carta) con ombra-knockout: draw(fn) disegna il contenuto nelle coordinate del foglio
export function sheet(x, y, w, h, rot, fn, edge = [.2, 0, 0]) {
  g.save(); g.translate(x, y); g.rotate(rot);
  rect(-w / 2 + 10, -h / 2 + 12, w, h, edge);     // ombra stampata (retino)
  rect(-w / 2, -h / 2, w, h, [0, 0, 0]);          // carta
  g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip(); fn && fn(w, h); g.restore();
  g.restore();
}
export function envelope(x, y, w, h, rot, flap, c = [1, 0, 0]) {
  g.save(); g.translate(x, y); g.rotate(rot);
  rect(-w / 2, -h / 2, w, h, c);
  poly([[-w / 2, h / 2], [0, 0], [w / 2, h / 2]], [1, .35, 0]);
  // lembo: flap 0 = aperto (su), 1 = chiuso (giù)
  const fy = lerp(-h * .75, h * .1, flap);
  poly([[-w / 2, -h / 2], [0, fy], [w / 2, -h / 2]], flap > .5 ? [1, .55, 0] : [.55, 0, 0]);
  if (flap > .9) circle(0, fy - 6, 22, [0, 1, 1]);
  g.restore();
}

// bollino rosa con numero in knockout
export function badge(x, y, r, label) {
  circle(x, y, r, [0, 1, 0]);
  text(label, x, y + r * .42, `800 ${r * 1.25}px Bricolage`, [0, 0, 0], 'center', 'alphabetic');
}
// decorazioni del prato in coordinate mondo: margherite (carta + cuore rosa), ciuffi, ombra del gruppo
export function meadow(night = 0) {
  const tuft = night > .5 ? [1, .6, 0] : [.85, 0, 1];
  for (let i = 0; i < 70; i++) {
    const x = -700 + ((i * 263.7) % 2500), y = 1035 + ((i * 97.3) % 820);
    if (Math.abs(x - 505) < 420 && y < 1260) continue;
    const sc = .6 + (y - 1035) / 600;
    if (i % 3 === 0) { line([[x - 10 * sc, y], [x - 16 * sc, y - 22 * sc]], 5 * sc, tuft); line([[x, y], [x + 2 * sc, y - 28 * sc]], 5 * sc, tuft); line([[x + 10 * sc, y], [x + 18 * sc, y - 20 * sc]], 5 * sc, tuft); }
    else if (night < .5) { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; circle(x + Math.cos(a) * 7 * sc, y + Math.sin(a) * 4 * sc, 4.5 * sc, [0, 0, 0]); } circle(x, y, 3.5 * sc, [0, 1, 0]); }
  }
  ellipse(505, 1244, 380, 22, 0, night > .5 ? [1, .7, 0] : [.75, 0, 1]);
}

// primissimo piano in basso (sotto i sottotitoli): ciuffi grandi che scorrono al triplo della camera
export function fgBig(dx, t, night = 0) {
  const col = night > .5 ? [1, .62, 0] : [.95, 0, 1], col2 = night > .5 ? [1, .8, 0] : [1, .3, .7];
  const span = W + 700;
  for (let i = 0; i < 7; i++) {
    const x = ((i * 263 - dx * 2.6 + span * 4) % span) - 350, y = 1560 + (i % 3) * 120, sc = 1.3 + (i % 3) * .55;
    const sway = Math.sin(t * 1.6 + i) * 8;
    for (let k = -3; k <= 3; k++) line([[x + k * 12 * sc, y + 60 * sc], [x + k * 22 * sc + sway, y - (110 - Math.abs(k) * 14) * sc]], 13 * sc, k % 2 ? col2 : col);
    if (i % 2 === 0 && night < .5) { for (let q = 0; q < 7; q++) { const a = q / 7 * Math.PI * 2; circle(x + 46 * sc + Math.cos(a) * 16 * sc + sway, y - 120 * sc + Math.sin(a) * 16 * sc, 11 * sc, [0, 0, 0]); } circle(x + 46 * sc + sway, y - 120 * sc, 10 * sc, [0, 1, 1]); }
  }
}
