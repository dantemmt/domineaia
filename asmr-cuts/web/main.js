import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { THEMES } from './themes.js';

// ---------------------------------------------------------------- constants
const W = 1080, H = 1920;
const MAXP = 32, MAXL = 32;
const BOARD_TOP = 0;
const FRUIT_Y = 1.85;
const G = 14; // gravidade
const PAT_SKIN = { speckle: 0, stripes: 1, dimple: 2, blush: 3, fuzzy: 4, swirl: 5, plain: 6 };
const PAT_CAP = { plain: 0, segments: 1, seeds: 2, seedring: 3, swirl: 4, holes: 5 };

// ---------------------------------------------------------------- helpers
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const col = hex => new THREE.Color(hex);

function shapeF(x, y, z, sh) {
  const [a, b, c] = sh.scale, [e1, e2] = sh.exp;
  const k = 1 + (sh.taper || 0) * y / b;
  const qx = x / k / a, qy = y / b, qz = z / k / c;
  return Math.pow(Math.pow(Math.abs(qx), e1) + Math.pow(Math.abs(qz), e1), e2 / e1) + Math.pow(Math.abs(qy), e2);
}
const rhoF = (x, y, z, sh) => Math.pow(shapeF(x, y, z, sh), 1 / sh.exp[1]);

// ---------------------------------------------------------------- renderer / scene
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
camera.position.set(0, 3.1, 12.8);
camera.lookAt(0, 1.35, 0);
camera.updateMatrixWorld();
camera.updateProjectionMatrix();

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const keyDir = new THREE.Vector3(-0.6, 0.9, 0.7).normalize();
const key = new THREE.DirectionalLight(0xfff7eb, 1.15 * Math.PI);
key.position.copy(keyDir).multiplyScalar(12);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 3;
scene.add(key);
const fill = new THREE.DirectionalLight(0x8c99b3, 0.35 * Math.PI);
fill.position.set(8, 3, 5); scene.add(fill);
const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, Math.PI);
hemi.color.setRGB(0.32, 0.33, 0.36, THREE.LinearSRGBColorSpace);
hemi.groundColor.setRGB(0.10, 0.10, 0.12, THREE.LinearSRGBColorSpace);
scene.add(hemi);

// ---- board (madeira procedural)
function woodTexture() {
  const cw = 1024, ch = 512, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d'), img = g.createImageData(cw, ch), r = mulberry32(7);
  const ph = Array.from({ length: 8 }, () => r() * 6.28);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const w = y * 0.09 + Math.sin(x * 0.0045 + ph[0]) * 5 + Math.sin(x * 0.011 + y * 0.004 + ph[1]) * 2.2;
    let v = 0.5 + 0.5 * Math.sin(w); v = Math.pow(v, 3);
    const fine = 0.5 + 0.5 * Math.sin(y * 0.9 + Math.sin(x * 0.03 + ph[2]) * 3);
    const n = (r() - 0.5) * 0.06;
    const t = clamp(v * 0.55 + fine * 0.12 + n, 0, 1);
    const i = (y * cw + x) * 4;
    img.data[i] = lerp(196, 150, t); img.data[i + 1] = lerp(140, 98, t); img.data[i + 2] = lerp(86, 56, t); img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}
const board = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.42, 4.6),
  new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.72, metalness: 0 }));
board.position.set(0, BOARD_TOP - 0.21, 0.1);
board.receiveShadow = true;
scene.add(board);

// ---- blob shadows
function blobTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(cv);
}
const blobTex = blobTexture();
const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const blobs = [];
function getBlob(i) {
  while (blobs.length <= i) {
    const m = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, color: 0x000000 }));
    m.renderOrder = 1; scene.add(m); blobs.push(m);
  }
  return blobs[i];
}

// ---- facas
const bladeGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(-1.25, -0.2); s.lineTo(1.0, -0.2); s.lineTo(1.25, 0.03); s.lineTo(1.25, 0.2); s.lineTo(-1.25, 0.2); s.lineTo(-1.25, -0.2);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.012, bevelSegments: 1 });
  g.translate(0, 0, -0.009);
  return g;
})();
const GHOSTS = [1.0, 0.22, 0.09, 0.035];
const bladePool = [];
for (let i = 0; i < 4; i++) {
  const set = GHOSTS.map(op => {
    const m = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: 0xf2f5f8, metalness: 1.0, roughness: 0.12, envMap: envTex, envMapIntensity: 1.8, transparent: true, opacity: op, depthWrite: op > 0.9 }));
    m.matrixAutoUpdate = false; m.visible = false; m.renderOrder = 3; scene.add(m); return m;
  });
  bladePool.push(set);
}

// ---------------------------------------------------------------- fruit shader
const GLSL_COMMON = /* glsl */`
#define MAXP ${MAXP}
#define MAXL ${MAXL}
uniform vec3 uScale; uniform vec2 uExp; uniform float uTaper;
float shapeF(vec3 p){ float k = 1.0 + uTaper * p.y / uScale.y; vec3 q = vec3(p.x / k, p.y, p.z / k) / uScale;
  return pow(pow(abs(q.x), uExp.x) + pow(abs(q.z), uExp.x), uExp.y / uExp.x) + pow(abs(q.y), uExp.y); }
float rhoF(vec3 p){ return pow(shapeF(p), 1.0 / uExp.y); }
float hash31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float noise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash31(i), hash31(i+vec3(1,0,0)), f.x), mix(hash31(i+vec3(0,1,0)), hash31(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i+vec3(0,0,1)), hash31(i+vec3(1,0,1)), f.x), mix(hash31(i+vec3(0,1,1)), hash31(i+vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ return (0.5*noise(p) + 0.25*noise(p*2.03+1.7) + 0.125*noise(p*4.01+3.1)) / 0.875; }
vec2 cellN(vec3 p){ vec3 i = floor(p); float md = 9.0, h = 0.0;
  for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) for(int z=-1;z<=1;z++){
    vec3 c = i + vec3(x,y,z); vec3 o = vec3(hash31(c), hash31(c+17.1), hash31(c+31.7));
    float d = length(c + o - p); if(d < md){ md = d; h = hash31(c + 5.3); } }
  return vec2(md, h); }
`;

const VERT = /* glsl */`
varying vec3 vLocal; varying vec3 vNormalW; varying vec3 vWorld;
void main(){
  vLocal = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */`
