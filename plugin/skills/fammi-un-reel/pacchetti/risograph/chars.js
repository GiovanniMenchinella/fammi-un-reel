// Personaggi: TU (il venditore, lastra teal) e IL CLIENTE (lastra rosa). Profilo laterale, seduti al tavolino.
// Colori = densità [teal, rosa, girasole]. Con la sola lastra teal entrambi restano sagome complete.
import { g, circle, ellipse, rrect, poly, blob, line, curve, ik, over } from './draw.js';

export const PAL = {
  skin: [0, 0, .30], skinSh: [.18, 0, .5],
  // tu
  sJacket: [1, 0, 0], sJacketSh: [1, .35, 0], sTrou: [1, .42, 0], sHair: [1, .6, 0], sTie: [0, 0, 1], sShirt: [0, 0, 0],
  // cliente
  cSweater: [.16, 1, 0], cSweaterSh: [.45, 1, 0], cTrou: [.72, 0, .0], cHair: [1, .6, 0], cHat: [0, 1, 1], cHatRib: [.25, 1, 1],
  shoe: [1, .7, 0], eye: [1, .65, 0], mouth: [1, .65, 0], mouthIn: [.9, 1, 0],
  chair: [.9, 0, .55], table: [1, .3, 0], tableTop: [1, 0, .0],
};
const P = PAL;

// testa di profilo rivolta a destra. o: {kind:'s'|'c', talk:0..1, blink, brow:-1..1 (giù=preoccupato), smile, look}
export function head(o = {}) {
  const k = o.kind || 's';
  // collo
  rrect(-17, 30, 34, 40, 10, P.skin);
  // cranio + viso con naso
  blob([[-40, -30], [-18, -50], [12, -50], [34, -36], [42, -16], [44, -4], [56, 8], [46, 14], [44, 24], [38, 34], [26, 46], [6, 50], [-16, 44], [-36, 26], [-44, 2]], P.skin);
  if (k === 's') {
    // ciuffo
    blob([[-46, 14], [-50, -14], [-40, -42], [-14, -60], [18, -62], [42, -52], [52, -40], [36, -34], [20, -36], [8, -30], [-2, -32], [-12, -22], [-16, -6], [-24, 4], [-34, 18]], P.sHair);
  } else {
    // barba
    blob([[-14, 30], [-4, 22], [10, 26], [26, 22], [40, 26], [46, 30], [40, 40], [28, 52], [8, 58], [-12, 52], [-22, 40]], P.cHair);
    // berretto
    blob([[-48, 0], [-50, -26], [-36, -54], [-8, -68], [22, -66], [44, -52], [52, -30], [50, -18], [16, -22], [-20, -18], [-40, -6]], P.cHat);
    line([[-50, -10], [52, -22]], 12, P.cHatRib, 'round');
    circle(-6, -72, 11, P.cHatRib);
  }
  // occhio
  const by = o.brow || 0;
  if (o.blink) line([[22, -6], [32, -6]], 4, P.eye);
  else ellipse(28 + (o.look || 0), -6, 4.5, 6, 0, P.eye);
  // sopracciglio
  line([[18, -22 + by * 3], [36, -24 - by * 3]], 5, k === 's' ? P.sHair : P.cHair);
  // bocca
  const tk = o.talk || 0;
  if (k === 'c') { if (tk > .05) ellipse(40, 31, 6, 2 + tk * 7, 0, P.mouthIn); }
  else if (tk > .05) ellipse(40, 28, 6, 2 + tk * 8, 0, P.mouthIn);
  else if (o.smile) curve([[30, 26], [37, 31], [44, 26]], 3.5, P.mouth);
  else line([[32, 28], [44, 28]], 3.5, P.mouth);
}

