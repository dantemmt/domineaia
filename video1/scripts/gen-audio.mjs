// Gera public/audio.wav 100% sintetizado (osciladores, ruído filtrado e envelopes).
// Música a 90 BPM em Lá menor + efeitos sincronizados com src/timeline.json.
// Normaliza para -14 LUFS (BS.1770, K-weighting com gating) com limiter suave.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/timeline.json'), 'utf8'));

const SR = 48000;
const DUR = T.durationInFrames / T.fps; // 63 s
const N = Math.round(SR * DUR);
const fr = (f) => f / T.fps; // frame -> segundos

// Barramentos estéreo
const music = [new Float32Array(N), new Float32Array(N)];
const sfx = [new Float32Array(N), new Float32Array(N)];

// PRNG determinístico
let seed = 1234567;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const db = (d) => Math.pow(10, d / 20);
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------- Biquad (RBJ) com frequência ajustável sem perder estado ----------
function biquad(type, f, q = 0.707) {
  let B0, B1, B2, A1, A2;
  const set = (freq) => {
    const w = (2 * Math.PI * Math.min(freq, SR * 0.45)) / SR;
    const c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
    let b0, b1, b2;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
    else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
    else { b0 = a; b1 = 0; b2 = -a; }
    const a0 = 1 + a;
    B0 = b0 / a0; B1 = b1 / a0; B2 = b2 / a0; A1 = (-2 * c) / a0; A2 = (1 - a) / a0;
  };
  set(f);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const fn = (x) => {
    const y = B0 * x + B1 * x1 + B2 * x2 - A1 * y1 - A2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
  fn.set = set;
  return fn;
}

// ---------- Envelope ----------
function env(t, dur, attack, release) {
  if (t < 0 || t > dur) return 0;
  const a = attack > 0 ? Math.min(1, t / attack) : 1;
  const r = release > 0 ? Math.min(1, (dur - t) / release) : 1;
  return a * r;
}

function write(bus, i, v, pan) {
  if (i < 0 || i >= N) return;
  const l = Math.cos(((pan + 1) * Math.PI) / 4), r = Math.sin(((pan + 1) * Math.PI) / 4);
  bus[0][i] += v * l * 1.414;
  bus[1][i] += v * r * 1.414;
}

// Tom: freq pode deslizar até freqEnd; decaimento exponencial opcional
function tone(bus, t0, dur, freq, amp, o = {}) {
  const { freqEnd = freq, attack = 0.005, decay = 0, release = 0.02, pan = 0, wave = 'sine', harm = null } = o;
  const s0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const p = k / n;
    const f = freq * Math.pow(freqEnd / freq, p);
    ph += (2 * Math.PI * f) / SR;
    let v;
    if (harm) { v = 0; for (let h = 0; h < harm.length; h++) v += harm[h] * Math.sin(ph * (h + 1)); }
    else if (wave === 'tri') v = (2 / Math.PI) * Math.asin(Math.sin(ph));
    else if (wave === 'sq') v = Math.tanh(4 * Math.sin(ph));
    else v = Math.sin(ph);
    let e = env(t, dur, attack, release);
    if (decay > 0) e *= Math.exp(-t / decay);
    write(bus, s0 + k, v * e * amp, pan);
  }
}

// Ruído filtrado
function noise(bus, t0, dur, amp, o = {}) {
  const { hp = 0, lp = 0, bp = 0, q = 1, bpEnd = bp, attack = 0.002, decay = 0, release = 0.01, pan = 0, mod = null } = o;
  const s0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  const fh = hp ? biquad('hp', hp) : null, fl = lp ? biquad('lp', lp) : null;
  const fb = bp ? biquad('bp', bp, q) : null;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    let v = rnd() * 2 - 1;
    if (bp) {
      if (bpEnd !== bp && k % 32 === 0) fb.set(bp * Math.pow(bpEnd / bp, k / n));
      v = fb(v) * 2;
    }
    if (fh) v = fh(v);
    if (fl) v = fl(v);
    let e = env(t, dur, attack, release);
    if (decay > 0) e *= Math.exp(-t / decay);
    if (mod) e *= mod(t);
    write(bus, s0 + k, v * e * amp, pan);
  }
}