precision highp float;
${GLSL_COMMON}
uniform vec4 uPlanes[MAXP]; uniform int uNP;
uniform vec3 uCamLocal; uniform mat4 uModelMat; uniform mat4 uProj;
uniform vec3 uSkin1; uniform vec3 uSkin2; uniform int uSkinPattern; uniform float uSkinShine; uniform float uPatScale;
uniform vec3 uLayerC[4]; uniform float uLayerR[4]; uniform int uNLayer;
uniform int uCoreOn; uniform vec3 uCoreScale; uniform vec3 uCoreOff; uniform vec3 uCoreColor; uniform float uCoreShine;
uniform int uCapPattern; uniform vec3 uCapAlt; uniform float uCapShine; uniform float uSeg;
uniform vec4 uLines[MAXL]; uniform vec4 uLineSweep[MAXL]; uniform int uNLines;
uniform vec3 uGrid; uniform vec3 uLineColor; uniform float uGlow;
varying vec3 vLocal; varying vec3 vNormalW; varying vec3 vWorld;

vec3 shade(vec3 base, vec3 N, vec3 V, float shine, float spec){
  vec3 L1 = normalize(vec3(-0.6, 0.9, 0.7));
  vec3 L2 = normalize(vec3(0.8, 0.3, 0.5));
  float d1 = max(dot(N, L1), 0.0), d2 = max(dot(N, L2), 0.0);
  vec3 amb = mix(vec3(0.10, 0.10, 0.12), vec3(0.32, 0.33, 0.36), N.y * 0.5 + 0.5);
  vec3 c = base * (amb + d1 * vec3(1.0, 0.97, 0.92) * 1.15 + d2 * vec3(0.55, 0.6, 0.7) * 0.35);
  vec3 Hh = normalize(L1 + V);
  c += vec3(pow(max(dot(N, Hh), 0.0), mix(16.0, 160.0, shine)) * spec * 0.6);
  c += pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.22 * vec3(0.7, 0.75, 0.85);
  return c;
}

vec3 skinColor(vec3 p, out float spec){
  float n = fbm(p * uPatScale);
  vec3 c; spec = uSkinShine;
  if(uSkinPattern == 0){
    float s = smoothstep(0.55, 0.75, noise(p * uPatScale * 2.7));
    c = mix(uSkin1, uSkin2, n); c = mix(c, uSkin2 * 0.55, s * 0.6);
    spec *= 0.5 + 0.9 * noise(p * 45.0);
  } else if(uSkinPattern == 1){
    float a = atan(p.z, p.x);
    float w = sin(a * 8.0 + (fbm(p * 2.5) - 0.5) * 6.0 + p.y * 1.2);
    c = mix(uSkin2, uSkin1, smoothstep(-0.25, 0.3, w)); c *= 0.85 + 0.3 * n;
  } else if(uSkinPattern == 2){
    float d = noise(p * uPatScale * 3.0);
    c = mix(uSkin1, uSkin2, n) * (0.86 + 0.2 * d); spec *= 0.4 + d;
  } else if(uSkinPattern == 3){
    c = mix(uSkin1, uSkin2, smoothstep(0.3, 0.75, fbm(p * uPatScale + vec3(0.0, p.y, 0.0))));
  } else if(uSkinPattern == 4){
    c = mix(uSkin1, uSkin2, n) * (0.75 + 0.45 * noise(p * 95.0)); spec *= 0.25;
  } else if(uSkinPattern == 5){
    c = mix(uSkin1, uSkin2, smoothstep(0.35, 0.65, fbm(p * uPatScale + fbm(p * 1.7) * 2.2)));
  } else {
    c = mix(uSkin1, uSkin2, n * 0.6);
  }
  return c;
}

vec3 capColor(vec3 p, out float spec){
  float r = rhoF(p);
  vec3 c = uLayerC[0];
  float inner = 1.0;
  for(int i = 0; i < 4; i++){ if(i < uNLayer){ inner = uLayerR[i]; if(r < uLayerR[i]) c = uLayerC[i]; } }
  spec = uCapShine;
  c *= 0.93 + 0.14 * fbm(p * 7.0);
  if(r < inner){
    if(uCapPattern == 1){
      float a = atan(p.z, p.x) / 6.28318 * uSeg;
      float m = abs(fract(a) - 0.5) * 2.0;
      float mem = smoothstep(0.86, 0.97, m) * smoothstep(0.06, 0.16, length(p.xz));
      float v = noise(vec3(a * 5.0, r * 16.0, p.y * 16.0));
      c *= 0.88 + 0.25 * v;
      c = mix(c, uCapAlt, mem);
    } else if(uCapPattern == 2){
      vec2 cl = cellN(p * vec3(4.2, 3.2, 4.2));
      if(cl.y < 0.45 && r > 0.25 && r < inner - 0.08 && cl.x < 0.12){ c = uCapAlt; spec = 0.9; }
      c *= 0.92 + 0.12 * noise(p * 22.0);
    } else if(uCapPattern == 3){
      float ring = smoothstep(0.3, 0.34, r) * (1.0 - smoothstep(0.48, 0.54, r));
      vec2 cl = cellN(p * 16.0);
      if(ring > 0.5 && cl.x < 0.17 && cl.y < 0.75){ c = uCapAlt; spec = 0.9; }
      c *= 0.9 + 0.2 * noise(normalize(p) * 18.0);
    } else if(uCapPattern == 4){
      float s = smoothstep(0.42, 0.62, fbm(p * 2.2 + fbm(p * 1.3) * 2.6));
      c = mix(c, uCapAlt, s * 0.75);
    } else if(uCapPattern == 5){
      vec2 cl = cellN(p * 2.8);
      float hole = 1.0 - smoothstep(0.17, 0.2, cl.x);
      if(cl.y < 0.55) { c = mix(c, uCapAlt * 0.6, hole); spec = mix(spec, 0.05, hole); }
    }
  }
  if(uCoreOn == 1){
    float cr = length((p - uCoreOff) / uCoreScale);
    if(cr < 1.0){ c = uCoreColor * (0.88 + 0.2 * noise(p * 9.0)); spec = uCoreShine; }
  }
  return c;
}

float lineMask(vec3 p){
  float m = 0.0, w = uGlow;
  for(int i = 0; i < MAXL; i++){
    if(i >= uNLines) break;
    vec4 L = uLines[i]; vec4 S = uLineSweep[i];
    float d = abs(dot(L.xyz, p) + L.w);
    if(dot(S.xyz, p) < S.w) m = max(m, 1.0 - smoothstep(w * 0.35, w, d));
  }
  if(uGrid.z > 0.5){
    for(int a = 0; a < 3; a++){
      float cc = p[a] / uGrid.x; float id = floor(cc + 0.5); float d = abs(cc - id) * uGrid.x;
      if(hash31(vec3(id, float(a) * 7.1, 3.3)) < uGrid.y) m = max(m, 1.0 - smoothstep(w * 0.25, w * 0.75, d));
    }
  }
  return m;
}

