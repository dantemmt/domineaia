import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { THEMES } from './themes.js';

// =====================================================================================
//  constantes / utilidades
// =====================================================================================
const W = 1080, H = 1920;
const MAXP = 32, MAXL = 32;
const BOARD_TOP = 0;
const FRUIT_Y = 1.85;
const G = 14;
const CAM0 = new THREE.Vector3(0, 3.1, 12.8), LOOK = new THREE.Vector3(0, 1.35, 0);
const PAT_SKIN = { speckle: 0, stripes: 1, dimple: 2, blush: 3, fuzzy: 4, swirl: 5, plain: 6, scales: 7, achenes: 8, veins: 9, sprinkles: 10, glossy: 11 };
const PAT_CAP = { plain: 0, segments: 1, seeds: 2, seedring: 3, swirl: 4, holes: 5, rings: 6, strata: 7, star: 8, radial: 9, fibers: 10 };
const PAT_CORE = { smooth: 0, wrinkled: 1, fibrous: 2 };

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
  const rr = (x * x + z * z) / (a * c);
  y += (sh.dent || 0) * b * Math.exp(-rr / 0.05) * Math.sign(y);
  const k = 1 + (sh.taper || 0) * y / b;
  const qx = x / k / a, qy = y / b, qz = z / k / c;
  return Math.pow(Math.pow(Math.abs(qx), e1) + Math.pow(Math.abs(qz), e1), e2 / e1) + Math.pow(Math.abs(qy), e2);
}

// =====================================================================================
//  renderer / cena
// =====================================================================================
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
camera.position.copy(CAM0); camera.lookAt(LOOK); camera.updateMatrixWorld(); camera.updateProjectionMatrix();

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
scene.environmentIntensity = 0.55;

const key = new THREE.DirectionalLight(0xfff4e6, 2.6);
key.position.set(-5.5, 9, 7);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -4.5, right: 4.5, top: 5, bottom: -3, near: 2, far: 30 });
key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015; key.shadow.radius = 4;
scene.add(key);
const rim = new THREE.DirectionalLight(0xb8c8ff, 2.2); rim.position.set(5, 4, -6); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffe2c4, 0.7); fill.position.set(6, 2, 6); scene.add(fill);
scene.add(new THREE.HemisphereLight(0x9aa3b5, 0x2a2220, 0.55));

// ---- tábua de madeira
function woodTexture() {
  const cw = 2048, ch = 1024, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d'), img = g.createImageData(cw, ch), r = mulberry32(7);
  const ph = Array.from({ length: 8 }, () => r() * 6.28);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const w = y * 0.05 + Math.sin(x * 0.0022 + ph[0]) * 6 + Math.sin(x * 0.006 + y * 0.002 + ph[1]) * 2.5;
    let v = 0.5 + 0.5 * Math.sin(w); v = Math.pow(v, 4);
    const fine = 0.5 + 0.5 * Math.sin(y * 0.55 + Math.sin(x * 0.015 + ph[2]) * 3);
    const n = (r() - 0.5) * 0.05;
    const t = clamp(v * 0.5 + fine * 0.13 + n, 0, 1);
    const i = (y * cw + x) * 4;
    img.data[i] = lerp(168, 104, t); img.data[i + 1] = lerp(112, 62, t); img.data[i + 2] = lerp(64, 32, t); img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}
const woodTex = woodTexture();
const board = new THREE.Mesh(new RoundedBoxGeometry(7.5, 0.42, 4.6, 4, 0.08),
  new THREE.MeshPhysicalMaterial({ map: woodTex, bumpMap: woodTex, bumpScale: 1.2, roughness: 0.7, clearcoat: 0.08, clearcoatRoughness: 0.6, envMapIntensity: 0.5 }));
board.position.set(0, BOARD_TOP - 0.21, 0.1);
board.receiveShadow = true;
scene.add(board);

// ---- sombras de contato (suaves, por baixo)
const blobTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(0,0,0,0.9)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(cv);
})();
const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const blobs = [];
function getBlob(i) {
  while (blobs.length <= i) {
    const m = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, color: 0x000000, toneMapped: false }));
    m.renderOrder = 1; scene.add(m); blobs.push(m);
  }
  return blobs[i];
}

// ---- faca (cutelo com cabo)
const knifeGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(-1.15, -0.28); s.lineTo(0.95, -0.28); s.quadraticCurveTo(1.22, -0.26, 1.25, 0.02); s.lineTo(1.25, 0.3); s.lineTo(-1.15, 0.3); s.lineTo(-1.15, -0.28);
  const hole = new THREE.Path(); hole.absarc(0.98, 0.17, 0.07, 0, Math.PI * 2, true); s.holes.push(hole);
  const blade = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.03, bevelSegments: 3, curveSegments: 24 });
  blade.translate(0, 0, -0.006);
  const bolster = new THREE.BoxGeometry(0.12, 0.22, 0.07).translate(-1.2, 0.12, 0);
  const handle = new RoundedBoxGeometry(0.95, 0.2, 0.11, 3, 0.05).translate(-1.72, 0.12, 0);
  const r1 = new THREE.CylinderGeometry(0.025, 0.025, 0.125, 12).rotateX(Math.PI / 2).translate(-1.5, 0.12, 0);
  const r2 = r1.clone().translate(-0.42, 0, 0);
  const ni = g => (g.index ? g.toNonIndexed() : g);
  const metal = mergeGeometries([blade, bolster, r1, r2].map(ni));
  return mergeGeometries([metal, ni(handle)], true);
})();
const GHOSTS = [1.0, 0.22, 0.09, 0.035];
const bladePool = [];
for (let i = 0; i < 4; i++) {
  bladePool.push(GHOSTS.map((op, gi) => {
    const mats = [
      new THREE.MeshPhysicalMaterial({ color: 0xf4f7fa, metalness: 1.0, roughness: 0.14, clearcoat: 0.6, envMapIntensity: 1.6, transparent: gi > 0, opacity: op, depthWrite: gi === 0 }),
      new THREE.MeshPhysicalMaterial({ color: 0x2a1710, roughness: 0.45, clearcoat: 0.5, transparent: gi > 0, opacity: op, depthWrite: gi === 0 }),
    ];
    const m = new THREE.Mesh(knifeGeo, mats);
    m.matrixAutoUpdate = false; m.visible = false; m.renderOrder = 3; m.castShadow = gi === 0; scene.add(m); return m;
  }));
}