// =====================================================================
// MÚSICA — 90 BPM, Lá menor
// =====================================================================
const BPM = 90, BEAT = 60 / BPM;
const S6 = [fr(T.scenes.s6[0]), fr(T.scenes.s6[1])];

// Ganho da música ao longo do tempo (cena 6 quase silêncio, final com fade)
function musicGain(t) {
  let g = 1;
  const duckIn = S6[0], duckOut = S6[1];
  if (t > duckIn - 0.3 && t < duckOut + 0.6) {
    const a = Math.min(1, (t - (duckIn - 0.3)) / 0.5);
    const b = Math.min(1, Math.max(0, (duckOut + 0.6 - t) / 0.8));
    g = 1 - 0.94 * Math.min(a, b);
  }
  if (t > 61) g *= Math.max(0, 1 - (t - 61) / 1.6);
  if (t < 0.4) g *= t / 0.4;
  return g;
}

// Pad grave contínuo em Lá menor (senoides levemente desafinadas + triângulo)
{
  const notes = [45, 48, 52, 57]; // A2 C3 E3 A3
  const lp = [biquad('lp', 900), biquad('lp', 900)];
  const phases = notes.map(() => [0, 0, 0]);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const g = musicGain(t);
    const lfo = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.11 * t);
    let L = 0, R = 0;
    notes.forEach((m, ni) => {
      const f = mtof(m);
      const ph = phases[ni];
      ph[0] += (2 * Math.PI * f * 0.997) / SR;
      ph[1] += (2 * Math.PI * f * 1.003) / SR;
      ph[2] += (2 * Math.PI * f) / SR;
      const a = ni === 3 ? 0.5 : 1;
      L += a * (Math.sin(ph[0]) + 0.3 * (2 / Math.PI) * Math.asin(Math.sin(ph[2])));
      R += a * (Math.sin(ph[1]) + 0.3 * (2 / Math.PI) * Math.asin(Math.sin(ph[2])));
    });
    music[0][i] += lp[0](L) * 0.06 * g * lfo;
    music[1][i] += lp[1](R) * 0.06 * g * lfo;
  }
}

// Drone grave (fica sozinho na cena 6)
{
  let p1 = 0, p2 = 0, p3 = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let g = 0.45;
    if (t > S6[0] - 0.3 && t < S6[1] + 0.5) g = 1.0; // cresce no dia 20
    if (t > 61) g *= Math.max(0, 1 - (t - 61) / 1.8);
    if (t < 0.5) g *= t / 0.5;
    p1 += (2 * Math.PI * 55) / SR; p2 += (2 * Math.PI * 55.4) / SR; p3 += (2 * Math.PI * 82.4) / SR;
    const v = (Math.sin(p1) + Math.sin(p2) + 0.35 * Math.sin(p3)) * 0.05 * g * (0.85 + 0.15 * Math.sin(2 * Math.PI * 0.2 * t));
    music[0][i] += v; music[1][i] += v;
  }
}

// Pulso de sub-grave em cada tempo + tique-taque em colcheias
for (let b = 0; b * BEAT < DUR; b++) {
  const t = b * BEAT;
  const g = musicGain(t);
  if (g < 0.02) continue;
  tone(music, t, 0.4, 62, 0.22 * g, { freqEnd: 42, attack: 0.004, decay: 0.12 });
  for (let e = 0; e < 2; e++) {
    const te = t + e * BEAT / 2;
    const ge = musicGain(te);
    if (ge < 0.02) continue;
    const tick = e === 0;
    noise(music, te, 0.03, 0.05 * ge, { bp: tick ? 3800 : 2900, q: 6, decay: 0.006, pan: tick ? -0.25 : 0.25 });
    tone(music, te, 0.03, tick ? 2400 : 1900, 0.015 * ge, { decay: 0.005, pan: tick ? -0.25 : 0.25 });
  }
}

