// BASE del motore ink-wash: camera, strati, iscrizioni (sottotitoli), etichette, passo di camminata, compositore delle transizioni.
import { mk, draw, TONE } from './lib/ink.js';
import { hero, POSE, mixPose } from './client.js';
import { VERM } from './props.js';
import { clamp, ss } from '/core/lib.js';
export const FW = 1080, FH = 1920;
// ZONA SICURA (telefono, 1080x1920): composizione CENTRATA su x=540, margini simmetrici ~85 px (testo largo max 910);
// libere solo: fascia alta (y<250), fascia bassa (y>1470), angolo in basso a destra (x>900, y>950).
export const SAFE = { cx: 540, margin: 85, top: 250, bottom: 450, brX: 900, brY: 950 };
export const PAPER_RGB = [242, 236, 222];
// ---------------- camera ----------------
export const camXf = c => ({ s: c.z, tx: FW / 2 - c.x * c.z, ty: FH / 2 - c.y * c.z });
export function useCam(Ls, cam) { const x = camXf(cam); Ls.xf(x.s, x.tx, x.ty); return x; }
export const paperOf = cam => { const x = camXf(cam); return [-x.tx, -x.ty, x.s]; };
export const w2s = (cam, p) => { const x = camXf(cam); return [p[0] * x.s + x.tx, p[1] * x.s + x.ty]; };
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const tw = t => Math.floor(t * 15) / 15;            // on twos
export function blitLayer(Ls, lay, cam, am = 1) {
  const { s, tx, ty } = camXf(cam);
  for (const k of ['wet', 'dry']) { const c = Ls.ink[k]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = am; c.drawImage(lay[k], tx, ty, lay[k].width * s, lay[k].height * s); c.restore(); }
}
export function clipDo(Ls, path, fn) {
  for (const c of [Ls.cw, Ls.cd, Ls.cc]) { c.save(); c.clip(path); }
  fn();
  for (const c of [Ls.cw, Ls.cd, Ls.cc]) c.restore();
}
export const mkLayer = (w, h) => { const wet = document.createElement('canvas'), dry = document.createElement('canvas'); wet.width = dry.width = w; wet.height = dry.height = h; return { wet, dry, ink: { wet: wet.getContext('2d'), dry: dry.getContext('2d') } }; };
export function fadeBand(lay, y0, y1, up = false) {   // erase a layer softly below y0→y1 (mist)
  for (const c of [lay.ink.wet, lay.ink.dry]) {
    c.save(); c.globalCompositeOperation = 'destination-in';
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, up ? 'rgba(0,0,0,0)' : '#000'); g.addColorStop(1, up ? '#000' : 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, lay.wet.width, lay.wet.height); c.restore();
  }
}
export function walkPose(ph) { const u = (ph % 1 + 1) % 1; return u < .5 ? mixPose(POSE.walk1, POSE.walk2, ss(u * 2)) : mixPose(POSE.walk2, POSE.walk1, ss((u - .5) * 2)); }

// ---------------- subtitles (inscriptions) ----------------
export function inscription(Ls, text, x, y, a, o = {}) {
  if (a <= 0) return;
  const size = o.size || 56, lines = text.split('\n'), lh = size * 1.18;
  const font = `italic 600 ${size}px Cormorant`;
  const cd = Ls.cd, cw = Ls.cw;
  cd.save(); cd.setTransform(1, 0, 0, 1, 0, 0); cd.font = font; cd.letterSpacing = '0.5px';
  const wmax = Math.max(...lines.map(l => cd.measureText(l).width)); cd.restore();
  const x0 = o.center ? x - (wmax + size * .62) / 2 : x;
  // lift the ink under the inscription a little (paper shows through), so it always reads
  for (const c of [cw, cd]) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
    const rx = x0 - 14, ry = y - size * 1.0, rw = wmax + size * .62 + 28, rh = lh * (lines.length - 1) + size * 1.45;
    for (let k = 0; k < 6; k++) { const g = (6 - k) * 6; c.globalAlpha = .62 * clamp(a * 1.4) / 6 * 1.4; c.fillRect(rx - g, ry - g, rw + 2 * g, rh + 2 * g); }   // soft-edged lift without a blur filter
    c.restore();
  }
  const wetK = clamp(1 - a) * .8;
  for (const [ctx, k] of [[cw, wetK], [cd, 1 - wetK * .6]]) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a * k * .96); ctx.fillStyle = '#000';
    ctx.font = font; ctx.letterSpacing = '0.5px'; ctx.textBaseline = 'alphabetic';
    lines.forEach((ln, i) => ctx.fillText(ln, x0 + size * .62, y + i * lh));
    ctx.restore();
  }
  const s = size * .3, cc = Ls.cc;
  cc.save(); cc.setTransform(1, 0, 0, 1, 0, 0); cc.globalAlpha = clamp(a * .92); cc.fillStyle = `rgb(${VERM.join(',')})`;
  cc.fillRect(x0, y - size * .34 - s / 2, s, s); cc.restore();
  return { x0, y0: y - size, x1: x0 + wmax + size * .62, y1: y + lh * (lines.length - 1) + size * .3 };
}
export function label(Ls, text, x, y, a, size = 30) {
  if (a <= 0) return;
  const c = Ls.cd; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = clamp(a) * .9; c.fillStyle = '#000';
  c.font = `600 ${size}px CormorantSC`; c.letterSpacing = '9px'; c.fillText(text, x, y);
  const w = c.measureText(text).width; c.restore();
  // a short dry stroke under the label
  Ls.cd.save(); Ls.cd.setTransform(1, 0, 0, 1, 0, 0);
  draw(Ls.ink, mk([[x, y + 16], [x + w * clamp(a * 1.3), y + 14]], { w: 4, tone: TONE.nong, dry: .55, prof: 'tip', seed: 5 }), 1, a);
  Ls.cd.restore();
  return w;
}


// Compositore dei fotogrammi con transizioni "fioritura d'inchiostro".
// cfg = { frameAt(t, Ls) → parametri carta, TRANS: [{a, b, c: t=>[x,y], before: (t, Ls)=>params}], sub(t, Ls) disegna i sottotitoli }
export function makeFrame(cfg) {
  return function frame(t, A, B) {
    for (const tr of cfg.TRANS) {
      if (t >= tr.a && t < tr.b) {
        const oA = tr.before(t, A) || {};
        const oB = cfg.frameAt(t, B) || {};
        const u = (t - tr.a) / (tr.b - tr.a), c = tr.c(t);
        cfg.sub(t, A); cfg.sub(t, B);
        return { ...oA, paperB: oB.paper, bleedB: oB.bleed, rimB: oB.rim, trans: [c[0], c[1], 20 + 2300 * ss(u), 1] };
      }
    }
    const o = cfg.frameAt(t, A) || {};
    cfg.sub(t, A);
    return o;
  };
}
