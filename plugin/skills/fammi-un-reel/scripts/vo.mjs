// VOCE FUORI CAMPO + TEMPI — una battuta per scena, la durata di ogni scena nasce dalla voce.
// Si lancia dalla cartella del progetto Remotion:
//   node mdm/vo.mjs --slug promo                 genera le battute mancanti, monta vo.mp3 + vo-timing.json
//   node mdm/vo.mjs --slug promo S05 S07         rigenera SOLO quelle battute, poi rimonta
//   node mdm/vo.mjs --slug promo --no-voice      niente audio: tempi stimati (≈2,4 parole/s) per costruire subito
// Eleven v4 ("model": "eleven_v4"): tag audio tra [ ] nel testo (esclusi da tempi e sottotitoli), solo stability/similarity.
//
// Legge src/<slug>/script.json:
// { "voice": "3LTv5xMEHTJYUIMl1jBR", "model": "eleven_multilingual_v2", "fps": 30,
//   "settings": { "stability": 0.5, "similarity_boost": 0.8, "style": 0.25, "speed": 1.0 },
//   "lines": [ { "id": "S01", "label": "Il gancio", "lead": 0.9, "tail": 0.5, "text": "…" }, … ] }
//   lead = silenzio prima della battuta dentro la scena, tail = respiro dopo (momento wow → tail più lungo).
//   Una scena SENZA voce: "text": "" e "hold": secondi.
// Scrive: public/<slug>/vo/<id>.mp3|json, public/<slug>/vo.mp3, src/<slug>/vo-timing.json
// Chiave: env ELEVENLABS_API_KEY, oppure --env-file <percorso .env> (mai stampata né salvata nel progetto).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  if (i === -1) return d;
  const v = argv[i + 1];
  argv.splice(i, v && !v.startsWith("--") ? 2 : 1);
  return v && !v.startsWith("--") ? v : true;
};
/** opzione sì/no: non consuma l'argomento successivo */
const flag = (k) => {
  const i = argv.indexOf(`--${k}`);
  if (i === -1) return false;
  argv.splice(i, 1);
  return true;
};
const slug = opt("slug");
if (!slug) throw new Error("--slug obbligatorio");
const envFile = opt("env-file", "");
const noVoice = flag("no-voice");
// --retrim: applica il taglio dei versi alle battute GIÀ generate prima di questa funzione (senza rigenerare)
const retrim = flag("retrim");
const only = argv.filter((a) => /^S\d+$/.test(a));

