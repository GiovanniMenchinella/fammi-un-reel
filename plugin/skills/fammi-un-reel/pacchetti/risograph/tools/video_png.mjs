// Render a fotogrammi PNG (il JPEG 4:2:0 impasta i punti del retino) → intermedio yuv444, adattato da tools/video_png.mjs dello stile Risograph (MIT).
// A blocchi riprendibili: ogni blocco di CH fotogrammi diventa out/chunks/c_NNN.mp4; i blocchi già finiti si saltano.
// node tools/video_png.mjs <progetto> --fps 24 --workers 2 --size 1080x1920 --out <file>   (LIB = cartella della libreria)
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
const LIB = process.env.LIB;
const { openDemo, closeServer, takeSize } = await import(path.join(LIB, 'core/render/page.mjs'));
const args = process.argv.slice(2); const { w: SW, h: SH } = takeSize(args);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = path.resolve(args[0]), FPS = +opt('--fps', 24), WK = +opt('--workers', 2), Q = opt('--q', ''), CH = +opt('--chunk', 96);
const outDir = path.join(dir, 'out'), cDir = path.join(outDir, 'chunks'); fs.mkdirSync(cDir, { recursive: true });
const out = opt('--out', path.join(outDir, 'video.mp4'));
const probe = await openDemo(dir, { w: SW, h: SH, q: Q }); const DUR = await probe.page.evaluate(() => window.DUR); await probe.browser.close();
const TOTAL = Math.round(DUR * FPS), NC = Math.ceil(TOTAL / CH), t0 = Date.now();
const name = c => path.join(cDir, `c_${String(c).padStart(3, '0')}.mp4`);
const todo = [...Array(NC).keys()].filter(c => !fs.existsSync(name(c)));
console.log(`${TOTAL} frames, ${NC} blocchi, da fare ${todo.length}`);
await Promise.all([...Array(WK)].map(async (_, w) => {
  if (!todo.length) return;
  const { browser, page } = await openDemo(dir, { w: SW, h: SH, q: Q });
  while (todo.length) {
    const c = todo.shift(), a = c * CH, b = Math.min(TOTAL, a + CH), tmp = name(c) + '.part.mp4';
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv444p', tmp]);
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.render(t), f / FPS);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    fs.renameSync(tmp, name(c));
    console.log(`w${w} blocco ${c + 1}/${NC}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await browser.close();
}));
const list = path.join(outDir, 'segs.txt');
fs.writeFileSync(list, [...Array(NC).keys()].map(c => `file '${name(c)}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
fs.rmSync(list, { force: true });
console.log('done', out, TOTAL, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
closeServer();
