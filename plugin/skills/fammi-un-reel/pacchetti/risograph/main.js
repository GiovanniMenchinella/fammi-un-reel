import { makeRiso } from './riso.js';
import { W, H, plate } from './draw.js';
import { renderFilm, setTiming, texts, registerScene, EV, DUR } from './motore.js';
import * as SC from './scene.js';
registerScene(SC);
const out = document.getElementById('c');
const print = makeRiso(out, W, H);
await Promise.all(['500 40px Jost', '600 40px Jost', '700 40px Jost', '800 40px Bricolage'].map(f => document.fonts.load(f)));
// i tempi della voce e i sottotitoli sono i file del progetto (vo-timing.json, subs.json)
const vt = await (await fetch('vo-timing.json')).json();
const subs = await (await fetch('subs.json')).json();
setTiming(vt, subs);
window.DUR = DUR; window.EV = EV;
window.render = t => { print(plate, renderFilm(Math.min(t, DUR - 1e-3))); };
window.TEXTS = () => texts();
window.READY = true;