// =====================================================================================
//  GLSL: biblioteca da fruta (forma, casca, polpa)
// =====================================================================================
const FRUIT_LIB = /* glsl */`
#define MAXP ${MAXP}
#define MAXL ${MAXL}
uniform vec3 uScale; uniform vec2 uExp; uniform float uTaper; uniform float uDent;
uniform vec3 uSkin1; uniform vec3 uSkin2; uniform vec3 uSkin3; uniform vec3 uSkin4;
uniform int uSkinPat; uniform float uSkinScale; uniform float uSkinRough; uniform float uSkinBump;
uniform vec3 uLayerC[5]; uniform float uLayerR[5]; uniform int uNLayer;
uniform int uCoreOn; uniform vec3 uCoreScale; uniform vec3 uCoreOff; uniform vec3 uCoreColor; uniform float uCoreRough; uniform int uCorePat;
uniform int uCapPat; uniform vec3 uCapAlt; uniform vec3 uCapAlt2; uniform float uCapRough; uniform float uSeg;
uniform float uSeedDens; uniform float uSeedSize; uniform float uCapBump;

float shapeF(vec3 p){
  float rr = (p.x*p.x + p.z*p.z) / (uScale.x*uScale.z);
  p.y += uDent * uScale.y * exp(-rr / 0.05) * sign(p.y);
  float k = 1.0 + uTaper * p.y / uScale.y; vec3 q = vec3(p.x / k, p.y, p.z / k) / uScale;
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
vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }

void skinMat(vec3 p, out vec3 base, out float rough, out float h){
  float n = fbm(p * uSkinScale * 0.7);
  rough = uSkinRough; h = 0.0;
  if(uSkinPat == 0){ // abacate: casca granulada
    float b = noise(p * uSkinScale * 3.2); float b2 = noise(p * uSkinScale * 7.0);
    float s = smoothstep(0.55, 0.8, noise(p * uSkinScale * 2.4 + 7.0));
    base = mix(uSkin1, uSkin2, n); base = mix(base, uSkin3, s * 0.65);
    h = b * 0.6 + b2 * 0.4; rough += (b - 0.5) * 0.3;
  } else if(uSkinPat == 1){ // melancia: listras
    float a = atan(p.z, p.x);
    float w = sin(a * 8.0 + (fbm(p * 2.5) - 0.5) * 6.0 + p.y * 1.2);
    base = mix(uSkin2, uSkin1, smoothstep(-0.25, 0.3, w)) * (0.85 + 0.3 * n);
    base = mix(base, uSkin3, smoothstep(0.65, 0.9, noise(p * 26.0)) * 0.2);
    h = n * 0.4 + noise(p * 40.0) * 0.15;
  } else if(uSkinPat == 2){ // cítricos: poros
    vec2 c = cellN(p * uSkinScale * 2.2);
    float pore = smoothstep(0.0, 0.42, c.x);
    base = mix(uSkin1, uSkin2, n) * (0.88 + 0.12 * pore);
    h = pore * 0.8 + n * 0.2; rough += (1.0 - pore) * 0.25;
  } else if(uSkinPat == 3){ // maçã/manga/pêssego: blush + estrias + lenticelas
    float a = atan(p.z, p.x);
    float st = noise(vec3(a * 9.0, p.y * 1.5, p.x * 0.5));
    float bl = smoothstep(0.3, 0.75, fbm(p * uSkinScale + vec3(0.0, p.y * 0.9, 0.0)));
    base = mix(uSkin1, uSkin2, bl);
    base = mix(base, uSkin3, smoothstep(0.55, 0.85, st) * 0.4 * (1.0 - bl * 0.6));
    vec2 c = cellN(p * 24.0);
    base = mix(base, uSkin3, (1.0 - smoothstep(0.05, 0.09, c.x)) * 0.45);
    h = n * 0.2 + (1.0 - smoothstep(0.05, 0.1, c.x)) * 0.2;
  } else if(uSkinPat == 4){ // kiwi: penugem
    float fz = noise(p * 120.0);
    base = mix(uSkin1, uSkin2, n) * (0.72 + 0.5 * fz); h = fz * 0.5 + n * 0.3;
  } else if(uSkinPat == 5){ // sabonete: mármore
    base = mix(uSkin1, uSkin2, smoothstep(0.35, 0.65, fbm(p * uSkinScale + fbm(p * 1.7) * 2.2))); h = noise(p * 30.0) * 0.05;
  } else if(uSkinPat == 7){ // pitaya: escamas
    vec2 c = cellN(p * vec3(2.6, 2.0, 2.6));
    float edge = smoothstep(0.3, 0.75, c.x);
    base = mix(uSkin1, uSkin2, edge * 0.8);
    float tip = smoothstep(0.62, 0.85, c.x) * step(0.35, c.y);
    base = mix(base, uSkin3, tip);
    base *= 0.9 + 0.15 * noise(p * 30.0);
    h = (1.0 - c.x) * 1.2 - tip * 0.3;
  } else if(uSkinPat == 8){ // morango: aquênios
    vec2 c = cellN(p * 7.0);
    float pit = 1.0 - smoothstep(0.1, 0.24, c.x); float seed = 1.0 - smoothstep(0.05, 0.085, c.x);
    base = mix(uSkin1, uSkin2, n * 0.8 + pit * 0.3); base = mix(base, uSkin3, seed);
    float top = smoothstep(0.78, 0.9, p.y / uScale.y);
    base = mix(base, uSkin4, top); rough = mix(rough, 0.6, top);
    h = -pit * 0.9 + seed * 0.8;
  } else if(uSkinPat == 9){ // cebola/beterraba: veios
    float a = atan(p.z, p.x);
    float v = abs(sin(a * 26.0 + fbm(p * 3.0) * 3.0));
    base = mix(uSkin1, uSkin2, n) * (0.82 + 0.25 * smoothstep(0.0, 0.25, v));
    base = mix(base, uSkin3, smoothstep(0.6, 0.85, noise(p * 6.0)) * 0.45);
    h = smoothstep(0.0, 0.3, v) * 0.4 + n * 0.3;
  } else if(uSkinPat == 10){ // bolo: confeitos
    vec2 c = cellN(p * 8.0);
    float sp = 1.0 - smoothstep(0.08, 0.12, c.x);
    vec3 sc = c.y < 0.2 ? vec3(0.95, 0.25, 0.45) : c.y < 0.4 ? vec3(0.25, 0.6, 0.95) : c.y < 0.6 ? vec3(1.0, 0.82, 0.2) : c.y < 0.8 ? vec3(0.45, 0.85, 0.4) : vec3(0.75, 0.45, 0.95);
    base = mix(mix(uSkin1, uSkin2, n), toLin(sc), sp);
    rough = mix(rough, 0.2, sp); h = sp * 0.7 + n * 0.25;
  } else if(uSkinPat == 11){ // liso brilhante
    base = mix(uSkin1, uSkin2, n * 0.6); h = n * 0.1;
  } else {
    base = mix(uSkin1, uSkin2, n * 0.6); h = n * 0.15;
  }
}

void capMat(vec3 p, out vec3 base, out float rough, out float h){
  float r = rhoF(p);
  base = uLayerC[0];
  for(int i = 1; i < 5; i++){ if(i < uNLayer){ base = mix(base, uLayerC[i], smoothstep(uLayerR[i] + 0.008, uLayerR[i] - 0.008, r)); } }
  float inner = uLayerR[uNLayer - 1];
  float n = fbm(p * 8.0);
  rough = uCapRough; h = n * 0.3 + noise(p * 45.0) * 0.15;
  base *= 0.92 + 0.14 * fbm(p * 5.0);
  if(r < inner){
    if(uCapPat == 1){ // gomos
      float a = atan(p.z, p.x) / 6.28318 * uSeg;
      float m = abs(fract(a) - 0.5) * 2.0;
      float mem = smoothstep(0.86, 0.97, m) * smoothstep(0.05, 0.15, length(p.xz) / uScale.x);
      vec2 v = cellN(vec3(a * 3.0, r * 12.0, p.y * 9.0));
      base *= 0.8 + 0.32 * smoothstep(0.0, 0.7, v.x);
      h = (1.0 - v.x) * 0.9 - mem * 0.5;
      base = mix(base, uCapAlt, mem);
    } else if(uCapPat == 2){ // sementes
      vec2 cl = cellN(p * uSeedDens * vec3(1.0, 0.8, 1.0));
      float sd = 1.0 - smoothstep(uSeedSize * 0.75, uSeedSize, cl.x);
      vec2 gr = cellN(p * 22.0);
      base *= 0.86 + 0.24 * smoothstep(0.0, 0.6, gr.x);
      h = (1.0 - gr.x) * 0.6;
      if(cl.y < (uSeedDens > 8.0 ? 0.85 : 0.5) && r > 0.2 && r < inner - 0.04){ base = mix(base, uCapAlt, sd); rough = mix(rough, 0.12, sd); h += sd * 1.2; }
    } else if(uCapPat == 3){ // kiwi
      float a = atan(p.z, p.x);
      float rays = smoothstep(0.55, 1.0, sin(a * 46.0 + noise(p * 5.0) * 2.0)) * smoothstep(0.62, 0.3, r) * smoothstep(0.18, 0.3, r);
      base = mix(base, base * 1.35 + 0.03, rays * 0.6);
      float ring = smoothstep(0.3, 0.34, r) * (1.0 - smoothstep(0.48, 0.53, r));
      vec2 cl = cellN(p * 17.0);
      float sd = 1.0 - smoothstep(0.12, 0.18, cl.x);
      if(ring > 0.5 && cl.y < 0.8){ base = mix(base, uCapAlt, sd); rough = mix(rough, 0.1, sd); h += sd; }
    } else if(uCapPat == 4){ // mármore
      base = mix(base, uCapAlt, smoothstep(0.42, 0.62, fbm(p * 2.2 + fbm(p * 1.3) * 2.6)) * 0.75);
    } else if(uCapPat == 5){ // queijo: furos
      vec2 cl = cellN(p * 2.8);
      float hole = 1.0 - smoothstep(0.16, 0.2, cl.x);
      if(cl.y < 0.55){ base = mix(base, uCapAlt * 0.55, hole); h -= hole * 1.5; rough = mix(rough, 0.25, hole); }
    } else if(uCapPat == 6){ // anéis (cebola/beterraba)
      float k = fract(r * uSeg + noise(p * 3.0) * 0.15);
      float edge = pow(k, 5.0);
      base = mix(uCapAlt2, uCapAlt, edge);
      base *= 0.92 + 0.14 * noise(p * 30.0);
      float mem = smoothstep(0.04, 0.0, k) + smoothstep(0.96, 1.0, k);
      base = mix(base, uCapAlt * 0.7, mem * 0.5);
      h = 1.0 - edge * 0.6 - mem;
    } else if(uCapPat == 7){ // bolo em camadas
      float y = p.y / uScale.y * 0.5 + 0.5;
      float f = y * uSeg; float band = floor(f); float fr = fract(f);
      bool cream = mod(band, 2.0) > 0.5;
      vec2 pc = cellN(p * 20.0); float pore = smoothstep(0.0, 0.45, pc.x);
      if(cream){
        base = uCapAlt * (0.95 + 0.08 * noise(p * 20.0)); rough = 0.35; h = n * 0.2;
        if(abs(fr - 0.5) < 0.16){ base = uCapAlt2 * (0.9 + 0.2 * noise(p * 15.0)); rough = 0.15; }
      } else { base *= 0.72 + 0.38 * pore; h = pore; }
    } else if(uCapPat == 8){ // maçã: estrela
      float rc = length(p.xz) / uScale.x; float a = atan(p.z, p.x);
      float lobe = 0.5 + 0.5 * cos(a * 5.0);
      float yy = abs(p.y / uScale.y);
      float coreR = (0.16 + 0.12 * lobe) * smoothstep(0.85, 0.3, yy);
      float inCore = smoothstep(coreR + 0.03, coreR, rc);
      base = mix(base, uCapAlt, inCore * 0.8);
      float seed = smoothstep(0.82, 0.97, lobe) * smoothstep(0.08, 0.03, abs(rc - 0.15)) * smoothstep(0.35, 0.12, yy);
      base = mix(base, uCapAlt2, seed); rough = mix(rough, 0.18, seed); h += seed - inCore * 0.3;
      float vr = abs(rc - 0.43 + 0.05 * lobe);
      base = mix(base, uCapAlt, smoothstep(0.012, 0.0, vr) * 0.5);
    } else if(uCapPat == 9){ // morango: miolo claro + fibras
      float a = atan(p.z, p.x);
      float centre = smoothstep(0.75, 0.2, r);
      float fib = noise(vec3(a * 14.0, r * 3.0, p.y * 2.0));
      base = mix(base, uCapAlt, centre * 0.85 * (0.8 + 0.4 * fib));
      base *= 0.88 + 0.22 * fib; h += fib * 0.4;
    } else if(uCapPat == 10){ // fibras (manga, pêssego)
      float fb = noise(p * vec3(26.0, 3.0, 26.0)); base *= 0.88 + 0.24 * fb; h += fb * 0.5;
      if(uCoreOn == 1){ float dc = length((p - uCoreOff) / uCoreScale); base = mix(base, uCapAlt, smoothstep(1.7, 1.0, dc) * 0.7); }
    }
  }
  if(uCoreOn == 1){
    float cr = length((p - uCoreOff) / uCoreScale);
    if(cr < 1.0){
      base = uCoreColor * (0.88 + 0.2 * noise(p * 9.0)); rough = uCoreRough; h = noise(p * 12.0) * 0.2;
      if(uCorePat == 1){ float w = abs(sin(fbm(p * 5.0) * 14.0)); base *= 0.65 + 0.45 * w; h = w * 1.2; }
      else if(uCorePat == 2){ float fb = noise(p * vec3(40.0, 4.0, 40.0)); base *= 0.85 + 0.25 * fb; h = fb * 0.7; }
      else { base *= 0.85 + 0.2 * smoothstep(1.0, 0.0, cr); }
    }
  }
}
`;