// persona seduta rivolta a destra (dir=-1 la specchia). (x,y) = anca. Parti separate per poter mettere il tavolo in mezzo.
// o: {kind, s, dir, lean, headTilt, talk, blink, brow, smile, hand:[x,y] (mano davanti, coordinate locali), handB, part:'body'|'arm'}
export function person(x, y, o = {}) {
  const s = o.s || 1, dir = o.dir || 1, k = o.kind || 's';
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  const lean = o.lean || 0;
  const sh = [18 + lean * 60, -150 + Math.abs(lean) * 12 - (o.breath || 0)];   // spalla (sale col respiro)
  const jacket = k === 's' ? P.sJacket : P.cSweater, jSh = k === 's' ? P.sJacketSh : P.cSweaterSh;
  const trou = k === 's' ? P.sTrou : P.cTrou;
  if (o.part !== 'arm') {
    // braccio dietro
    const hb = o.handB || [90, -70];
    const [jb, eb] = ik([sh[0] - 6, sh[1] + 14], hb, 92, 88, 1);
    line([[sh[0] - 6, sh[1] + 14], jb, eb], 32, jSh);
    circle(eb[0], eb[1], 13, P.skinSh);
    // gambe (sedute)
    const knee = [118, -6], ankle = [128, 118];
    line([[0, -10], knee], 50, trou); line([knee, ankle], 40, trou);
    poly([[ankle[0] - 22, ankle[1] - 10], [ankle[0] + 34, ankle[1] - 2], [ankle[0] + 38, ankle[1] + 14], [ankle[0] - 22, ankle[1] + 14]], P.shoe);
    // busto
    blob([[-44, 18], [-48, -40], [-40, -120], [sh[0] - 44, sh[1] - 2], [sh[0], sh[1] - 12], [sh[0] + 34, sh[1] + 6], [sh[0] + 40, sh[1] + 50], [44, -40], [50, 10], [10, 22]], jacket);
    if (k === 's') {
      poly([[sh[0] + 6, sh[1] - 6], [sh[0] + 32, sh[1] + 4], [sh[0] + 22, sh[1] + 40]], P.sShirt);
      poly([[sh[0] + 22, sh[1] + 6], [sh[0] + 30, sh[1] + 12], [sh[0] + 30, sh[1] + 70], [sh[0] + 22, sh[1] + 80], [sh[0] + 16, sh[1] + 66]], P.sTie);
    } else {
      // collo a costine del maglione
      line([[sh[0] - 14, sh[1] - 8], [sh[0] + 30, sh[1] + 2]], 12, jSh);
    }
    // testa
    g.save(); g.translate(sh[0] + 6, sh[1] - 62); g.rotate(o.headTilt || 0); head({ kind: k, talk: o.talk, blink: o.blink, brow: o.brow, smile: o.smile, look: o.look }); g.restore();
  }
  if (o.part !== 'body') {
    const hf = o.hand || [96, -76];
    const [jf, ef] = ik([sh[0] + 4, sh[1] + 16], hf, 92, 88, 1);
    line([[sh[0] + 4, sh[1] + 16], jf, ef], 34, jacket);
    circle(ef[0], ef[1], 14, P.skin);
  }
  g.restore();
}
// mano davanti nelle coordinate dello schermo → coordinate locali di person()
export const toLocal = (px, py, x, y, s, dir) => [(px - x) / (s * dir), (py - y) / s];

export function chair(x, y, s, dir) {
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  line([[-46, 14], [-58, -140]], 16, P.chair);
  line([[-56, 14], [52, 14]], 16, P.chair);
  line([[-44, 18], [-50, 128]], 12, P.chair); line([[44, 18], [52, 128]], 12, P.chair);
  g.restore();
}
export function table(x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  line([[0, -60], [0, 120]], 18, P.table);
  ellipse(0, 124, 70, 9, 0, P.table);
  rrect(-170, -78, 340, 22, 11, P.tableTop);
  g.restore();
}

// busto di profilo (testa + spalle), rivolto a destra, origine al centro delle spalle
export function bust(k = 's') {
  const jacket = k === 's' ? P.sJacket : P.cSweater;
  blob([[-70, 120], [-66, 40], [-44, 6], [0, -6], [40, 6], [66, 40], [72, 120]], jacket);
  if (k === 's') { poly([[-4, 2], [22, 10], [10, 46]], P.sShirt); poly([[12, 12], [22, 18], [20, 90], [12, 98], [6, 80]], P.sTie); }
  g.save(); g.translate(4, -60); head({ kind: k, smile: true }); g.restore();
}