// Piano a partir da cena 8: arpejo Am → F → C → G
{
  const start = fr(T.scenes.s8[0]);
  const chords = [
    [57, 64, 69, 72], // Am: A3 E4 A4 C5
    [53, 60, 65, 69], // F:  F3 C4 F4 A4
    [48, 55, 60, 64], // C:  C3 G3 C4 E4
    [55, 62, 67, 71], // G:  G3 D4 G4 B4
  ];
  const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
  const BAR = BEAT * 4;
  let bar = 0;
  const pianoHarm = [1, 0.45, 0.22, 0.12, 0.06];
  for (let t = start; t < 61; t += BAR, bar++) {
    const ch = chords[bar % 4];
    pattern.forEach((pi, k) => {
      const tt = t + k * BEAT / 2;
      if (tt >= 61) return;
      const amp = (k === 0 ? 0.11 : 0.075) * Math.min(1, (tt - start) / 1.5 + 0.35);
      tone(music, tt, 1.6, mtof(ch[pi]), amp, { attack: 0.004, decay: 0.45, release: 0.2, harm: pianoHarm, pan: (pi - 1.5) * 0.2 });
    });
    // baixo do acorde
    tone(music, t, BAR, mtof(ch[0] - 12), 0.06, { attack: 0.01, decay: 1.4, release: 0.3, harm: [1, 0.3] });
  }
  // acorde final em Lá menor, deixado soar com reverb
  [45, 57, 64, 69, 72].forEach((m, i) =>
    tone(music, 61 + i * 0.06, 2.0, mtof(m), 0.07, { attack: 0.004, decay: 0.9, release: 0.4, harm: pianoHarm, pan: (i - 2) * 0.2 }));
}

// =====================================================================
// EFEITOS SONOROS
// =====================================================================
const click = (t, amp = 0.5, pan = 0) => {
  noise(sfx, t, 0.02, amp, { hp: 2000, decay: 0.004, pan });
  tone(sfx, t, 0.02, 1800, amp * 0.4, { decay: 0.004, pan });
};
const impact = (t, amp = 1) => {
  tone(sfx, t, 1.6, 70, 0.9 * amp, { freqEnd: 32, attack: 0.002, decay: 0.45 });
  tone(sfx, t, 0.5, 140, 0.3 * amp, { freqEnd: 60, attack: 0.002, decay: 0.12 });
  noise(sfx, t, 0.5, 0.5 * amp, { lp: 400, attack: 0.001, decay: 0.08 });
  noise(sfx, t, 0.15, 0.15 * amp, { hp: 3000, decay: 0.03 });
};
const ding = (t, amp = 0.35) => {
  tone(sfx, t, 1.0, 1318.5, amp, { decay: 0.3, harm: [1, 0, 0.2] });
  tone(sfx, t + 0.11, 1.4, 1975.5, amp * 0.9, { decay: 0.4, harm: [1, 0, 0.15] });
};
const coin = (t, amp = 0.3, pan = 0) => {
  const f = 2600 + rnd() * 600;
  tone(sfx, t, 0.35, f, amp, { decay: 0.08, pan });
  tone(sfx, t, 0.35, f * 1.47, amp * 0.6, { decay: 0.06, pan });
  tone(sfx, t + 0.04, 0.3, f * 1.12, amp * 0.5, { decay: 0.05, pan });
  noise(sfx, t, 0.02, amp * 0.6, { hp: 4000, decay: 0.004, pan });
};
const register = (t, amp = 0.35, pan = 0) => {
  // caixa registradora curta: estalo mecânico + sininho + moeda
  noise(sfx, t, 0.04, amp * 0.8, { bp: 1200, q: 2, decay: 0.01, pan });
  tone(sfx, t, 0.05, 180, amp * 0.6, { decay: 0.015, pan });
  tone(sfx, t + 0.05, 0.6, 3520, amp * 0.55, { decay: 0.12, harm: [1, 0, 0.3], pan });
  coin(t + 0.03, amp * 0.6, pan);
};
const pop = (t, amp = 0.5, pan = 0) => {
  tone(sfx, t, 0.09, 700, amp, { freqEnd: 180, attack: 0.001, decay: 0.03, pan });
  noise(sfx, t, 0.02, amp * 0.3, { hp: 2500, decay: 0.004, pan });
};

