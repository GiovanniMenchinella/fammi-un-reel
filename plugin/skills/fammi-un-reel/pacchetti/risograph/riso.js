// Compositore di stampa riso (WebGL2), adattato dal motore dello stile Risograph della libreria Lemo-Opuscar (MIT).
// Ingresso: una "tela di separazione" — R = lastra 1 (teal, chiave), G = lastra 2 (rosa fluo), B = lastra 3 (girasole); 0 = niente inchiostro, 255 = pieno.
//   source-over = knockout vero; 'lighter' = sovrastampa (aggiunge inchiostro solo ai canali dati).
// Uscita: tre inchiostri spot moltiplicati sulla carta, ognuno col suo fuori registro, retino a punti col suo angolo,
//   grana, forellini nei pieni, strisce lungo l'alimentazione, macchie di densità, cancello della lastra e passata del rullo (orizzontale o verticale).
export const INK = {
  teal: [0, 131, 138],        // Teal
  pink: [255, 72, 176],       // Fluorescent Pink
  sun: [255, 181, 17],        // Sunflower
};
export const PAPER = [244, 238, 226];

const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uOff[3];
uniform float uRot[3];
uniform float uAng[3];
uniform vec3 uInk[3];
uniform vec3 uPaper;
uniform float uSeed;
uniform float uBoil;
uniform float uSheet;
uniform float uPeriod;
uniform float uGate[3];
uniform float uSweep[3];    // passata orizzontale: inchiostrato x < uSweep
uniform float uSweepY[3];   // passata verticale: inchiostrato y < uSweepY
uniform float uGrain;
out vec4 o;

float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float h21s(vec2 p, float s){ return h21(p + s * 17.13); }
float vn(vec2 p, float s){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  float a = h21s(i, s), b = h21s(i + vec2(1, 0), s), c = h21s(i + vec2(0, 1), s), d = h21s(i + vec2(1, 1), s);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float fib = vn(px * vec2(.9, .25), 7.) * .5 + vn(px * .05, 9.) * .5;
  vec3 col = uPaper * (.975 + .03 * fib);
  for (int i = 0; i < 3; i++) {
    if (uGate[i] <= 0.001) continue;
    vec2 q = rot(px - uRes * .5, uRot[i]) + uRes * .5 - uOff[i];
    float d = texture(uTex, q / uRes)[i];
    float reveal = (1. - smoothstep(-5., 5., px.x - uSweep[i])) * (1. - smoothstep(-5., 5., px.y - uSweepY[i]));
    float band = exp(-pow((px.x - uSweep[i]) / 22., 2.)) + exp(-pow((px.y - uSweepY[i]) / 22., 2.));
    if (d < .002) continue;
    vec2 g = rot(q, uAng[i]) / uPeriod;
    float spot = 1. - (cos(6.2831853 * g.x) + cos(6.2831853 * g.y) + 2.) * .25;
    float n1 = mix(h21s(floor(q * .9), uSheet + float(i) * 3.1), h21s(floor(q * .9), uSeed + float(i) * 3.1), uBoil);
    float n2 = vn(q * .33, uSheet * .7 + float(i));
    float thr = spot + (n1 - .5) * .16 * uGrain + (n2 - .5) * .12;
    float cov = smoothstep(thr - .07, thr + .07, d * 1.06);
    cov = max(cov, smoothstep(.9, 1., d) * .96);
    float sp = h21s(floor(q * .55), uSheet * 1.3 + float(i) * 7.7);
    cov *= 1. - step(.955 - .03 * uGrain, sp) * .75 * smoothstep(.4, 1., d);
    float streak = vn(vec2(q.x * .025, q.y * .0022), 11. + float(i) + uSheet * .37);
    float blot = vn(q * .004, 5. + float(i) * 2. + uSheet * .13);
    float k = clamp(.82 + .13 * streak + .07 * blot, 0., 1.);
    float c = clamp(cov * k * reveal + band * reveal * .4 * smoothstep(0., .25, d), 0., 1.) * uGate[i];
    col *= mix(vec3(1.), uInk[i], c);
  }
  o = vec4(col, 1.);
}`;

export function makeRiso(out, W, H) {
  const gl = out.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: false });
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  const u = {}; for (const n of ['uTex', 'uRes', 'uOff', 'uRot', 'uAng', 'uInk', 'uPaper', 'uSeed', 'uBoil', 'uSheet', 'uPeriod', 'uGate', 'uSweep', 'uSweepY', 'uGrain']) u[n] = gl.getUniformLocation(pr, n);
  gl.viewport(0, 0, W, H);
  return function print(plate, o = {}) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, plate);
    const inks = o.inks || [INK.teal, INK.pink, INK.sun];
    gl.uniform1i(u.uTex, 0);
    gl.uniform2f(u.uRes, W, H);
    gl.uniform2fv(u.uOff, (o.off || [[0, 0], [0, 0], [0, 0]]).flat());
    gl.uniform1fv(u.uRot, o.rot || [0, 0, 0]);
    gl.uniform1fv(u.uAng, o.ang || [0.2618, 1.309, 0.7854]);   // 15° / 75° / 45°
    gl.uniform3fv(u.uInk, inks.map(c => c.map(v => v / 255)).flat());
    gl.uniform3fv(u.uPaper, (o.paper || PAPER).map(v => v / 255));
    gl.uniform1f(u.uSeed, o.seed ?? 0);
    gl.uniform1f(u.uSheet, o.sheet ?? 0);
    gl.uniform1f(u.uBoil, o.boil ?? .35);
    gl.uniform1f(u.uPeriod, o.period ?? 8);
    gl.uniform1fv(u.uGate, o.gate || [1, 1, 1]);
    gl.uniform1fv(u.uSweep, o.sweep || [1e5, 1e5, 1e5]);
    gl.uniform1fv(u.uSweepY, o.sweepY || [1e5, 1e5, 1e5]);
    gl.uniform1f(u.uGrain, o.grain ?? 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}