// ---------------------------------------------------------------- uniforms
function themeUniforms(th) {
  const L = th.layers;
  return {
    uScale: { value: new THREE.Vector3(...th.shape.scale) }, uExp: { value: new THREE.Vector2(...th.shape.exp) },
    uTaper: { value: th.shape.taper || 0 }, uDent: { value: th.shape.dent || 0 },
    uSkin1: { value: col(th.skin.c1) }, uSkin2: { value: col(th.skin.c2) }, uSkin3: { value: col(th.skin.c3 || th.skin.c2) }, uSkin4: { value: col(th.skin.c4 || th.skin.c1) },
    uSkinPat: { value: PAT_SKIN[th.skin.pattern] ?? 6 }, uSkinScale: { value: th.skin.scale ?? 4 },
    uSkinRough: { value: th.skin.rough ?? 0.4 }, uSkinBump: { value: th.skin.bump ?? 0.5 },
    uLayerC: { value: [0, 1, 2, 3, 4].map(i => col((L[i] || L[L.length - 1]).c)) },
    uLayerR: { value: [0, 1, 2, 3, 4].map(i => (L[i] ? L[i].r : 0)) }, uNLayer: { value: L.length },
    uCoreOn: { value: th.core ? 1 : 0 }, uCoreScale: { value: new THREE.Vector3(...(th.core?.scale || [0.1, 0.1, 0.1])) },
    uCoreOff: { value: new THREE.Vector3(...(th.core?.off || [0, 0, 0])) }, uCoreColor: { value: col(th.core?.c || '#ffffff') },
    uCoreRough: { value: th.core?.rough ?? 0.4 }, uCorePat: { value: PAT_CORE[th.core?.pattern] ?? 0 },
    uCapPat: { value: PAT_CAP[th.cap.pattern] ?? 0 }, uCapAlt: { value: col(th.cap.alt || '#ffffff') }, uCapAlt2: { value: col(th.cap.alt2 || th.cap.alt || '#ffffff') },
    uCapRough: { value: th.cap.rough ?? 0.35 }, uSeg: { value: th.cap.segments || 10 },
    uSeedDens: { value: th.cap.seedDens || 4 }, uSeedSize: { value: th.cap.seedSize || 0.12 }, uCapBump: { value: th.cap.bump ?? 0.5 },
  };
}
function pieceUniforms() {
  return {
    uPlanes: { value: Array.from({ length: MAXP }, () => new THREE.Vector4()) }, uNP: { value: 0 },
    uCamLocal: { value: new THREE.Vector3() }, uModelMat: { value: new THREE.Matrix4() }, uProj: { value: camera.projectionMatrix.clone() },
    uLines: { value: Array.from({ length: MAXL }, () => new THREE.Vector4()) },
    uLineSweep: { value: Array.from({ length: MAXL }, () => new THREE.Vector4()) }, uNLines: { value: 0 },
    uGrid: { value: new THREE.Vector3(0.1, 0, 0) }, uLineColor: { value: new THREE.Color() }, uGlow: { value: 0.02 },
  };
}

const BUMP_LIB = /* glsl */`
// relevo por derivadas de tela
vec3 bumpN(vec3 surfPos, vec3 N, float h, float amt){
  vec3 dpdx = dFdx(surfPos), dpdy = dFdy(surfPos);
  float dhx = dFdx(h) * amt, dhy = dFdy(h) * amt;
  vec3 r1 = cross(dpdy, N), r2 = cross(N, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * N - grad);
}

`;