// ---- CENA 1: lâmpada (cliques + zumbido) e impacto do texto
{
  const ons = T.s1.lampOn;
  ons.forEach(([a, b]) => {
    click(fr(a), 0.55);
    if (b < 9000) click(fr(b), 0.3);
  });
  // zumbido elétrico baixo, só quando a lâmpada está acesa
  const isOn = (t) => ons.some(([a, b]) => t >= fr(a) && t < fr(b));
  const s0 = Math.round(fr(ons[0][0]) * SR), s1 = Math.round(fr(T.scenes.s2[0]) * SR);
  const lp = biquad('lp', 1200);
  let ph = 0, lvl = 0;
  for (let i = s0; i < s1; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * 100) / SR;
    const target = isOn(t) ? 1 : 0;
    lvl += (target - lvl) * 0.01;
    const fade = Math.min(1, (fr(T.scenes.s2[0]) - t) / 0.3);
    const v = lp(Math.sin(ph) + 0.5 * Math.sin(ph * 3) + 0.3 * Math.sin(ph * 5) + 0.15 * (rnd() - 0.5));
    write(sfx, i, v * 0.05 * lvl * fade, 0);
  }
  impact(fr(T.s1.hookText), 1.0);
}

// ---- CENA 2: glitch digital curto
const glitch = (t, dur = 0.22, amp = 0.28) => {
  let tt = t;
  while (tt < t + dur) {
    const d = 0.012 + rnd() * 0.03;
    tone(sfx, tt, d, 200 + rnd() * 1800, amp * (0.5 + rnd() * 0.5), { wave: 'sq', attack: 0.001, release: 0.002, pan: rnd() * 1.2 - 0.6 });
    if (rnd() > 0.5) noise(sfx, tt, d, amp * 0.6, { hp: 1500, attack: 0.001, release: 0.002 });
    tt += d + rnd() * 0.01;
  }
};
T.s2.glitches.forEach((f, i) => glitch(fr(f), i === 0 ? 0.22 : 0.15));

// ---- CENA 3: ding + tique-taque acelerado do contador + cintilante
{
  ding(fr(T.s3.notif), 0.32);
  const a = fr(T.s3.counterStart), b = fr(T.s3.counterEnd);
  let t = a, gap = 0.16;
  while (t < b) {
    click(t, 0.22, rnd() * 0.4 - 0.2);
    tone(sfx, t, 0.03, 1200 + (t - a) / (b - a) * 900, 0.07, { decay: 0.008 });
    t += gap;
    gap = Math.max(0.045, gap * 0.93);
  }
  // cintilante
  const s = fr(T.s3.shimmer);
  for (let k = 0; k < 18; k++) {
    tone(sfx, s + k * 0.035, 0.9, 2000 + rnd() * 4500, 0.05, { decay: 0.25, pan: rnd() * 1.6 - 0.8 });
  }
  tone(sfx, s, 1.5, 1760, 0.07, { decay: 0.5 });
  tone(sfx, s, 1.5, 2637, 0.05, { decay: 0.5 });
}

// ---- CENA 4: batida de coração acelerando + whoosh ascendente
{
  const a = fr(T.s4.heartStart), b = fr(T.s4.heartEnd);
  let t = a, gap = 0.9, k = 0;
  while (t < b - 0.2) {
    const amp = 0.55 + 0.35 * ((t - a) / (b - a));
    tone(sfx, t, 0.22, 75, amp, { freqEnd: 45, attack: 0.004, decay: 0.07 });
    tone(sfx, t + 0.16, 0.22, 65, amp * 0.65, { freqEnd: 40, attack: 0.004, decay: 0.06 });
    noise(sfx, t, 0.05, amp * 0.12, { lp: 300, decay: 0.02 });
    t += gap; k++;
    gap = Math.max(0.38, gap * 0.9);
  }
  noise(sfx, fr(T.s4.whoosh), 1.3, 0.35, { bp: 250, bpEnd: 4200, q: 1.8, attack: 0.8, release: 0.45 });
  tone(sfx, fr(T.s4.whoosh), 1.3, 180, 0.06, { freqEnd: 900, attack: 0.8, release: 0.4 });
}