const ROOT = process.cwd();
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, `src/${slug}/script.json`), "utf8"));
const FPS = cfg.fps ?? 30;
const LINES = cfg.lines;
const OUT_DIR = path.join(ROOT, `public/${slug}/vo`);
const TIMING = path.join(ROOT, `src/${slug}/vo-timing.json`);
fs.mkdirSync(OUT_DIR, { recursive: true });

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  if (envFile) {
    const m = fs.readFileSync(envFile, "utf8").match(/^ELEVENLABS_API_KEY=(.*)$/m);
    if (m) return m[1].trim().replace(/^['"]|['"]$/g, "");
  }
  throw new Error("ELEVENLABS_API_KEY mancante (env o --env-file)");
}

async function gen(i) {
  const L = LINES[i];
  const body = {
    text: L.text, // i tag audio [ ] DEVONO arrivare a ElevenLabs (v3/v4): si tolgono solo da tempi e sottotitoli
    // il contesto invece va pulito: i tag della battuta vicina non devono "trascinare" il tono
    model_id: cfg.model ?? "eleven_multilingual_v2",
    previous_text: (LINES[i - 1]?.text || "").replace(/\[[^\]]*\]\s*/g, "").trim() || undefined,
    next_text: (LINES[i + 1]?.text || "").replace(/\[[^\]]*\]\s*/g, "").trim() || undefined,
    voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: 1.0, ...(cfg.settings ?? {}) },
  };
  // Eleven v4: niente style/speed/speaker_boost né SSML (solo stability + similarity_boost; tag audio tra [ ])
  if (/^eleven_v4/.test(body.model_id)) {
    const { stability, similarity_boost } = body.voice_settings;
    body.voice_settings = { stability, similarity_boost };
  }
  let r;
  for (let prova = 0; prova < 6; prova++) {
    r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.voice}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": apiKey(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.status !== 429 && r.status < 500) break;
    // troppe richieste insieme o server occupato: aspetta e riprova
    await new Promise((ok) => setTimeout(ok, 10000 * (prova + 1)));
  }
  if (!r.ok) throw new Error(`${L.id}: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  fs.writeFileSync(path.join(OUT_DIR, `${L.id}.raw.mp3`), Buffer.from(j.audio_base64, "base64"));
  trimNoise(L.id, j.alignment ?? j.normalized_alignment);
  console.log("generata", L.id);
}

/** Niente versi prima/dopo la battuta (schiarimento di voce, respiri, "ehm"): l'audio si taglia
 *  da poco prima della PRIMA parola a poco dopo l'ULTIMA, e i tempi dell'allineamento si spostano. */
function trimNoise(id, al) {
  const ws = wordsFromAlignment(al);
  const raw = path.join(OUT_DIR, `${id}.raw.mp3`);
  const t0 = ws.length ? Math.max(0, ws[0].start - 0.06) : 0;
  const t1 = ws.length ? ws[ws.length - 1].end + 0.18 : dur(raw);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", raw, "-af", `atrim=${t0.toFixed(3)}:${t1.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=${Math.max(0, t1 - t0 - 0.06).toFixed(3)}:d=0.06`, "-b:a", "128k", path.join(OUT_DIR, `${id}.mp3`)]);
  const sh = (a) => a.map((x) => +Math.max(0, x - t0).toFixed(3));
  fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), JSON.stringify({ ...al, character_start_times_seconds: sh(al.character_start_times_seconds), character_end_times_seconds: sh(al.character_end_times_seconds) }));
  if (t0 > 0.25) console.log(`  ${id}: tagliati ${t0.toFixed(2)}s prima della prima parola`);
}

function wordsFromAlignment(al) {
  const out = [];
  let cur = null;
  let inTag = false; // i tag audio di v3/v4 ([warm], [pause]…) non sono parole pronunciate
  al.characters.forEach((ch, k) => {
    const s = al.character_start_times_seconds[k];
    const e = al.character_end_times_seconds[k];
    if (ch === "[") { inTag = true; if (cur) out.push(cur); cur = null; return; }
    if (inTag) { if (ch === "]") inTag = false; return; }
    if (/\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = { w: "", start: s, end: e };
    cur.w += ch;
    cur.end = e;
  });
  if (cur) out.push(cur);
  return out;
}

/** tempi stimati senza audio: 2,4 parole/s + pause sulla punteggiatura */
function estimateWords(text) {
  const out = [];
  let t = 0;
  for (const w of text.replace(/\[[^\]]*\]/g, " ").split(/\s+/).filter(Boolean)) {
    const d = 0.18 + w.length * 0.045;
    out.push({ w, start: +t.toFixed(3), end: +(t + d).toFixed(3) });
    t += d + (/[.!?]$/.test(w) ? 0.35 : /[,;:]$/.test(w) ? 0.18 : 0.06);
  }
  return out;
}

const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

if (retrim) {
  for (const L of LINES) {
    if (!L.text) continue;
    const raw = path.join(OUT_DIR, `${L.id}.raw.mp3`);
    if (fs.existsSync(raw)) continue; // già tagliata alla generazione
    fs.copyFileSync(path.join(OUT_DIR, `${L.id}.mp3`), raw);
    trimNoise(L.id, JSON.parse(fs.readFileSync(path.join(OUT_DIR, `${L.id}.json`), "utf8")));
  }
}

if (!noVoice && !retrim) {
  for (let i = 0; i < LINES.length; i++) {
    if (!LINES[i].text) continue;
    const f = path.join(OUT_DIR, `${LINES[i].id}.mp3`);
    if (only.length ? only.includes(LINES[i].id) : !fs.existsSync(f)) await gen(i);
  }
}

let startFrame = 0;
const scenes = [];
const allWords = [];
for (const L of LINES) {
  const leadF = Math.round((L.lead ?? 0.3) * FPS);
  let ws = [];
  let speechEnd = 0;
  if (L.text) {
    if (noVoice) ws = estimateWords(L.text);
    else ws = wordsFromAlignment(JSON.parse(fs.readFileSync(path.join(OUT_DIR, `${L.id}.json`), "utf8")));
    speechEnd = ws.length ? ws[ws.length - 1].end : noVoice ? 0 : dur(path.join(OUT_DIR, `${L.id}.mp3`));
  }
  const durationInFrames = L.text ? leadF + Math.ceil((speechEnd + (L.tail ?? 0.5)) * FPS) : Math.round((L.hold ?? 2) * FPS);
  const voStart = (startFrame + leadF) / FPS;
  const sceneWords = ws.map((w) => ({
    w: w.w,
    start: +(voStart + w.start).toFixed(3),
    end: +(voStart + w.end).toFixed(3),
    rel: +(leadF / FPS + w.start).toFixed(3),
    relEnd: +(leadF / FPS + w.end).toFixed(3),
  }));
  scenes.push({
    id: L.id,
    label: L.label ?? "",
    text: (L.text || "").replace(/\[[^\]]*\]\s*/g, "").trim(),
    startFrame,
    durationInFrames,
    voStartInScene: +(leadF / FPS).toFixed(3),
    voEndInScene: +(leadF / FPS + speechEnd).toFixed(3),
    words: sceneWords,
  });
  sceneWords.forEach((w) => allWords.push({ w: w.w, start: w.start, end: w.end, scene: L.id }));
  startFrame += durationInFrames;
}
const totalFrames = startFrame;

if (!noVoice) {
  const spoken = LINES.map((L, i) => ({ L, i })).filter(({ L }) => L.text);
  const args = ["-y", "-loglevel", "error"];
  spoken.forEach(({ L }) => args.push("-i", path.join(OUT_DIR, `${L.id}.mp3`)));
  const chains = spoken.map(({ i }, k) => {
    const ms = Math.round((scenes[i].startFrame / FPS + scenes[i].voStartInScene) * 1000);
    return `[${k}]adelay=${ms}|${ms}[a${k}]`;
  });
  const mix = `${spoken.map((_, k) => `[a${k}]`).join("")}amix=inputs=${spoken.length}:normalize=0,apad=whole_dur=${(totalFrames / FPS).toFixed(3)}[out]`;
  args.push("-filter_complex", [...chains, mix].join(";"), "-map", "[out]", "-ac", "2", "-ar", "44100", "-b:a", "192k", path.join(ROOT, `public/${slug}/vo.mp3`));
  execFileSync("ffmpeg", args);
}

fs.writeFileSync(
  TIMING,
  JSON.stringify({ fps: FPS, totalFrames, totalSeconds: +(totalFrames / FPS).toFixed(3), voice: noVoice ? null : cfg.voice, model: cfg.model, estimated: !!noVoice, scenes, words: allWords }, null, 2),
);
const wpm = (allWords.length / (totalFrames / FPS)) * 60;
console.log(`totale ${totalFrames} frame = ${(totalFrames / FPS).toFixed(2)}s · ${allWords.length} parole · ${wpm.toFixed(0)} parole/min${noVoice ? " (STIMA, senza voce)" : ""}`);
scenes.forEach((s) => console.log(s.id, s.startFrame, s.durationInFrames, (s.durationInFrames / FPS).toFixed(2) + "s", s.text));