const PIECE_DECL = /* glsl */`
uniform vec4 uPlanes[MAXP]; uniform int uNP;
uniform vec3 uCamLocal; uniform mat4 uModelMat; uniform mat4 uProj;
uniform vec4 uLines[MAXL]; uniform vec4 uLineSweep[MAXL]; uniform int uNLines;
uniform vec3 uGrid; uniform vec3 uLineColor; uniform float uGlow;
varying vec3 vLocal; varying vec3 vWorldP;
#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
#endif
vec2 lineMask(vec3 p){
  float m = 0.0, halo = 0.0, w = uGlow;
  for(int i = 0; i < MAXL; i++){
    if(i >= uNLines) break;
    vec4 L = uLines[i]; vec4 S = uLineSweep[i];
    float d = abs(dot(L.xyz, p) + L.w);
    if(dot(S.xyz, p) < S.w){ m = max(m, 1.0 - smoothstep(w * 0.25, w * 0.7, d)); halo = max(halo, 1.0 - smoothstep(w * 0.6, w * 2.2, d)); }
  }
  if(uGrid.z > 0.5){
    for(int a = 0; a < 3; a++){
      float cc = p[a] / uGrid.x; float id = floor(cc + 0.5); float d = abs(cc - id) * uGrid.x;
      if(hash31(vec3(id, float(a) * 7.1, 3.3)) < uGrid.y){ m = max(m, 1.0 - smoothstep(w * 0.2, w * 0.6, d)); halo = max(halo, 1.0 - smoothstep(w * 0.5, w * 1.6, d)); }
    }
  }
  return vec2(m, halo);
}
`;

const PIECE_INJECT = /* glsl */`
  for(int i = 0; i < MAXP; i++){ if(i >= uNP) break; vec4 P = uPlanes[i]; if(dot(P.xyz, vLocal) + P.w < 0.0) discard; }
  vec3 gVP = vViewPosition; vec3 gWorldP = vWorldP; vec3 gGeoN = normal;
  vec3 fBase; float fRough; float fH;
  if(gl_FrontFacing){
    skinMat(vLocal, fBase, fRough, fH);
    vec2 lm = lineMask(vLocal);
    fBase = mix(fBase * (1.0 - lm.y * 0.45), uLineColor, lm.x);
    totalEmissiveRadiance += uLineColor * (lm.x * 1.6 + lm.y * 0.12);
    normal = bumpN(-vViewPosition, normal, fH, uSkinBump * 0.06);
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
    vec3 Pw = (uModelMat * vec4(Pl, 1.0)).xyz;
    vec3 Pv = (viewMatrix * vec4(Pw, 1.0)).xyz;
    gVP = -Pv; gWorldP = Pw;
    gGeoN = normalize((viewMatrix * vec4(normalize(mat3(uModelMat) * (-nE)), 0.0)).xyz);
    capMat(Pl, fBase, fRough, fH);
    normal = bumpN(Pv, gGeoN, fH, uCapBump * 0.03);
    vec4 clip = uProj * vec4(Pv, 1.0);
    gl_FragDepth = (clip.z / clip.w) * 0.5 + 0.5;
  }
  nonPerturbedNormal = gGeoN;
  diffuseColor.rgb = fBase;
  roughnessFactor = clamp(fRough, 0.04, 1.0);
`;

function patchLights(chunk) {
  return chunk.replaceAll('vViewPosition', 'gVP')
    .replaceAll('vDirectionalShadowCoord[ i ]', '( directionalShadowMatrix[ i ] * vec4( gWorldP + ( vec4( gGeoN, 0.0 ) * viewMatrix ).xyz * directionalLightShadows[ i ].shadowNormalBias, 1.0 ) )');
}

let TU; // uniforms do tema
function physicalParams(th) {
  return {
    roughness: 0.5, metalness: 0,
    clearcoat: th.skin.clearcoat ?? 0.3, clearcoatRoughness: 0.22,
    sheen: th.skin.sheen ?? 0, sheenRoughness: 0.55, sheenColor: col(th.skin.sheenColor || '#ffffff'),
    specularIntensity: 0.7,
  };
}
function makePieceMaterial(th, PU) {
  const m = new THREE.MeshPhysicalMaterial({ ...physicalParams(th), side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TU, PU);
    sh.vertexShader = 'varying vec3 vLocal; varying vec3 vWorldP;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vLocal = transformed; vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = FRUIT_LIB + BUMP_LIB + PIECE_DECL + sh.fragmentShader
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + PIECE_INJECT)
      .replace('#include <clearcoat_normal_fragment_begin>', '#include <clearcoat_normal_fragment_begin>\n#ifdef USE_CLEARCOAT\n clearcoatNormal = gGeoN;\n#endif')
      .replace('#include <lights_fragment_begin>', patchLights(THREE.ShaderChunk.lights_fragment_begin));
  };
  m.customProgramCacheKey = () => 'fruit-piece';
  return m;
}
function makePieceDepthMaterial(PU) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uPlanes = PU.uPlanes; sh.uniforms.uNP = PU.uNP;
    sh.vertexShader = 'varying vec3 vLocal;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLocal = transformed;');
    sh.fragmentShader = `#define MAXP ${MAXP}\nuniform vec4 uPlanes[MAXP]; uniform int uNP; varying vec3 vLocal;\n` + sh.fragmentShader.replace('void main() {',
      'void main() {\n for(int i = 0; i < MAXP; i++){ if(i >= uNP) break; vec4 P = uPlanes[i]; if(dot(P.xyz, vLocal) + P.w < 0.0) discard; }');
  };
  m.customProgramCacheKey = () => 'fruit-depth';
  return m;
}
function makeCubeMaterial(th, cubeS, perVertex) {
  const m = new THREE.MeshPhysicalMaterial({ ...physicalParams(th), sheen: 0 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TU, { uCubeS: { value: cubeS } });
    if (perVertex) {
      sh.vertexShader = FRUIT_LIB + 'attribute vec3 aCenter; uniform float uCubeS; varying vec3 vCol; varying float vRgh;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
         vec3 vL = aCenter + position * uCubeS * 0.8; float hh;
         if(shapeF(vL) > 1.0) skinMat(vL, vCol, vRgh, hh); else capMat(vL, vCol, vRgh, hh);`);
      sh.fragmentShader = 'varying vec3 vCol; varying float vRgh;\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>',
        '#include <normal_fragment_maps>\n diffuseColor.rgb = vCol; roughnessFactor = clamp(vRgh, 0.04, 1.0);');
    } else {
      sh.vertexShader = 'attribute vec3 aCenter; uniform float uCubeS; varying vec3 vLocal;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n vLocal = aCenter + position * uCubeS;');
      sh.fragmentShader = FRUIT_LIB + BUMP_LIB + 'varying vec3 vLocal;\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 fBase; float fRough; float fH;
        if(shapeF(vLocal) > 1.0){ skinMat(vLocal, fBase, fRough, fH); normal = bumpN(-vViewPosition, normal, fH, uSkinBump * 0.05); }
        else { capMat(vLocal, fBase, fRough, fH); normal = bumpN(-vViewPosition, normal, fH, uCapBump * 0.025); }
        diffuseColor.rgb = fBase; roughnessFactor = clamp(fRough, 0.04, 1.0);`);
    }
  };
  m.customProgramCacheKey = () => 'fruit-cube' + (perVertex ? '-v' : '');
  return m;
}

function buildFruitGeometry(sh) {
  const g = new THREE.SphereGeometry(1, 200, 150);
  const pos = g.attributes.position, nor = g.attributes.normal, v = new THREE.Vector3();
  const e = 1e-3;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let lo = 0, hi = 4;
    for (let k = 0; k < 34; k++) { const m = (lo + hi) / 2; if (shapeF(v.x * m, v.y * m, v.z * m, sh) <= 1) lo = m; else hi = m; }
    const x = v.x * lo, y = v.y * lo, z = v.z * lo;
    pos.setXYZ(i, x, y, z);
    const gx = shapeF(x + e, y, z, sh) - shapeF(x - e, y, z, sh);
    const gy = shapeF(x, y + e, z, sh) - shapeF(x, y - e, z, sh);
    const gz = shapeF(x, y, z + e, sh) - shapeF(x, y, z - e, sh);
    const l = Math.hypot(gx, gy, gz) || 1;
    nor.setXYZ(i, gx / l, gy / l, gz / l);
  }
  g.deleteAttribute('uv');
  g.computeBoundingSphere();
  return g;
}

// =====================================================================================
//  estado
// =====================================================================================
let TH, FGEO, OPTS, STAGES = [], CUES = [], DURATION = 0, OUTRO_T0 = 0, INTRO_END = 0, LINE_COLOR;
const tmpM = new THREE.Matrix4(), tmpM2 = new THREE.Matrix4(), tmpV = new THREE.Vector3();
const ONE = new THREE.Vector3(1, 1, 1);
const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(4), type, ...o });
function fmtN(n) { return OPTS.lang === 'en' ? n.toLocaleString('en-US') : n.toLocaleString('pt-BR'); }
function label(n) { const w = OPTS.lang === 'en' ? (n === 1 ? 'Cut' : 'Cuts') : (n === 1 ? 'Corte' : 'Cortes'); return `${fmtN(n)} ${w}`; }