// ---- CENA 5: gastos (registradora/moeda cada vez mais rápida) + contador descendo
{
  const spends = T.s5.spends;
  spends.forEach((s, i) => {
    const t = fr(s.f);
    register(t, 0.32 + i * 0.01, (i % 2 ? 0.35 : -0.35));
    // contador descendo: blips descendentes durante a queda (8 frames)
    for (let k = 0; k < 5; k++) tone(sfx, t + 0.05 + k * 0.045, 0.05, 900 - k * 110, 0.07, { decay: 0.015 });
  });
  // drenagem final até R$ 1
  const a = fr(T.s5.drainStart), b = fr(T.s5.drainEnd);
  tone(sfx, a, b - a + 0.25, 700, 0.12, { freqEnd: 90, attack: 0.02, release: 0.15, wave: 'tri' });
  for (let t = a, k = 0; t < b; t += 0.04, k++) tone(sfx, t, 0.035, 900 - k * 40, 0.05, { decay: 0.01 });
}

// ---- CENA 6: folhas virando + desligar elétrico + drone grave
{
  const a = T.s6.flipStart, b = T.s6.flipEnd, n = 15;
  for (let k = 0; k < n; k++) {
    const p = k / (n - 1);
    const f = a + (b - a) * (1 - Math.pow(1 - p, 1.6)); // mesma curva do vídeo
    noise(sfx, fr(f), 0.07, 0.22, { bp: 2500 + rnd() * 1500, q: 0.9, attack: 0.004, decay: 0.02, pan: 0.4 });
    noise(sfx, fr(f) + 0.015, 0.05, 0.1, { lp: 900, decay: 0.015, pan: 0.4 });
  }
  T.s6.lampFlicker.forEach((f) => click(fr(f), 0.3));
  const off = fr(T.s6.lampOff);
  click(off, 0.6);
  tone(sfx, off, 0.8, 420, 0.22, { freqEnd: 35, attack: 0.002, decay: 0.25, wave: 'tri' });
  noise(sfx, off, 0.35, 0.12, { lp: 800, decay: 0.1 });
  // drone grave extra
  tone(sfx, fr(T.scenes.s6[0]), 4.3, 41.2, 0.25, { attack: 1.0, release: 1.2, harm: [1, 0.4, 0.15] });
}

// ---- CENA 7: risco do traço + impacto de revelação
{
  const a = fr(T.s7.boxStart), b = fr(T.s7.boxEnd);
  noise(sfx, a, b - a, 0.3, { bp: 3200, q: 1.5, attack: 0.03, release: 0.05, mod: (t) => 0.55 + 0.45 * Math.abs(Math.sin(t * 37 + Math.sin(t * 11) * 3)) });
  noise(sfx, a, b - a, 0.1, { bp: 900, q: 1, attack: 0.03, release: 0.05 });
  const r = fr(T.s7.reveal);
  impact(r, 0.9);
  [57, 60, 64, 69].forEach((m, i) => tone(sfx, r, 2.2, mtof(m + 12), 0.04, { attack: 0.01, decay: 0.8, pan: (i - 1.5) * 0.3 }));
  pop(fr(T.s7.sub), 0.18);
}

// ---- CENA 8: ding + moedas entrando no cofre + clique do cofre fechando
{
  ding(fr(T.s8.notif), 0.3);
  const a = fr(T.s8.coinsStart), b = fr(T.s8.coinsEnd);
  for (let t = a + 0.12, k = 0; t < b + 0.1; t += 0.07 + rnd() * 0.05, k++) coin(t, 0.22, 0.4);
  const c = fr(T.s8.vaultClose);
  tone(sfx, c, 0.3, 110, 0.6, { freqEnd: 60, attack: 0.002, decay: 0.06 });
  noise(sfx, c, 0.05, 0.4, { bp: 1800, q: 3, decay: 0.008, pan: 0.4 });
  noise(sfx, c + 0.07, 0.05, 0.35, { bp: 2400, q: 3, decay: 0.008, pan: 0.4 });
  pop(fr(T.s8.bold), 0.2);
}

