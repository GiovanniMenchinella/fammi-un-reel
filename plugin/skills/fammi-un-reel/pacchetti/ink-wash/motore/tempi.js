// TEMPI: legge vo-timing.json della voce (qualunque copione). Nessun ID fisso: la frase si indica con la POSIZIONE (1,2,3…)
// oppure con l'id ('S01'); la parola con il testo (e k = n-esima volta che compare, da 0).
export const J = await (await fetch('vo-timing.json')).json();
const norm = s => s.toLowerCase().replace(/[^a-zàèéìòù']/g, '');
export const idOf = sc => typeof sc === 'number' ? J.scenes[sc - 1].id : sc;
export function W(sc, word, k = 0) {
  const id = idOf(sc), ws = J.words.filter(w => w.scene === id && norm(w.w) === norm(word));
  if (!ws[k]) throw new Error(`word not found: ${sc} ${word} ${k}`);
  return ws[k];
}
export const w = (sc, word, k = 0) => W(sc, word, k).start;     // inizio della parola (s)
export const we = (sc, word, k = 0) => W(sc, word, k).end;      // fine della parola (s)
export const DUR = J.totalSeconds;
export const WORDS = J.words;
export const SCENES = J.scenes;
// Un sottotitolo = una frase (o metà frase): cue(frase, testo, [parola-inizio,k], [parola-fine,k], {big:'ETICHETTA'})
export function cue(sc, text, from, to, o = {}) {
  const id = idOf(sc), ws = WORDS.filter(x => x.scene === id);
  const a = from ? W(id, from[0], from[1] || 0).start : ws[0].start;
  const b = to ? W(id, to[0], to[1] || 0).end : ws[ws.length - 1].end;
  return { id, text, a, b, ...o };
}
// Finestre di visualizzazione: parte 0,12 s prima del parlato, resta fino a parlato+0,6 s (min 1,8 s), mai dentro il successivo
export function finestre(CUES) {
  for (let i = 0; i < CUES.length; i++) {
    const c = CUES[i], nx = CUES[i + 1];
    c.t0 = Math.max(0, c.a - .12);
    let t1 = Math.max(c.b + .6, c.t0 + 1.8);
    if (nx) t1 = Math.min(Math.max(t1, Math.min(nx.a - .16, c.b + 1.4)), nx.a - .16);
    else t1 = DUR - .05;
    c.t1 = t1;
  }
  return CUES;
}