function objXform(st, tau, out) {
  const ry = st.rot0 + 0.5 * tau, rx = 0.12 * Math.sin(0.8 * tau + st.ph), rz = 0.07 * Math.sin(0.6 * tau);
  out.quat.setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
  out.pos.set(0, FRUIT_Y + 0.045 * Math.sin(1.4 * tau + st.ph), 0);
  const pt = tau - st.popAt;
  const s = pt < 0 ? 0.0001 : pt < 0.4 ? Math.max(0.0001, easeOutBack(pt / 0.4)) : 1;
  out.scale = s;
  out.mat.compose(out.pos, out.quat, new THREE.Vector3(s, s, s));
  return out;
}
const newX = () => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: 1, mat: new THREE.Matrix4() });

function makePieceMesh(geo = FGEO) {
  const PU = pieceUniforms();
  PU.uLineColor.value.copy(LINE_COLOR);
  const m = new THREE.Mesh(geo, makePieceMaterial(TH, PU));
  m.customDepthMaterial = makePieceDepthMaterial(PU);
  m.userData.U = PU;
  m.matrixAutoUpdate = false; m.frustumCulled = false; m.visible = false; m.renderOrder = 2;
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  return m;
}
function setPieceMatrix(mesh, M) {
  mesh.matrix.copy(M); mesh.matrixWorldNeedsUpdate = true;
  const u = mesh.userData.U;
  u.uModelMat.value.copy(M);
  tmpM2.copy(M).invert();
  u.uCamLocal.value.copy(camera.position).applyMatrix4(tmpM2);
}
function worldPlaneToLocal(n, q, X) {
  tmpM2.copy(X.mat).invert();
  const qL = q.clone().applyMatrix4(tmpM2);
  const nL = n.clone().applyQuaternion(X.quat.clone().invert()).normalize();
  return new THREE.Vector4(nL.x, nL.y, nL.z, -nL.dot(qL));
}
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
  return [...cells.values()].filter(e => e.n >= 4).map(e => {
    const cL = new THREE.Vector3(e.sx / e.n, e.sy / e.n, e.sz / e.n);
    const signs = []; let tmp = e.key;
    for (let i = planes.length - 1; i >= 0; i--) { signs[i] = tmp % 2; tmp = Math.floor(tmp / 2); }
    return { cL, frac: e.n / got, pts: e.pts.map(p => p.sub(cL)), signs };
  });
}
// pontos da casca perto de um plano local (para respingos)
function rimPoints(P, rng, n) {
  const pos = FGEO.attributes.position, out = [];
  for (let tries = 0; tries < 20000 && out.length < n; tries++) {
    const i = Math.floor(rng() * pos.count);
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (Math.abs(P.x * x + P.y * y + P.z * z + P.w) < 0.035) out.push(new THREE.Vector3(x, y, z));
  }
  return out;
}

// ---------------------------------------------------------------- física dos pedaços
function planPiece(pc, opt) {
  const { c0, v0, yRest, target, hold = 0, sep = new THREE.Vector3() } = opt;
  const s0 = c0.clone().add(sep);
  const y0 = Math.max(s0.y, yRest + 0.01);
  const vy = v0.y;
  const t1 = (vy + Math.sqrt(vy * vy + 2 * G * (y0 - yRest))) / G;
  const vImp = Math.abs(vy - G * t1);
  const vb = 0.24 * vImp, tb = 2 * vb / G;
  const K = t1 + 0.45 * tb + 0.06;
  let vx = v0.x, vz = v0.z;
  if (target) { vx = (target.x - s0.x) / K; vz = (target.z - s0.z) / K; }
  else {
    const fx = clamp(s0.x + vx * K, -1.55, 1.55), fz = clamp(s0.z + vz * K, -1.1, 1.3);
    vx = (fx - s0.x) / K; vz = (fz - s0.z) / K;
  }
  Object.assign(pc, { c0: c0.clone(), s0, sep: sep.clone(), hold, y0, vy, t1, vb, tb, vx, vz, yRest, settle: t1 + 0.35 });
}
function piecePose(pc, ts, outPos, outQ) {
  if (ts <= 0) { outPos.copy(pc.c0); outQ.copy(pc.Q0); return; }
  if (ts < pc.hold) { outPos.copy(pc.c0).addScaledVector(pc.sep, easeOutCubic(ts / pc.hold)); outQ.copy(pc.Q0); return; }
  ts -= pc.hold;
  const { s0, y0, vy, t1, vb, tb, vx, vz, yRest } = pc;
  let x, y, z;
  if (ts < t1) { x = s0.x + vx * ts; z = s0.z + vz * ts; y = y0 + vy * ts - 0.5 * G * ts * ts; }
  else if (ts < t1 + tb) { const d = ts - t1; x = s0.x + vx * t1 + 0.45 * vx * d; z = s0.z + vz * t1 + 0.45 * vz * d; y = yRest + vb * d - 0.5 * G * d * d; }
  else { const d = ts - t1 - tb, f = (1 - Math.exp(-5 * d)) / 5 * 0.3; x = s0.x + vx * (t1 + 0.45 * tb + f); z = s0.z + vz * (t1 + 0.45 * tb + f); y = yRest; }
  outPos.set(x, y, z);
  outQ.slerpQuaternions(pc.Q0, pc.Qf, easeOutCubic(clamp(ts / pc.settle, 0, 1)));
}
function restHeight(pts, Qf) {
  let mn = Infinity; const v = new THREE.Vector3();
  for (const p of pts) { v.copy(p).applyQuaternion(Qf); if (v.y < mn) mn = v.y; }
  return BOARD_TOP - mn;
}

// ---------------------------------------------------------------- respingos / farelos
const DROP_MAX = 3000;
let drops = [], dropMesh = null;
function initDrops() {
  const geo = TH.juice?.wet === false ? new THREE.DodecahedronGeometry(1, 0) : new THREE.IcosahedronGeometry(1, 1);
  const mat = new THREE.MeshPhysicalMaterial(TH.juice?.wet === false
    ? { roughness: 0.75, color: 0xffffff }
    : { roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, color: 0xffffff, specularIntensity: 1 });
  dropMesh = new THREE.InstancedMesh(geo, mat, DROP_MAX);
  dropMesh.frustumCulled = false; dropMesh.castShadow = false; dropMesh.receiveShadow = true;
  const c = col(TH.juice?.c || TH.layers[TH.layers.length - 1].c);
  for (let i = 0; i < DROP_MAX; i++) dropMesh.setColorAt(i, c.clone().multiplyScalar(0.85 + 0.3 * ((i * 7919) % 97) / 97));
  dropMesh.count = 0;
  scene.add(dropMesh);
}
function emitDrops(stage, t0, n, pts, center, sweepV, rng, speed = 1) {
  const wet = TH.juice?.wet !== false;
  for (let i = 0; i < n && drops.length < DROP_MAX; i++) {
    const p = pts[Math.floor(rng() * pts.length)];
    if (!p) return;
    const out = p.clone().sub(center).normalize();
    const v = out.multiplyScalar((0.8 + rng() * 2.0) * speed).addScaledVector(sweepV, (0.4 + rng() * 1.4) * speed);
    v.y += 0.6 + rng() * 1.6;
    const r = (wet ? 0.012 + rng() * 0.03 : 0.015 + rng() * 0.035);
    const t = t0 + rng() * 0.06;
    // tempo até a tábua
    const y0 = p.y - BOARD_TOP - r * 0.3;
    const tl = (v.y + Math.sqrt(v.y * v.y + 2 * G * Math.max(0, y0))) / G;
    const land = p.clone().addScaledVector(v, tl); land.y = BOARD_TOP;
    land.x = clamp(land.x, -3.5, 3.5); land.z = clamp(land.z, -2.0, 2.3);
    drops.push({ stage, t, p0: p.clone(), v, r, tl, land, rot: rng() * 6.28 });
    if (rng() < 0.5) cue(t + tl, 'drip', { amp: wet ? 0.12 + r * 3 : 0.08, pan: clamp(land.x / 2.5, -1, 1), v: i % 4 });
  }
}