// ---- CENA 9: dois pops + impacto
{
  pop(fr(T.s9.left), 0.55, -0.5);
  pop(fr(T.s9.right), 0.55, 0.5);
  for (let t = fr(T.s9.growStart), k = 0; t < fr(T.s9.growEnd); t += 0.32, k++) coin(t, 0.1, 0.5);
  impact(fr(T.s9.final), 0.85);
}

// ---- CENA 10: papel + teclas de máquina de escrever sincronizadas
{
  noise(sfx, fr(T.s10.noteFall), 0.65, 0.28, { bp: 1800, q: 0.8, attack: 0.05, release: 0.2, mod: (t) => 0.4 + 0.6 * Math.abs(Math.sin(t * 23)) });
  noise(sfx, fr(T.s10.noteLand), 0.12, 0.25, { bp: 1200, q: 1, decay: 0.03 });
  const txt = T.s10.typeText;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    const t = fr(T.s10.typeStart + Math.round(i * T.s10.framesPerChar));
    if (ch === ' ') continue;
    if (ch === '\n') {
      noise(sfx, t, 0.12, 0.2, { bp: 900, q: 1.2, attack: 0.01, decay: 0.05 });
      continue;
    }
    const amp = 0.28 + rnd() * 0.1;
    noise(sfx, t, 0.025, amp, { hp: 1500, decay: 0.005, pan: rnd() * 0.4 - 0.2 });
    tone(sfx, t, 0.04, 160 + rnd() * 60, amp * 0.6, { decay: 0.01 });
  }
  // sininho de fim de linha
  const endT = fr(T.s10.typeStart + Math.round(txt.length * T.s10.framesPerChar)) + 0.05;
  tone(sfx, endT, 1.0, 2637, 0.14, { decay: 0.3, harm: [1, 0, 0.3] });
}

// ---- CENA 11: tic por pílula + impacto final suave
{
  click(fr(T.s11.pill1), 0.4, -0.3);
  tone(sfx, fr(T.s11.pill1), 0.06, 2800, 0.12, { decay: 0.015, pan: -0.3 });
  click(fr(T.s11.pill2), 0.4, 0.3);
  tone(sfx, fr(T.s11.pill2), 0.06, 3200, 0.12, { decay: 0.015, pan: 0.3 });
  pop(fr(T.s11.text), 0.25);
  impact(fr(T.s11.impact), 0.55);
}

// pequenos "pops" nas entradas de texto de topo (sutil)
['s3', 's4', 's5', 's6', 's8', 's10'].forEach((k) => pop(fr(T[k].text), 0.1));

// =====================================================================
// REVERB (Schroeder) e MIX
// =====================================================================
function reverb(input, wet, roomScale = 1, offset = 0) {
  const scale = SR / 44100 * roomScale;
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => Math.round((d + offset) * scale));
  const aps = [225, 556].map((d) => Math.round((d + offset) * scale));
  const out = new Float32Array(N);
  const fb = 0.83, damp = 0.25;
  const cbufs = combs.map((d) => ({ buf: new Float32Array(d), i: 0, lp: 0 }));
  const abufs = aps.map((d) => ({ buf: new Float32Array(d), i: 0 }));
  for (let n = 0; n < N; n++) {
    const x = input[n] * 0.12;
    let s = 0;
    for (const c of cbufs) {
      const y = c.buf[c.i];
      c.lp = y * (1 - damp) + c.lp * damp;
      c.buf[c.i] = x + c.lp * fb;
      c.i = (c.i + 1) % c.buf.length;
      s += y;
    }
    for (const a of abufs) {
      const b = a.buf[a.i];
      const y = -s + b;
      a.buf[a.i] = s + b * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      s = y;
    }
    out[n] = s * wet;
  }
  return out;
}