void main(){
  for(int i = 0; i < MAXP; i++){ if(i >= uNP) break; vec4 P = uPlanes[i]; if(dot(P.xyz, vLocal) + P.w < 0.0) discard; }
  vec3 c;
  if(gl_FrontFacing){
    vec3 N = normalize(vNormalW); vec3 V = normalize(cameraPosition - vWorld);
    float sp; vec3 base = skinColor(vLocal, sp);
    c = shade(base, N, V, uSkinShine, sp);
    float m = lineMask(vLocal);
    c = mix(c, uLineColor * 1.25, m);
    gl_FragDepth = gl_FragCoord.z;
  } else {
    if(uNP == 0) discard;
    vec3 dir = normalize(vLocal - uCamLocal);
    float tE = -1e9; vec3 nE = vec3(0.0);
    for(int i = 0; i < MAXP; i++){
      if(i >= uNP) break;
      vec4 P = uPlanes[i]; float den = dot(P.xyz, dir);
      if(den > 1e-5){ float t = -(dot(P.xyz, uCamLocal) + P.w) / den; if(t > tE){ tE = t; nE = P.xyz; } }
    }
    if(tE < 0.0) discard;
    vec3 Pl = uCamLocal + dir * tE;
    if(shapeF(Pl) > 1.0) discard;
    vec3 N = normalize(mat3(uModelMat) * (-nE));
    vec3 Pw = (uModelMat * vec4(Pl, 1.0)).xyz;
    vec3 V = normalize(cameraPosition - Pw);
    float sp; vec3 base = capColor(Pl, sp);
    c = shade(base, N, V, 0.65, sp);
    vec4 clip = uProj * viewMatrix * vec4(Pw, 1.0);
    gl_FragDepth = (clip.z / clip.w) * 0.5 + 0.5;
  }
  gl_FragColor = vec4(pow(max(c, 0.0), vec3(1.0 / 2.2)), 1.0);
}`;

function makeFruitMaterial(th) {
  const L = th.layers;
  const u = {
    uPlanes: { value: Array.from({ length: MAXP }, () => new THREE.Vector4()) }, uNP: { value: 0 },
    uCamLocal: { value: new THREE.Vector3() }, uModelMat: { value: new THREE.Matrix4() }, uProj: { value: camera.projectionMatrix.clone() },
    uScale: { value: new THREE.Vector3(...th.shape.scale) }, uExp: { value: new THREE.Vector2(...th.shape.exp) }, uTaper: { value: th.shape.taper || 0 },
    uSkin1: { value: col(th.skin.c1) }, uSkin2: { value: col(th.skin.c2) }, uSkinPattern: { value: PAT_SKIN[th.skin.pattern] ?? 6 },
    uSkinShine: { value: th.skin.shine ?? 0.5 }, uPatScale: { value: th.skin.scale ?? 6 },
    uLayerC: { value: [0, 1, 2, 3].map(i => col((L[i] || L[L.length - 1]).c)) },
    uLayerR: { value: [0, 1, 2, 3].map(i => (L[i] ? L[i].r : 0)) }, uNLayer: { value: L.length },
    uCoreOn: { value: th.core ? 1 : 0 }, uCoreScale: { value: new THREE.Vector3(...(th.core?.scale || [0.1, 0.1, 0.1])) },
    uCoreOff: { value: new THREE.Vector3(...(th.core?.off || [0, 0, 0])) }, uCoreColor: { value: col(th.core?.c || '#ffffff') },
    uCoreShine: { value: th.core?.shine ?? 0.5 },
    uCapPattern: { value: PAT_CAP[th.cap.pattern] ?? 0 }, uCapAlt: { value: col(th.cap.alt || '#ffffff') },
    uCapShine: { value: th.cap.shine ?? 0.6 }, uSeg: { value: th.cap.segments || 10 },
    uLines: { value: Array.from({ length: MAXL }, () => new THREE.Vector4()) },
    uLineSweep: { value: Array.from({ length: MAXL }, () => new THREE.Vector4()) }, uNLines: { value: 0 },
    uGrid: { value: new THREE.Vector3(0.1, 0, 0) },
    uLineColor: { value: col(th.lineColor || '#fff6c8') }, uGlow: { value: 0.022 },
  };
  return new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide });
}

function buildFruitGeometry(sh) {
  const g = new THREE.SphereGeometry(1, 192, 144);
  const pos = g.attributes.position, nor = g.attributes.normal, v = new THREE.Vector3();
  const e = 1e-3;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let lo = 0, hi = 4;
    for (let k = 0; k < 32; k++) { const m = (lo + hi) / 2; if (shapeF(v.x * m, v.y * m, v.z * m, sh) <= 1) lo = m; else hi = m; }
    const x = v.x * lo, y = v.y * lo, z = v.z * lo;
    pos.setXYZ(i, x, y, z);
    const gx = shapeF(x + e, y, z, sh) - shapeF(x - e, y, z, sh);
    const gy = shapeF(x, y + e, z, sh) - shapeF(x, y - e, z, sh);
    const gz = shapeF(x, y, z + e, sh) - shapeF(x, y, z - e, sh);
    const l = Math.hypot(gx, gy, gz) || 1;
    nor.setXYZ(i, gx / l, gy / l, gz / l);
  }
  g.computeBoundingSphere();
  return g;
}

// cor de um ponto interno (espelho simplificado do shader, para os cubinhos)
function interiorColor(p, th, rng) {
  const sh = th.shape, r = rhoF(p.x, p.y, p.z, sh);
  let c = th.layers[0].c;
  for (const L of th.layers) if (r < L.r) c = L.c;
  const inner = th.layers[th.layers.length - 1].r;
  let out = col(c);
  if (r < inner) {
    if (th.cap.pattern === 'seeds' && r > 0.25 && rng() < 0.05) out = col(th.cap.alt);
    if (th.cap.pattern === 'seedring' && r > 0.3 && r < 0.52 && rng() < 0.35) out = col(th.cap.alt);
    if (th.cap.pattern === 'segments' && rng() < 0.12) out = col(th.cap.alt);
    if (th.cap.pattern === 'swirl' && rng() < 0.35) out = col(th.cap.alt);
  }
  if (th.core) {
    const [a, b, cc] = th.core.scale, [ox, oy, oz] = th.core.off;
    if (Math.hypot((p.x - ox) / a, (p.y - oy) / b, (p.z - oz) / cc) < 1) out = col(th.core.c);
  }
  return out;
}

// ---------------------------------------------------------------- state
let TH, FGEO, BASEMAT, OPTS, STAGES = [], CUES = [], DURATION = 0, OUTRO_T0 = 0, INTRO_END = 0;
const tmpM = new THREE.Matrix4(), tmpM2 = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
const ONE = new THREE.Vector3(1, 1, 1);
const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(4), type, ...o });

function fmtN(n) { return OPTS.lang === 'en' ? n.toLocaleString('en-US') : n.toLocaleString('pt-BR'); }
function label(n) {
  const w = OPTS.lang === 'en' ? (n === 1 ? 'Cut' : 'Cuts') : (n === 1 ? 'Corte' : 'Cortes');
  return `${fmtN(n)} ${w}`;
}

// transformação do objeto inteiro (flutuando e girando)
function objXform(st, tau, out) {
  const ry = st.rot0 + 0.5 * tau, rx = 0.12 * Math.sin(0.8 * tau + st.ph), rz = 0.07 * Math.sin(0.6 * tau);
  out.quat.setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
  out.pos.set(0, FRUIT_Y + 0.045 * Math.sin(1.4 * tau + st.ph), 0);
  const pt = tau - st.popAt;
  const s = pt < 0 ? 0.0001 : pt < 0.38 ? Math.max(0.0001, easeOutBack(pt / 0.38)) : 1;
  out.scale = s;
  out.mat = (out.mat || new THREE.Matrix4()).compose(out.pos, out.quat, new THREE.Vector3(s, s, s));
  return out;
}
const newX = () => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: 1, mat: new THREE.Matrix4() });

function makePieceMesh() {
  const mat = BASEMAT.clone();
  for (const k of ['uPlanes', 'uLines', 'uLineSweep']) mat.uniforms[k].value = mat.uniforms[k].value.map(v => v.clone());
  mat.uniforms.uProj.value.copy(camera.projectionMatrix);
  const m = new THREE.Mesh(FGEO, mat);
  m.matrixAutoUpdate = false; m.frustumCulled = false; m.visible = false; m.renderOrder = 2;
  scene.add(m);
  return m;
}
function setPieceMatrix(mesh, M) {
  mesh.matrix.copy(M); mesh.matrixWorldNeedsUpdate = true;
  const u = mesh.material.uniforms;
  u.uModelMat.value.copy(M);
  tmpM2.copy(M).invert();
  u.uCamLocal.value.copy(camera.position).applyMatrix4(tmpM2);
}

// plano no mundo (normal n, ponto q) -> plano local do objeto na transformação X
function worldPlaneToLocal(n, q, X) {
  tmpM2.copy(X.mat).invert();
  const qL = q.clone().applyMatrix4(tmpM2);
  const nL = n.clone().applyQuaternion(X.quat.clone().invert()).normalize();
  return new THREE.Vector4(nL.x, nL.y, nL.z, -nL.dot(qL));
}

// sub-geometria: só os triângulos da casca que pertencem à célula (bem mais rápido)
function subGeometry(planes, signs) {
  const pos = FGEO.attributes.position, idx = FGEO.index.array, m = 0.04;
  const inside = new Uint8Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); let ok = 1;
    for (let k = 0; k < planes.length; k++) { const P = planes[k], s = signs[k] ? 1 : -1; if (s * (P.x * x + P.y * y + P.z * z + P.w) < -m) { ok = 0; break; } }
    inside[i] = ok;
  }
  const out = [];
  for (let t = 0; t < idx.length; t += 3) if (inside[idx[t]] || inside[idx[t + 1]] || inside[idx[t + 2]]) out.push(idx[t], idx[t + 1], idx[t + 2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', pos); g.setAttribute('normal', FGEO.attributes.normal);
  g.setIndex(out);
  return g;
}

// amostragem das células (pedaços) definidas pelos planos
function sampleCells(planes, rng, nSamples = 45000) {
  const sh = TH.shape, [a, b, c] = sh.scale, k = 1 + Math.abs(sh.taper || 0);
  const cells = new Map();
  let got = 0, tries = 0;
  while (got < nSamples && tries < nSamples * 6) {
    tries++;
    const x = (rng() * 2 - 1) * a * k, y = (rng() * 2 - 1) * b, z = (rng() * 2 - 1) * c * k;
    if (shapeF(x, y, z, sh) > 1) continue;
    got++;
    let key = 0;
    for (const P of planes) key = key * 2 + (P.x * x + P.y * y + P.z * z + P.w >= 0 ? 1 : 0);
    let e = cells.get(key);
    if (!e) { e = { key, n: 0, sx: 0, sy: 0, sz: 0, pts: [] }; cells.set(key, e); }
    e.n++; e.sx += x; e.sy += y; e.sz += z;
    if (e.pts.length < 500) e.pts.push(new THREE.Vector3(x, y, z));
    else if (rng() < 0.1) e.pts[Math.floor(rng() * 500)] = new THREE.Vector3(x, y, z);
  }
  const total = got;
  return [...cells.values()].filter(e => e.n >= 4).map(e => {
    const cL = new THREE.Vector3(e.sx / e.n, e.sy / e.n, e.sz / e.n);
    const signs = []; let tmp = e.key;
    for (let i = planes.length - 1; i >= 0; i--) { signs[i] = tmp % 2; tmp = Math.floor(tmp / 2); }
    return { cL, frac: e.n / total, pts: e.pts.map(p => p.sub(cL)), signs };
  });
}

// ---------------------------------------------------------------- piece physics (analítica, determinística)
function planPiece(pc, opt) {
  const { c0, v0, yRest, target } = opt;
  const y0 = Math.max(c0.y, yRest + 0.01);
  const vy = v0.y;
  const t1 = (vy + Math.sqrt(vy * vy + 2 * G * (y0 - yRest))) / G;
  const vImp = Math.abs(vy - G * t1);
  const vb = 0.26 * vImp, tb = 2 * vb / G;
  const K = t1 + 0.45 * tb + 0.06;
  let vx = v0.x, vz = v0.z;
  if (target) { vx = (target.x - c0.x) / K; vz = (target.z - c0.z) / K; }
  else {
    const fx = clamp(c0.x + vx * K, -1.55, 1.55), fz = clamp(c0.z + vz * K, -1.1, 1.3);
    vx = (fx - c0.x) / K; vz = (fz - c0.z) / K;
  }
  Object.assign(pc, { c0: c0.clone(), y0, vy, t1, vb, tb, vx, vz, yRest, settle: t1 + 0.35 });
}
function piecePose(pc, ts, outPos, outQ) {
  const { c0, y0, vy, t1, vb, tb, vx, vz, yRest } = pc;
  let x, y, z;
  if (ts <= 0) { outPos.copy(c0); outQ.copy(pc.Q0); return; }
  if (ts < t1) { x = c0.x + vx * ts; z = c0.z + vz * ts; y = y0 + vy * ts - 0.5 * G * ts * ts; }
  else if (ts < t1 + tb) { const d = ts - t1; x = c0.x + vx * t1 + 0.45 * vx * d; z = c0.z + vz * t1 + 0.45 * vz * d; y = yRest + vb * d - 0.5 * G * d * d; }
  else { const d = ts - t1 - tb, f = (1 - Math.exp(-5 * d)) / 5 * 0.3;
    x = c0.x + vx * (t1 + 0.45 * tb + f); z = c0.z + vz * (t1 + 0.45 * tb + f); y = yRest; }
  outPos.set(x, y, z);
  const e = easeOutCubic(clamp(ts / pc.settle, 0, 1));
  outQ.slerpQuaternions(pc.Q0, pc.Qf, e);
}
function restHeight(pts, Qf) {
  let mn = Infinity; const v = new THREE.Vector3();
  for (const p of pts) { v.copy(p).applyQuaternion(Qf); if (v.y < mn) mn = v.y; }
  return BOARD_TOP - mn;
}

// ---------------------------------------------------------------- stages
function makeSweep(t0, dur, n, q, v, center) {
  const p0 = center.clone().sub(n.clone().multiplyScalar(n.dot(center.clone().sub(q))));
  return { t0, dur, n: n.clone(), p0, v: v.clone() };
}
const SWEEP_EXT = 2.5;
function sweepX(s) { return lerp(-SWEEP_EXT, SWEEP_EXT, easeInOutSine(clamp(s, 0, 1))); }

function inPlaneDir(n, hint) { const v = hint.clone().sub(n.clone().multiplyScalar(hint.dot(n))); if (v.lengthSq() < 1e-4) v.set(0, 0, 1).sub(n.clone().multiplyScalar(n.z)); return v.normalize(); }

function buildStage(N, idx, t0, lead, rng) {
  const st = { N, idx, t0, lead, rot0: rng() * 6.28, ph: rng() * 6.28, popAt: idx === 0 ? 0.05 : 0.02, sweeps: [], lines: [] };
  st.type = N === 1 ? 'halves' : N <= 30 ? 'pieces' : 'dice';
  st.whole = makePieceMesh();
  const X = newX();
  cue(t0 + st.popAt, 'pop', { amp: 0.5 });
  cue(t0 + st.popAt, 'whoosh', { amp: 0.35, dur: 0.3, pan: 0 });
  const center = new THREE.Vector3(0, FRUIT_Y, 0);

  if (st.type === 'halves' || st.type === 'pieces') {
    const cutTimes = st.type === 'halves' ? [lead + 0.45] : Array.from({ length: N }, (_, i) => lead + 0.4 + i * 0.16);
    const dur = st.type === 'halves' ? 0.24 : 0.15;
    const planesL = [];
    cutTimes.forEach((tc, i) => {
      let n, q, v;
      if (st.type === 'halves') {
        n = new THREE.Vector3(1, 0.12, 0.75).normalize();
        q = center.clone(); v = inPlaneDir(n, new THREE.Vector3(0.1, -1, 0));
      } else {
        const th = (i + 0.2 + rng() * 0.6) / N * Math.PI + st.rot0;
        n = new THREE.Vector3(Math.cos(th), Math.sin(th), (rng() < 0.5 ? -1 : 1) * (0.35 + rng() * 0.5)).normalize();
        q = center.clone().add(n.clone().multiplyScalar((rng() - 0.5) * 0.5));
        v = inPlaneDir(n, new THREE.Vector3((rng() - 0.5) * 1.4, -1, (rng() - 0.5) * 0.6));
      }
      const sw = makeSweep(t0 + tc, dur, n, q, v, center);
      st.sweeps.push(sw);
      objXform(st, tc + dur * 0.5, X);
      const PL = worldPlaneToLocal(n, q, X);
      planesL.push(PL);
      const vL = v.clone().applyQuaternion(X.quat.clone().invert()).normalize();
      tmpM2.copy(X.mat).invert();
      const p0L = sw.p0.clone().applyMatrix4(tmpM2);
      st.lines.push({ t0: sw.t0, dur, plane: PL, vL, base: vL.dot(p0L) });
      cue(sw.t0, 'whoosh', { amp: st.type === 'halves' ? 0.6 : 0.4, dur: dur + 0.1, pan: clamp(-v.x, -1, 1) * 0.5 });
      cue(sw.t0 + dur * 0.42, 'slice', { amp: st.type === 'halves' ? 0.95 : 0.7, pan: (rng() - 0.5) * 0.4 });
    });
    st.ts = cutTimes[cutTimes.length - 1] + (st.type === 'halves' ? 0.8 : 0.5);
    st.end = st.ts + (st.type === 'halves' ? 1.7 : 1.95);
    // pedaços
    const XS = objXform(st, st.ts, newX());
    const cells = sampleCells(planesL, rng);
    st.pieces = cells.map((cell, ci) => {
      const mesh = makePieceMesh();
      mesh.geometry = subGeometry(planesL, cell.signs);
      const u = mesh.material.uniforms;
      planesL.forEach((P, i) => { const s = cell.signs[i] ? 1 : -1; u.uPlanes.value[i].set(P.x * s, P.y * s, P.z * s, P.w * s); });
      u.uNP.value = planesL.length;
      const c0 = cell.cL.clone().applyMatrix4(XS.mat);
      const pc = { mesh, cL: cell.cL, Q0: XS.quat.clone(), size: Math.cbrt(cell.frac) };
      let Qf, target = null, v0;
      if (st.type === 'halves') {
        const s = cell.signs[0] ? 1 : -1;
        const nOut = new THREE.Vector3(planesL[0].x, planesL[0].y, planesL[0].z).multiplyScalar(-s);
        Qf = new THREE.Quaternion().setFromUnitVectors(nOut, new THREE.Vector3(0, 0.85, 1).normalize());
        const side = Math.sign(c0.x) || (s > 0 ? 1 : -1);
        target = new THREE.Vector3(side * 0.98, 0, side > 0 ? 0.15 : 0.45);
        v0 = new THREE.Vector3(0, 2.2, 0);
      } else {
        // escolhe a face de corte maior para apoiar (ou mostra a face pra cima)
        let best = -1, bestCnt = 0;
        planesL.forEach((P, i) => {
          const s = cell.signs[i] ? 1 : -1; let cnt = 0;
          for (const p of cell.pts) { const d = s * (P.x * (p.x + cell.cL.x) + P.y * (p.y + cell.cL.y) + P.z * (p.z + cell.cL.z) + P.w); if (d < 0.06) cnt++; }
          if (cnt > bestCnt) { bestCnt = cnt; best = i; }
        });
        const P = planesL[Math.max(0, best)], s = cell.signs[Math.max(0, best)] ? 1 : -1;
        const nOut = new THREE.Vector3(P.x, P.y, P.z).multiplyScalar(-s);
        const up = cell.frac > 0.035 && rng() < 0.6;
        Qf = new THREE.Quaternion().setFromUnitVectors(nOut, up ? new THREE.Vector3(0, 0.8, 0.6).normalize() : new THREE.Vector3(0, -1, 0));
        Qf.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), up ? (rng() - 0.5) * 0.8 : rng() * 6.28));
        const dir = c0.clone().sub(center); dir.y = 0; if (dir.lengthSq() < 1e-4) dir.set(rng() - 0.5, 0, rng() - 0.5); dir.normalize();
        const sp = 0.9 + rng() * 1.3;
        v0 = new THREE.Vector3(dir.x * sp, 1.0 + rng() * 2.2, dir.z * sp * 0.7 + 0.25);
      }
      pc.Qf = Qf;
      planPiece(pc, { c0, v0, yRest: restHeight(cell.pts, Qf), target });
      const amp = clamp(0.25 + pc.size * 1.2, 0.2, 1);
      cue(t0 + st.ts + pc.t1, pc.size > 0.5 ? 'thud' : 'tap', { amp, pan: clamp(c0.x / 2, -1, 1), v: ci % 5 });
      if (pc.tb > 0.03) cue(t0 + st.ts + pc.t1 + pc.tb, 'tap', { amp: amp * 0.35, pan: clamp(c0.x / 2, -1, 1), v: (ci + 2) % 5 });
      return pc;
    });
    cue(t0 + st.ts, 'squish', { amp: st.type === 'halves' ? 0.8 : 0.9 });
    cue(t0 + st.ts, 'whoosh', { amp: 0.35, dur: 0.35, pan: 0 });
  } else {
    // ------------------------------- dice / purê
    const sh = TH.shape;
    let s = 0.33 * Math.pow(N, -0.27);
    const vol = (4 / 3) * Math.PI * sh.scale[0] * sh.scale[1] * sh.scale[2];
    s = Math.max(s, Math.cbrt(vol / 60000));
    st.s = s;
    const win = N >= 1000 ? 2.6 : 2.2, start = lead + 0.35;
    st.cutTimes = Array.from({ length: N }, (_, i) => start + win * Math.pow((i + 1) / N, 0.62));
    const dur = 0.11;
    st.cutTimes.forEach((tc, i) => {
      const a = i % 3;
      const nL = new THREE.Vector3(a === 0 ? 1 : 0, a === 1 ? 1 : 0, a === 2 ? 1 : 0);
      const off = (Math.floor((rng() - 0.5) * 2 * sh.scale[a] / s)) * s;
      objXform(st, tc, X);
      const n = nL.clone().applyQuaternion(X.quat);
      const q = new THREE.Vector3().setComponent(a, off).applyMatrix4(X.mat);
      const v = inPlaneDir(n, new THREE.Vector3((rng() - 0.5) * 2, -1, (rng() - 0.5)));
      if (i % Math.max(1, Math.floor(N / 45)) === 0) st.sweeps.push(makeSweep(t0 + tc - dur * 0.4, dur, n, q, v, center));
      const dens = N >= 1000 ? 0.22 : 0.55;
      if (N < 1000 || i % 2 === 0) cue(t0 + tc, 'slice', { amp: dens * (0.7 + 0.3 * rng()), pan: (rng() - 0.5) * 0.8, v: i % 4 });
      if (i % Math.max(1, Math.floor(N / 40)) === 0) cue(t0 + tc - 0.04, 'whoosh', { amp: 0.18, dur: 0.14, pan: (rng() - 0.5) });
    });
    st.ts = start + win + 0.4;
    // cubos
    const [a, b, c] = sh.scale, k = 1 + Math.abs(sh.taper || 0);
    const XS = objXform(st, st.ts, newX());
    const cubes = [];
    const ni = Math.ceil(a * k / s), nj = Math.ceil(b / s), nk = Math.ceil(c * k / s);
    for (let i = -ni; i < ni; i++) for (let j = -nj; j < nj; j++) for (let kk = -nk; kk < nk; kk++) {
      const x = (i + 0.5) * s, y = (j + 0.5) * s, z = (kk + 0.5) * s;
      if (shapeF(x, y, z, sh) > 1) continue;
      const surf = shapeF(x + s, y, z, sh) > 1 || shapeF(x - s, y, z, sh) > 1 || shapeF(x, y + s, z, sh) > 1 ||
        shapeF(x, y - s, z, sh) > 1 || shapeF(x, y, z + s, sh) > 1 || shapeF(x, y, z - s, sh) > 1;
      cubes.push({ L: new THREE.Vector3(x, y, z), surf });
    }
    let minY = Infinity, maxY = -Infinity;
    for (const cb of cubes) { cb.w0 = cb.L.clone().applyMatrix4(XS.mat); minY = Math.min(minY, cb.w0.y); maxY = Math.max(maxY, cb.w0.y); }
    for (const cb of cubes) {
      cb.r = 0.15 + 0.6 * (cb.w0.y - minY) / (maxY - minY + 1e-6) + 0.18 * rng();
      cb.est = cb.r + Math.sqrt(2 * Math.max(0.01, cb.w0.y - BOARD_TOP) / G);
    }
    const order = cubes.slice().sort((p, q) => p.est - q.est);
    const cell = 2 * s, hmap = new Map(), inc = (s * s * s) / (cell * cell) * 1.35, tol = 0.62 * cell;
    const hk = (i, j) => i * 100003 + j;
    const getH = (i, j) => hmap.get(hk(i, j)) || 0;
    const gauss = () => (rng() + rng() + rng() - 1.5) * 0.8;
    for (const cb of order) {
      let ix = Math.round((cb.w0.x * 1.12 + gauss() * 0.25) / cell), iz = Math.round((cb.w0.z * 1.0 + gauss() * 0.25 + 0.1) / cell);
      for (let step = 0; step < 60; step++) {
        const h = getH(ix, iz); let bi = ix, bj = iz, bh = h;
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
        const o = Math.floor(rng() * 8);
        for (let q = 0; q < 8; q++) { const [dx, dz] = nb[(q + o) % 8]; const hh = getH(ix + dx, iz + dz); if (hh < bh) { bh = hh; bi = ix + dx; bj = iz + dz; } }
        if (h - bh > tol) { ix = bi; iz = bj; } else break;
      }
      ix = clamp(ix, Math.floor(-3.4 / cell), Math.floor(3.4 / cell)); iz = clamp(iz, Math.floor(-2.0 / cell), Math.floor(2.2 / cell));
      const h = getH(ix, iz);
      cb.target = new THREE.Vector3((ix + (rng() - 0.5) * 0.7) * cell, BOARD_TOP + h + s * 0.5, (iz + (rng() - 0.5) * 0.7) * cell);
      hmap.set(hk(ix, iz), h + inc);
      cb.T = Math.sqrt(2 * Math.max(0.005, cb.w0.y - cb.target.y) / G);
      cb.Qf = new THREE.Quaternion().setFromEuler(new THREE.Euler((rng() - 0.5) * 0.5, rng() * 6.28, (rng() - 0.5) * 0.5));
      cb.tw = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5);
    }
    st.cubes = cubes; st.Q0 = XS.quat.clone();
    const imesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0 }), cubes.length);
    imesh.castShadow = true; imesh.receiveShadow = true; imesh.frustumCulled = false; imesh.visible = false;
    const cr = mulberry32(99);
    const sk1 = col(TH.skin.c1), sk2 = col(TH.skin.c2);
    cubes.forEach((cb, i) => {
      let cc = cb.surf ? sk1.clone().lerp(sk2, cr()) : interiorColor(cb.L, TH, cr);
      if (cb.surf && cr() < 0.5) cc = interiorColor(cb.L, TH, cr); // metade mostra a polpa
      cc.multiplyScalar(0.9 + 0.2 * cr());
      imesh.setColorAt(i, cc);
    });
    scene.add(imesh);
    st.imesh = imesh;
    let maxLand = 0;
    cubes.forEach((cb, i) => {
      const tl = st.ts + cb.r + cb.T; maxLand = Math.max(maxLand, tl);
      if (N < 1000 || i % 2 === 0) cue(t0 + tl, 'tap', { amp: N >= 1000 ? 0.07 : 0.12, pan: clamp(cb.target.x / 2.5, -1, 1), v: i % 5, grain: 1 });
    });
    cue(t0 + st.ts, 'squish', { amp: 0.6 });
    cue(t0 + st.ts + 0.1, 'rumble', { amp: N >= 1000 ? 0.5 : 0.4, dur: maxLand - st.ts });
    st.end = maxLand + 0.7;
  }
  return st;
}

// ---------------------------------------------------------------- setup
window.setupVideo = async function (opts) {
  await document.fonts.load("800 100px 'B2'");
  OPTS = Object.assign({ theme: 'abacate', stages: [1, 10, 100, 1000], lang: 'pt', seed: 1 }, opts || {});
  TH = THEMES[OPTS.theme];
  if (!TH) throw new Error('tema desconhecido: ' + OPTS.theme + ' (opções: ' + Object.keys(THEMES).join(', ') + ')');
  FGEO = buildFruitGeometry(TH.shape);
  BASEMAT = makeFruitMaterial(TH);
  if (!TH.lineColor) {
    const inner = col(TH.layers[TH.layers.length - 1].c); inner.lerp(new THREE.Color(1, 1, 1), 0.35);
    BASEMAT.uniforms.uLineColor.value.copy(inner);
  }
  if (OPTS.highlight) document.documentElement.style.setProperty('--hi', OPTS.highlight);
  const rng = mulberry32(hashStr(OPTS.theme) ^ (OPTS.seed * 7919));
  CUES = []; STAGES = [];
  INTRO_END = 1.6;
  let t = 0;
  OPTS.stages.forEach((N, i) => {
    const lead = i === 0 ? INTRO_END : 0;
    const st = buildStage(N, i, t, lead, rng);
    STAGES.push(st);
    t += st.end;
  });
  OUTRO_T0 = t;
  DURATION = t + 2.0;
  // intro / títulos
  cue(0.1, 'pop', { amp: 0.7 }); cue(0.45, 'pop', { amp: 0.55 }); cue(0.8, 'pop', { amp: 0.8 });
  STAGES.forEach((st, i) => { if (i > 0) cue(st.t0, 'pop', { amp: 0.6 }); });
  cue(OUTRO_T0 + 0.2, 'pop', { amp: 0.7 }); cue(OUTRO_T0 + 0.25, 'ding', { amp: 0.5 });
  CUES.sort((a, b) => a.t - b.t);
  return { duration: DURATION, cues: CUES, stages: STAGES.map(s => ({ N: s.N, t0: s.t0, end: s.t0 + s.end })) };
};

// ---------------------------------------------------------------- render one frame
const overlay = { h1: document.getElementById('h1'), vs: document.getElementById('vs'), h3: document.getElementById('h3'), cnt: document.getElementById('cnt'), outro: document.getElementById('outro') };
function popS(dt, dur = 0.3) { if (dt < 0) return 0; if (dt > dur) return 1; return 0.55 + 0.45 * easeOutBack(dt / dur); }
function setT(el, text, scale, opacity) {
  if (el.textContent !== text) el.textContent = text;
  el.style.transform = `translateX(-50%) scale(${scale})`;
  el.style.opacity = opacity;
}

const X = newX(), pPos = new THREE.Vector3(), pQ = new THREE.Quaternion();
window.renderAt = function (t) {
  // esconde tudo
  for (const st of STAGES) { st.whole.visible = false; st.pieces?.forEach(p => p.mesh.visible = false); if (st.imesh) st.imesh.visible = false; }
  bladePool.forEach(set => set.forEach(m => m.visible = false));
  blobs.forEach(b => b.visible = false);
  let blobI = 0;

  let si = STAGES.findIndex(s => t < s.t0 + s.end);
  const inOutro = si < 0;
  if (si < 0) si = STAGES.length - 1;
  const st = STAGES[si];
  const tau = inOutro ? st.end + 0.0001 : t - st.t0;

  objXform(st, Math.min(tau, st.ts), X);
  if (tau < st.ts) {
    // objeto inteiro com linhas de corte
    const m = st.whole; m.visible = true;
    setPieceMatrix(m, X.mat);
    const u = m.material.uniforms;
    let nl = 0;
    for (const L of st.lines) {
      if (t < L.t0 || nl >= MAXL) continue;
      const s = (t - L.t0) / L.dur;
      const thr = s >= 1 ? 99 : sweepX(s) + 0.4 + L.base;
      u.uLines.value[nl].copy(L.plane);
      u.uLineSweep.value[nl].set(L.vL.x, L.vL.y, L.vL.z, thr);
      nl++;
    }
    u.uNLines.value = nl;
    if (st.type === 'dice') {
      const k = st.cutTimes.filter(c => c <= tau).length;
      u.uGrid.value.set(st.s, k / st.N, 1);
      u.uGlow.value = Math.min(0.022, st.s * 0.16);
    }
    const b = getBlob(blobI++); b.visible = true;
    const sz = 2.4 * X.scale; b.position.set(0.15, BOARD_TOP + 0.003, -0.1); b.scale.set(sz, 1, sz * 0.75); b.material.opacity = 0.55;
  } else if (st.type !== 'dice') {
    const ts = tau - st.ts;
    for (const pc of st.pieces) {
      piecePose(pc, ts, pPos, pQ);
      tmpV.copy(pc.cL).negate().applyQuaternion(pQ).add(pPos);
      tmpM.compose(tmpV, pQ, ONE);
      pc.mesh.visible = true;
      setPieceMatrix(pc.mesh, tmpM);
      const b = getBlob(blobI++); b.visible = true;
      const h = Math.max(0, pPos.y - pc.yRest);
      const sz = (0.35 + pc.size * 2.0) * (1 + h * 0.3);
      b.position.set(pPos.x + 0.05, BOARD_TOP + 0.003 + blobI * 0.0002, pPos.z - 0.05); b.scale.set(sz, 1, sz * 0.8);
      b.material.opacity = 0.6 / (1 + h * 1.2);
    }
  } else {
    const ts = tau - st.ts, im = st.imesh; im.visible = true;
    const sc = new THREE.Vector3(st.s * 0.97, st.s * 0.97, st.s * 0.97);
    st.cubes.forEach((cb, i) => {
      const d = ts - cb.r;
      if (d <= 0) {
        pPos.copy(cb.w0);
        if (d > -0.15) { const a = (0.15 + d) / 0.15 * st.s * 0.12; pPos.x += Math.sin(t * 90 + i) * a; pPos.y += Math.cos(t * 77 + i * 1.3) * a; }
        pQ.copy(st.Q0);
      } else {
        const u = clamp(d / cb.T, 0, 1);
        pPos.x = lerp(cb.w0.x, cb.target.x, u); pPos.z = lerp(cb.w0.z, cb.target.z, u);
        pPos.y = Math.max(cb.target.y, cb.w0.y - 0.5 * G * d * d);
        const land = d - cb.T;
        if (land > 0 && land < 0.12) pPos.y += Math.sin(land / 0.12 * Math.PI) * st.s * 0.35;
        pQ.slerpQuaternions(st.Q0, cb.Qf, easeOutCubic(u));
      }
      tmpM.compose(pPos, pQ, sc);
      im.setMatrixAt(i, tmpM);
    });
    im.instanceMatrix.needsUpdate = true;
  }

  // facas
  let slot = 0;
  for (const sw of st.sweeps) {
    if (slot >= bladePool.length) break;
    const s = (t - sw.t0) / sw.dur;
    if (s < 0 || s > 1.25) continue;
    const set = bladePool[slot++];
    const Xb = new THREE.Vector3().crossVectors(sw.n, sw.v).normalize(), Yb = sw.v.clone().negate(), Zb = sw.n;
    GHOSTS.forEach((op, gi) => {
      const sg = s - gi * 0.07;
      if (sg < 0 || sg > 1) return;
      const fade = Math.min(1, sg * 5, (1 - sg) * 5);
      const m = set[gi]; m.visible = true;
      m.material.opacity = op * fade * (gi === 0 ? 0.92 : 1);
      const c = sw.p0.clone().add(sw.v.clone().multiplyScalar(sweepX(sg)));
      m.matrix.makeBasis(Xb, Yb, Zb).setPosition(c); m.matrixWorldNeedsUpdate = true;
    });
  }

  renderer.render(scene, camera);

  // ---- textos
  const tIntroLines = t < INTRO_END + 0.25;
  const firstLabel = label(STAGES[0].N), lastLabel = label(STAGES[STAGES.length - 1].N);
  if (inOutro) {
    const dt = t - OUTRO_T0;
    setT(overlay.h1, label(st.N), 1 - clamp(dt / 0.2, 0, 1) * 0.0, 1 - clamp(dt / 0.25, 0, 1));
    setT(overlay.cnt, overlay.cnt.textContent, 1, 1 - clamp(dt / 0.25, 0, 1));
    const q = OPTS.outro || (OPTS.lang === 'en' ? 'Which one was the most satisfying?' : 'Qual foi o mais satisfatório?');
    setT(overlay.outro, q, popS(dt - 0.2, 0.35), dt > 0.2 ? 1 : 0);
    setT(overlay.vs, '', 1, 0); setT(overlay.h3, '', 1, 0);
  } else {
    setT(overlay.outro, '', 1, 0);
    if (si === 0) setT(overlay.h1, firstLabel, popS(t - 0.1), 1);
    else setT(overlay.h1, label(st.N), popS(t - st.t0), 1);
    if (tIntroLines) {
      const fo = 1 - clamp((t - INTRO_END) / 0.25, 0, 1);
      setT(overlay.vs, 'VS', popS(t - 0.45), fo);
      setT(overlay.h3, OPTS.target || lastLabel, popS(t - 0.8), fo);
    } else { setT(overlay.vs, '', 1, 0); setT(overlay.h3, '', 1, 0); }
    if (st.type === 'dice' && !tIntroLines) {
      const k = st.cutTimes.filter(c => c <= tau).length;
      const first = st.cutTimes[0];
      setT(overlay.cnt, `${fmtN(k)} / ${fmtN(st.N)}`, 1, tau >= first - 0.05 ? 1 : 0);
    } else setT(overlay.cnt, '', 1, 0);
  }
  return true;
};

window.THEME_LIST = Object.keys(THEMES);
window.__ready = true;
window.__dbg = () => { const st = STAGES[0]; return st.pieces.map(p => ({ idx: p.mesh.geometry.index.count, vis: p.mesh.visible, pos: p.mesh.matrix.elements.slice(12,15).map(v=>+v.toFixed(2)), np: p.mesh.material.uniforms.uNP.value, pl: p.mesh.material.uniforms.uPlanes.value[0].toArray().map(v=>+v.toFixed(2)), yRest: p.yRest, frac: p.frac })); };