// =====================================================================================
//  etapas
// =====================================================================================
function makeSweep(t0, dur, n, q, v, center) {
  const p0 = center.clone().sub(n.clone().multiplyScalar(n.dot(center.clone().sub(q))));
  return { t0, dur, n: n.clone(), p0, v: v.clone() };
}
const SWEEP_EXT = 2.6;
const sweepX = s => lerp(-SWEEP_EXT, SWEEP_EXT, easeInOutSine(clamp(s, 0, 1)));
function inPlaneDir(n, hint) { const v = hint.clone().sub(n.clone().multiplyScalar(hint.dot(n))); if (v.lengthSq() < 1e-4) v.set(0, 0, 1).sub(n.clone().multiplyScalar(n.z)); return v.normalize(); }

function buildStage(N, idx, t0, lead, rng) {
  const st = { N, idx, t0, lead, rot0: rng() * 6.28, ph: rng() * 6.28, popAt: idx === 0 ? 0.05 : 0.02, sweeps: [], lines: [] };
  st.type = N === 1 ? 'halves' : N <= 30 ? 'pieces' : 'dice';
  st.whole = makePieceMesh();
  const X = newX();
  const center = new THREE.Vector3(0, FRUIT_Y, 0);
  cue(t0 + st.popAt, 'whoosh', { amp: 0.4, dur: 0.32, pan: 0 });
  cue(t0 + st.popAt + 0.12, 'land', { amp: 0.35 });

  if (st.type === 'halves' || st.type === 'pieces') {
    const cutTimes = st.type === 'halves' ? [lead + 0.45] : Array.from({ length: N }, (_, i) => lead + 0.4 + i * 0.17);
    const dur = st.type === 'halves' ? 0.26 : 0.15;
    const planesL = [];
    cutTimes.forEach((tc, i) => {
      let n, q, v;
      if (st.type === 'halves') {
        n = new THREE.Vector3(1, 0.12, 0.75).normalize(); q = center.clone(); v = inPlaneDir(n, new THREE.Vector3(0.1, -1, 0));
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
      // respingos ao longo da linha de corte
      const rim = rimPoints(PL, rng, 60).map(p => p.applyMatrix4(X.mat));
      emitDrops(idx, sw.t0 + dur * 0.45, st.type === 'halves' ? 26 : 12, rim, center, v, rng);
      const big = st.type === 'halves';
      cue(sw.t0 - 0.03, 'shing', { amp: big ? 0.5 : 0.3, pan: clamp(-v.x, -1, 1) * 0.4 });
      cue(sw.t0, 'whoosh', { amp: big ? 0.65 : 0.45, dur: dur + 0.12, pan: clamp(-v.x, -1, 1) * 0.5 });
      cue(sw.t0 + dur * 0.42, 'slice', { amp: big ? 1.0 : 0.75, pan: (rng() - 0.5) * 0.4, v: i % 4 });
    });
    st.ts = cutTimes[cutTimes.length - 1] + (st.type === 'halves' ? 0.75 : 0.55);
    st.end = st.ts + (st.type === 'halves' ? 1.9 : 2.0);
    if (st.type === 'pieces') { cue(t0 + st.ts - 0.5, 'riser', { amp: 0.45, dur: 0.5 }); cue(t0 + st.ts, 'impact', { amp: 0.55 }); }
    const XS = objXform(st, st.ts, newX());
    const cells = sampleCells(planesL, rng);
    st.pieces = cells.map((cell, ci) => {
      const mesh = makePieceMesh(subGeometry(planesL, cell.signs));
      const u = mesh.userData.U;
      planesL.forEach((P, i) => { const s = cell.signs[i] ? 1 : -1; u.uPlanes.value[i].set(P.x * s, P.y * s, P.z * s, P.w * s); });
      u.uNP.value = planesL.length;
      const c0 = cell.cL.clone().applyMatrix4(XS.mat);
      const pc = { mesh, cL: cell.cL, Q0: XS.quat.clone(), size: Math.cbrt(cell.frac) };
      let Qf, target = null, v0, sep, hold;
      if (st.type === 'halves') {
        const s = cell.signs[0] ? 1 : -1;
        const nOut = new THREE.Vector3(planesL[0].x, planesL[0].y, planesL[0].z).multiplyScalar(-s);
        Qf = new THREE.Quaternion().setFromUnitVectors(nOut, new THREE.Vector3(0, 0.85, 1).normalize());
        const side = Math.sign(c0.x) || (s > 0 ? 1 : -1);
        target = new THREE.Vector3(side * 0.98, 0, side > 0 ? 0.15 : 0.45);
        v0 = new THREE.Vector3(0, 2.2, 0);
        sep = nOut.clone().negate().applyQuaternion(XS.quat).multiplyScalar(0.1); hold = 0.28;
      } else {
        let best = 0, bestCnt = -1;
        planesL.forEach((P, i) => {
          const s = cell.signs[i] ? 1 : -1; let cnt = 0;
          for (const p of cell.pts) { const d = s * (P.x * (p.x + cell.cL.x) + P.y * (p.y + cell.cL.y) + P.z * (p.z + cell.cL.z) + P.w); if (d < 0.06) cnt++; }
          if (cnt > bestCnt) { bestCnt = cnt; best = i; }
        });
        const P = planesL[best], s = cell.signs[best] ? 1 : -1;
        const nOut = new THREE.Vector3(P.x, P.y, P.z).multiplyScalar(-s);
        const up = cell.frac > 0.035 && rng() < 0.6;
        Qf = new THREE.Quaternion().setFromUnitVectors(nOut, up ? new THREE.Vector3(0, 0.8, 0.6).normalize() : new THREE.Vector3(0, -1, 0));
        Qf.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), up ? (rng() - 0.5) * 0.8 : rng() * 6.28));
        const dir = c0.clone().sub(center); dir.y = 0; if (dir.lengthSq() < 1e-4) dir.set(rng() - 0.5, 0, rng() - 0.5); dir.normalize();
        const sp = 0.9 + rng() * 1.3;
        v0 = new THREE.Vector3(dir.x * sp, 1.0 + rng() * 2.2, dir.z * sp * 0.7 + 0.25);
        sep = c0.clone().sub(center).normalize().multiplyScalar(0.07); hold = 0.16;
      }
      pc.Qf = Qf;
      planPiece(pc, { c0, v0, yRest: restHeight(cell.pts, Qf), target, sep, hold });
      const amp = clamp(0.25 + pc.size * 1.2, 0.2, 1);
      const tl = t0 + st.ts + hold + pc.t1;
      cue(tl, pc.size > 0.5 ? 'thud' : 'land', { amp, pan: clamp(c0.x / 2, -1, 1), v: ci % 5 });
      if (pc.tb > 0.03) cue(tl + pc.tb, 'tap', { amp: amp * 0.35, pan: clamp(c0.x / 2, -1, 1), v: (ci + 2) % 5 });
      return pc;
    });
    // respingos na separação
    const allRim = planesL.flatMap(P => rimPoints(P, rng, 20)).map(p => p.applyMatrix4(XS.mat));
    emitDrops(idx, t0 + st.ts + 0.05, st.type === 'halves' ? 20 : 45, allRim, center, new THREE.Vector3(0, 0.5, 0.4), rng, 1.2);
    cue(t0 + st.ts, 'squish', { amp: st.type === 'halves' ? 0.75 : 0.85 });
    cue(t0 + st.ts, 'whoosh', { amp: 0.35, dur: 0.35, pan: 0 });
  } else {
    // --------------------------------------------- cubinhos / purê
    const sh = TH.shape;
    let s = 0.33 * Math.pow(N, -0.27);
    const vol = (4 / 3) * Math.PI * sh.scale[0] * sh.scale[1] * sh.scale[2];
    s = Math.max(s, Math.cbrt(vol / 30000));
    st.s = s;
    const win = N >= 1000 ? 2.6 : 2.2, start = lead + 0.35;
    st.cutTimes = Array.from({ length: N }, (_, i) => start + win * Math.pow((i + 1) / N, 0.62));
    const dur = 0.11;
    st.cutTimes.forEach((tc, i) => {
      const a = i % 3;
      const nL = new THREE.Vector3(a === 0 ? 1 : 0, a === 1 ? 1 : 0, a === 2 ? 1 : 0);
      const off = Math.floor((rng() - 0.5) * 2 * sh.scale[a] / s) * s;
      objXform(st, tc, X);
      const n = nL.clone().applyQuaternion(X.quat);
      const q = new THREE.Vector3().setComponent(a, off).applyMatrix4(X.mat);
      const v = inPlaneDir(n, new THREE.Vector3((rng() - 0.5) * 2, -1, rng() - 0.5));
      const every = Math.max(1, Math.floor(N / 45));
      if (i % every === 0) {
        st.sweeps.push(makeSweep(t0 + tc - dur * 0.4, dur, n, q, v, center));
        const PL = new THREE.Vector4(nL.x, nL.y, nL.z, -off);
        emitDrops(idx, t0 + tc, N >= 1000 ? 4 : 6, rimPoints(PL, rng, 20).map(p => p.applyMatrix4(X.mat)), center, v, rng, 0.9);
        cue(t0 + tc - 0.05, 'shing', { amp: 0.14, pan: (rng() - 0.5) * 0.6 });
      }
      const dens = N >= 1000 ? 0.22 : 0.55;
      if (N < 1000 || i % 2 === 0) cue(t0 + tc, 'slice', { amp: dens * (0.7 + 0.3 * rng()), pan: (rng() - 0.5) * 0.8, v: i % 4 });
      if (i % Math.max(1, Math.floor(N / 40)) === 0) cue(t0 + tc - 0.04, 'whoosh', { amp: 0.16, dur: 0.14, pan: rng() - 0.5 });
    });
    const lastCut = st.cutTimes[st.cutTimes.length - 1];
    cue(t0 + lastCut + 0.05, 'chime', { amp: 0.5 });
    st.ts = start + win + 0.45;
    cue(t0 + st.ts - 0.42, 'riser', { amp: 0.5, dur: 0.42 });
    cue(t0 + st.ts, 'impact', { amp: 0.7 });
    // cubos
    const [a, b, c] = sh.scale, k = 1 + Math.abs(sh.taper || 0);
    const XS = objXform(st, st.ts, newX());
    const cubes = [];
    const ni = Math.ceil(a * k / s) + 1, nj = Math.ceil(b / s) + 1, nk = Math.ceil(c * k / s) + 1;
    for (let i = -ni; i < ni; i++) for (let j = -nj; j < nj; j++) for (let kk = -nk; kk < nk; kk++) {
      const x = (i + 0.5) * s, y = (j + 0.5) * s, z = (kk + 0.5) * s;
      if (shapeF(x, y, z, sh) > 1) continue;
      cubes.push({ L: new THREE.Vector3(x, y, z) });
    }
    let minY = Infinity, maxY = -Infinity;
    for (const cb of cubes) { cb.w0 = cb.L.clone().applyMatrix4(XS.mat); minY = Math.min(minY, cb.w0.y); maxY = Math.max(maxY, cb.w0.y); }
    for (const cb of cubes) {
      cb.r = 0.12 + 0.6 * (cb.w0.y - minY) / (maxY - minY + 1e-6) + 0.18 * rng();
      cb.est = cb.r + Math.sqrt(2 * Math.max(0.01, cb.w0.y - BOARD_TOP) / G);
    }
    const order = cubes.slice().sort((p, q) => p.est - q.est);
    const cell = 2 * s, hmap = new Map(), inc = (s * s * s) / (cell * cell) * 1.35, tol = 0.62 * cell;
    const hk = (i, j) => i * 100003 + j, getH = (i, j) => hmap.get(hk(i, j)) || 0;
    const gauss = () => (rng() + rng() + rng() - 1.5) * 0.8;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    for (const cb of order) {
      let ix = Math.round((cb.w0.x * 1.12 + gauss() * 0.25) / cell), iz = Math.round((cb.w0.z + gauss() * 0.25 + 0.1) / cell);
      for (let step = 0; step < 60; step++) {
        const h = getH(ix, iz); let bi = ix, bj = iz, bh = h;
        const o = Math.floor(rng() * 8);
        for (let q = 0; q < 8; q++) { const [dx, dz] = nb[(q + o) % 8]; const hh = getH(ix + dx, iz + dz); if (hh < bh) { bh = hh; bi = ix + dx; bj = iz + dz; } }
        if (h - bh > tol) { ix = bi; iz = bj; } else break;
      }
      ix = clamp(ix, Math.floor(-3.4 / cell), Math.floor(3.4 / cell)); iz = clamp(iz, Math.floor(-2.0 / cell), Math.floor(2.2 / cell));
      const h = getH(ix, iz);
      cb.target = new THREE.Vector3((ix + (rng() - 0.5) * 0.7) * cell, BOARD_TOP + h + s * 0.5, (iz + (rng() - 0.5) * 0.7) * cell);
      hmap.set(hk(ix, iz), h + inc);
      cb.T = Math.sqrt(2 * Math.max(0.005, cb.w0.y - cb.target.y) / G);
      cb.Qf = new THREE.Quaternion().setFromEuler(new THREE.Euler((rng() - 0.5) * 0.6, rng() * 6.28, (rng() - 0.5) * 0.6));
    }
    st.cubes = cubes; st.Q0 = XS.quat.clone();
    const lite = cubes.length > 12000;
    const geo = lite ? new THREE.BoxGeometry(1, 1, 1) : new RoundedBoxGeometry(1, 1, 1, 1, 0.12);
    const imesh = new THREE.InstancedMesh(geo, makeCubeMaterial(TH, s * 0.97, lite), cubes.length);
    const centers = new Float32Array(cubes.length * 3);
    cubes.forEach((cb, i) => { centers[i * 3] = cb.L.x; centers[i * 3 + 1] = cb.L.y; centers[i * 3 + 2] = cb.L.z; });
    geo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(centers, 3));
    imesh.castShadow = true; imesh.receiveShadow = true; imesh.frustumCulled = false; imesh.visible = false;
    scene.add(imesh);
    st.imesh = imesh;
    let maxLand = 0;
    cubes.forEach((cb, i) => {
      const tl = st.ts + cb.r + cb.T; maxLand = Math.max(maxLand, tl);
      if (N < 1000 || i % 2 === 0) cue(t0 + tl, 'tap', { amp: N >= 1000 ? 0.06 : 0.11, pan: clamp(cb.target.x / 2.5, -1, 1), v: i % 5, grain: 1 });
    });
    cue(t0 + st.ts, 'squish', { amp: 0.65 });
    cue(t0 + st.ts + 0.1, 'rumble', { amp: N >= 1000 ? 0.5 : 0.4, dur: maxLand - st.ts });
    st.end = maxLand + 0.75;
  }
  return st;
}

