import { makeComp, layerSet } from './motore/lib/comp.js';
const q = new URLSearchParams(location.search);
const FW = 1080, FH = 1920;
const comp = makeComp(document.getElementById('c'));
const A = layerSet(FW, FH), B = layerSet(FW, FH), TMP = layerSet(FW, FH), TMP2 = layerSet(FW, FH);
await document.fonts.load('italic 600 40px Cormorant'); await document.fonts.load('italic 500 40px Cormorant');
await document.fonts.load('600 40px CormorantSC');
const S = await import('./contenuto.js');
await S.init({ A, B, TMP, TMP2 });
const T0 = +(q.get('t0') || 0), T1 = q.get('t1') ? +q.get('t1') : S.DUR;   // render one part of the film (fresh browser per part)
window.DUR = T1 - T0;
window.EV = S.events();
window.TEXTS = S.texts;
const mode = q.get('test');
window.render = t => {
  A.clear(); B.clear();
  const o = mode ? S.test(mode, t, A, B) : S.frame(t + T0, A, B);
  comp(A, B, o || {});
};
window.READY = true;