const MUSIC_GAIN = db(-18 + 9); // música ~9 dB abaixo dos efeitos
const SFX_GAIN = db(0);
const out = [new Float32Array(N), new Float32Array(N)];
for (let c = 0; c < 2; c++) {
  const mRev = reverb(music[c], 0.35, 1.1, c * 23);
  const sRev = reverb(sfx[c], 0.25, 0.9, c * 23);
  for (let i = 0; i < N; i++) {
    out[c][i] = (music[c][i] + mRev[i]) * MUSIC_GAIN * db(-9) + (sfx[c][i] + sRev[i]) * SFX_GAIN;
  }
}

// =====================================================================
// LOUDNESS (-14 LUFS) + LIMITER SUAVE
// =====================================================================
function kweight(x) {
  // coeficientes BS.1770 para 48 kHz
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const b = [1.53512485958697, -2.69169618940638, 1.19839281085285], a = [-1.69065929318241, 0.73248077421585];
  for (let n = 0; n < x.length; n++) {
    const v = b[0] * x[n] + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2;
    x2 = x1; x1 = x[n]; y2 = y1; y1 = v; y[n] = v;
  }
  x1 = x2 = y1 = y2 = 0;
  const a2 = [-1.99004745483398, 0.99007225036621];
  for (let n = 0; n < x.length; n++) {
    const xi = y[n];
    const v = xi - 2 * x1 + x2 - a2[0] * y1 - a2[1] * y2;
    x2 = x1; x1 = xi; y2 = y1; y1 = v; y[n] = v;
  }
  return y;
}
function lufs(ch) {
  const k = ch.map(kweight);
  const blk = Math.round(0.4 * SR), hop = Math.round(0.1 * SR);
  const ms = [];
  for (let s = 0; s + blk <= N; s += hop) {
    let sum = 0;
    for (const c of k) for (let i = s; i < s + blk; i++) sum += c[i] * c[i];
    ms.push(sum / blk);
  }
  const L = (z) => -0.691 + 10 * Math.log10(z);
  const abs = ms.filter((z) => L(z) > -70);
  const rel = L(abs.reduce((p, z) => p + z, 0) / abs.length) - 10;
  const gated = abs.filter((z) => L(z) > rel);
  return L(gated.reduce((p, z) => p + z, 0) / gated.length);
}
function limit(ch, ceiling = db(-1.0)) {
  // limiter suave com lookahead (5 ms) e release (80 ms) + saturação tanh como rede de segurança
  const look = Math.round(0.005 * SR), rel = Math.exp(-1 / (0.08 * SR));
  let g = 1;
  const outCh = ch.map(() => new Float32Array(N));
  for (let i = 0; i < N; i++) {
    let peak = 0;
    const j = Math.min(N - 1, i + look);
    for (const c of ch) peak = Math.max(peak, Math.abs(c[j]));
    const target = peak > ceiling ? ceiling / peak : 1;
    g = target < g ? g + (target - g) * 0.5 : target + (g - target) * rel;
    for (let c = 0; c < ch.length; c++) {
      const v = ch[c][i] * g;
      outCh[c][i] = ceiling * Math.tanh(v / ceiling);
    }
  }
  return outCh;
}

let mix = out;
let current = lufs(mix);
console.log('Loudness inicial:', current.toFixed(2), 'LUFS');
let gain = db(-14 - current);
let final;
for (let it = 0; it < 3; it++) {
  final = limit(mix.map((c) => c.map((v) => v * gain)));
  const l = lufs(final);
  console.log(`  iteração ${it + 1}: ${l.toFixed(2)} LUFS`);
  if (Math.abs(l + 14) < 0.15) break;
  gain *= db(-14 - l);
}
let pk = 0;
for (const c of final) for (const v of c) pk = Math.max(pk, Math.abs(v));
console.log('Pico final:', (20 * Math.log10(pk)).toFixed(2), 'dBFS');

// =====================================================================
// WAV 16-bit estéreo
// =====================================================================
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  for (let c = 0; c < 2; c++) {
    let d = (rnd() - rnd()) / 32768; // dither TPDF
    const v = Math.max(-1, Math.min(1, final[c][i] + d));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 4 + c * 2);
  }
}
const outPath = path.join(__dirname, '../public/audio.wav');
fs.writeFileSync(outPath, buf);
console.log('OK ->', outPath, `(${DUR}s, ${SR} Hz)`);