// =====================================================================================
//  setup
// =====================================================================================
window.setupVideo = async function (opts) {
  await Promise.all([document.fonts.load("900 100px 'Mont'"), document.fonts.load("800 60px 'Mont'"), document.fonts.load("40px 'Noto Color Emoji'", '👇🤤').catch(() => {})]);
  OPTS = Object.assign({ theme: 'pitaya', stages: [1, 10, 100, 1000], lang: 'pt', seed: 1 }, opts || {});
  TH = THEMES[OPTS.theme];
  if (!TH) throw new Error('tema desconhecido: ' + OPTS.theme + ' (opções: ' + Object.keys(THEMES).join(', ') + ')');
  FGEO = buildFruitGeometry(TH.shape);
  TU = themeUniforms(TH);
  LINE_COLOR = TH.lineColor ? col(TH.lineColor) : col(TH.layers[TH.layers.length - 1].c).lerp(new THREE.Color(1, 1, 1), 0.5);
  if (OPTS.highlight) document.documentElement.style.setProperty('--hi', OPTS.highlight);
  const rng = mulberry32(hashStr(OPTS.theme) ^ (OPTS.seed * 7919));
  CUES = []; STAGES = []; drops = [];
  initDrops();
  INTRO_END = 1.7;
  let t = 0;
  OPTS.stages.forEach((N, i) => {
    const st = buildStage(N, i, t, i === 0 ? INTRO_END : 0, rng);
    STAGES.push(st);
    t += st.end;
  });
  OUTRO_T0 = t;
  DURATION = t + 2.2;
  cue(0.1, 'pop', { amp: 0.7 }); cue(0.5, 'pop', { amp: 0.55 }); cue(0.85, 'pop', { amp: 0.85 }); cue(0.85, 'sparkle', { amp: 0.35 });
  STAGES.forEach((st, i) => { if (i > 0) { cue(st.t0, 'pop', { amp: 0.6 }); cue(st.t0, 'whoosh', { amp: 0.25, dur: 0.25, pan: 0 }); } });
  cue(OUTRO_T0 + 0.2, 'pop', { amp: 0.7 }); cue(OUTRO_T0 + 0.25, 'ding', { amp: 0.5 });
  CUES.sort((a, b) => a.t - b.t);
  return { duration: DURATION, cues: CUES, sound: TH.sound || 'juicy', stages: STAGES.map(s => ({ N: s.N, t0: s.t0, end: s.t0 + s.end })) };
};

// =====================================================================================
//  render de um quadro
// =====================================================================================
const ov = { h1: document.getElementById('h1'), vs: document.getElementById('vs'), h3: document.getElementById('h3'),
  cnt: document.getElementById('cnt'), cntTxt: document.getElementById('cntTxt'), bar: document.getElementById('bar'), outro: document.getElementById('outro') };
function popS(dt, dur = 0.32) { if (dt < 0) return 0; if (dt > dur) return 1; return 0.5 + 0.5 * easeOutBack(dt / dur); }
function setT(el, text, scale, opacity, rot = 0) {
  if (text !== null && el.dataset.text !== text) { el.dataset.text = text; el.textContent = text; }
  el.style.transform = `translateX(-50%) scale(${scale}) rotate(${rot}deg)`;
  el.style.opacity = opacity;
}

const X = newX(), pPos = new THREE.Vector3(), pQ = new THREE.Quaternion(), dQ = new THREE.Quaternion(), dS = new THREE.Vector3();
window.renderAt = function (t) {
  for (const st of STAGES) { st.whole.visible = false; st.pieces?.forEach(p => p.mesh.visible = false); if (st.imesh) st.imesh.visible = false; }
  bladePool.forEach(set => set.forEach(m => m.visible = false));
  blobs.forEach(b => b.visible = false);
  let blobI = 0;

  let si = STAGES.findIndex(s => t < s.t0 + s.end);
  const inOutro = si < 0;
  if (si < 0) si = STAGES.length - 1;
  const st = STAGES[si];
  const tau = inOutro ? st.end + 0.0001 : t - st.t0;

  // câmera: leve aproximação + tremida no impacto
  const prog = clamp(tau / st.end, 0, 1);
  camera.position.copy(CAM0).add(new THREE.Vector3(0, -0.15 * easeInOutSine(prog), -0.7 * easeInOutSine(prog)));
  const dts = tau - st.ts;
  if (dts > 0 && dts < 0.5 && st.type !== 'halves') {
    const a = 0.05 * Math.exp(-dts / 0.12) * (st.type === 'dice' ? 1 : 0.6);
    camera.position.x += Math.sin(dts * 90) * a; camera.position.y += Math.cos(dts * 70) * a;
  }
  camera.lookAt(LOOK); camera.updateMatrixWorld();

  objXform(st, Math.min(tau, st.ts), X);
  if (tau < st.ts) {
    const m = st.whole; m.visible = true;
    setPieceMatrix(m, X.mat);
    const u = m.userData.U;
    let nl = 0;
    for (const L of st.lines) {
      if (t < L.t0 || nl >= MAXL) continue;
      const s = (t - L.t0) / L.dur;
      u.uLines.value[nl].copy(L.plane);
      u.uLineSweep.value[nl].set(L.vL.x, L.vL.y, L.vL.z, s >= 1 ? 99 : sweepX(s) + 0.4 + L.base);
      nl++;
    }
    u.uNLines.value = nl;
    if (st.type === 'dice') {
      const k = st.cutTimes.filter(c => c <= tau).length;
      u.uGrid.value.set(st.s, k / st.N, 1);
      u.uGlow.value = Math.min(0.02, st.s * 0.15);
    }
    const b = getBlob(blobI++); b.visible = true;
    const sz = 2.0 * X.scale; b.position.set(0, BOARD_TOP + 0.003, 0); b.scale.set(sz, 1, sz * 0.7); b.material.opacity = 0.35;
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
      const sz = (0.3 + pc.size * 1.6) * (1 + h * 0.3);
      b.position.set(pPos.x, BOARD_TOP + 0.003 + blobI * 0.0002, pPos.z); b.scale.set(sz, 1, sz * 0.8);
      b.material.opacity = 0.45 / (1 + h * 1.5);
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

  // respingos da etapa atual
  let nd = 0;
  for (const d of drops) {
    if (d.stage !== si || t < d.t) continue;
    const a = t - d.t;
    if (a < d.tl) {
      pPos.copy(d.p0).addScaledVector(d.v, a); pPos.y -= 0.5 * G * a * a;
      const sp = 1 + Math.min(1.5, d.v.length() * 0.15);
      dS.set(d.r, d.r * sp, d.r);
      dQ.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tmpV.copy(d.v).setY(d.v.y - G * a).normalize());
    } else {
      const b = clamp((a - d.tl) / 0.08, 0, 1);
      pPos.copy(d.land); pPos.y = BOARD_TOP + d.r * lerp(0.5, 0.18, b);
      const flat = TH.juice?.wet === false ? 1 : lerp(1, 1.9, b);
      dS.set(d.r * flat, d.r * lerp(0.7, 0.25, b), d.r * flat);
      dQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), d.rot);
    }
    tmpM.compose(pPos, dQ, dS);
    dropMesh.setMatrixAt(nd++, tmpM);
  }
  dropMesh.count = nd;
  dropMesh.instanceMatrix.needsUpdate = true;

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
      const m = set[gi]; m.visible = fade > 0.02;
      const o = op * fade;
      m.material[0].opacity = o; m.material[1].opacity = o;
      m.material[0].transparent = m.material[1].transparent = o < 0.999;
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
    setT(ov.h1, label(st.N), 1, 1 - clamp(dt / 0.25, 0, 1));
    ov.cnt.style.opacity = 1 - clamp(dt / 0.25, 0, 1);
    const q = OPTS.outro || (OPTS.lang === 'en' ? 'Which one was the most satisfying?' : 'Qual foi o mais satisfatório?');
    setT(ov.outro, q, popS(dt - 0.2, 0.4), dt > 0.2 ? 1 : 0);
    setT(ov.vs, null, 1, 0); setT(ov.h3, null, 1, 0);
  } else {
    setT(ov.outro, null, 1, 0);
    if (si === 0) setT(ov.h1, firstLabel, popS(t - 0.1), 1, (1 - popS(t - 0.1)) * -6);
    else setT(ov.h1, label(st.N), popS(t - st.t0), 1, (1 - popS(t - st.t0)) * -6);
    if (tIntroLines) {
      const fo = 1 - clamp((t - INTRO_END) / 0.25, 0, 1);
      setT(ov.vs, 'VS', popS(t - 0.5), fo);
      setT(ov.h3, OPTS.target || lastLabel, popS(t - 0.85, 0.4), fo, (1 - popS(t - 0.85, 0.4)) * 8);
    } else { setT(ov.vs, null, 1, 0); setT(ov.h3, null, 1, 0); }
    if (st.type === 'dice' && !tIntroLines) {
      const k = st.cutTimes.filter(c => c <= tau).length;
      const txt = `${fmtN(k)} / ${fmtN(st.N)}`;
      if (ov.cntTxt.textContent !== txt) ov.cntTxt.textContent = txt;
      ov.bar.style.width = `${(k / st.N) * 100}%`;
      ov.cnt.classList.toggle('done', k >= st.N);
      const vis = tau >= st.cutTimes[0] - 0.15 ? 1 : 0;
      ov.cnt.style.opacity = vis;
      ov.cnt.style.transform = `translateX(-50%) scale(${popS(tau - st.cutTimes[0] + 0.15, 0.3) || 0.001})`;
    } else ov.cnt.style.opacity = 0;
  }
  return true;
};

window.THEME_LIST = Object.keys(THEMES);
window.__ready = true;
