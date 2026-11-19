// Gera public/audio.wav 100% sintetizado (osciladores, ruído filtrado e envelopes).
// Música a 92 BPM em Dó menor + efeitos sincronizados com src/timeline.json.
// Normaliza para -14 LUFS (BS.1770, K-weighting com gating) com limiter suave.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/timeline.json'), 'utf8'));

const SR = 48000;
const DUR = T.durationInFrames / T.fps; // 63 s
const N = Math.round(SR * DUR);
const fr = (f) => f / T.fps; // frame -> segundos
const END_T = DUR - 2.4; // início do acorde final / fade da música

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
// MÚSICA — 92 BPM, Dó menor (suspense), piano de alívio na virada
// =====================================================================
const BPM = 92, BEAT = 60 / BPM;
const smooth = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const ANS = fr(T.s4.reveal);
const S9 = fr(T.scenes.s9[0]);
const S7 = [fr(T.scenes.s7[0]), fr(T.scenes.s7[1])];

function musicGain(t) {
  let g = 1;
  g *= 1 - 0.9 * smooth(t, ANS - 1.0, ANS - 0.2) * (1 - smooth(t, ANS, ANS + 0.3));
  if (t > END_T) g *= Math.max(0, 1 - (t - END_T) / 1.6);
  if (t < 0.4) g *= t / 0.4;
  return g;
}

{
  const notes = [36, 39, 43, 48]; // C2 Eb2 G2 C3
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

// sub-grave por tempo + tique-taque até a revelação + pulso de alerta na cena 7
for (let b = 0; b * BEAT < DUR; b++) {
  const t = b * BEAT;
  const g = musicGain(t);
  if (g < 0.02) continue;
  tone(music, t, 0.45, 58, 0.24 * g, { freqEnd: 40, attack: 0.004, decay: 0.12 });
  if (t < ANS - 1) {
    for (let e = 0; e < 2; e++) {
      const te = t + (e * BEAT) / 2;
      noise(music, te, 0.03, 0.05 * g, { bp: e ? 2900 : 3800, q: 6, decay: 0.006, pan: e ? 0.25 : -0.25 });
    }
  }
  if (t >= S7[0] && t < S7[1]) tone(music, t, BEAT * 0.9, mtof(24), 0.14 * g, { attack: 0.01, decay: 0.35, harm: [1, 0.5, 0.33, 0.25] });
}

// Piano da cena 9 em diante: Cm → Ab → Eb → Bb
{
  const start = S9;
  const chords = [[60, 67, 72, 75], [56, 63, 68, 72], [63, 70, 75, 79], [58, 65, 70, 74]];
  const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
  const BAR = BEAT * 4;
  const pianoHarm = [1, 0.45, 0.22, 0.12, 0.06];
  let bar = 0;
  for (let t = start; t < END_T; t += BAR, bar++) {
    const ch = chords[bar % 4];
    pattern.forEach((pi, k) => {
      const tt = t + (k * BEAT) / 2;
      if (tt >= END_T) return;
      const amp = (k === 0 ? 0.11 : 0.075) * Math.min(1, (tt - start) / 1.5 + 0.35);
      tone(music, tt, 1.6, mtof(ch[pi] - 12), amp, { attack: 0.004, decay: 0.45, release: 0.2, harm: pianoHarm, pan: (pi - 1.5) * 0.2 });
    });
    tone(music, t, BAR, mtof(ch[0] - 24), 0.06, { attack: 0.01, decay: 1.4, release: 0.3, harm: [1, 0.3] });
  }
  [36, 48, 55, 60, 63].forEach((m, i) =>
    tone(music, END_T + i * 0.06, 2.2, mtof(m), 0.07, { attack: 0.004, decay: 0.9, release: 0.4, harm: pianoHarm, pan: (i - 2) * 0.2 }));
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

const step = (t, amp = 0.4, pan = 0) => {
  tone(sfx, t, 0.12, 110, amp, { freqEnd: 70, attack: 0.002, decay: 0.03, pan });
  noise(sfx, t, 0.06, amp * 0.35, { bp: 900, q: 1.2, decay: 0.015, pan });
};
const glitch = (t, dur = 0.22, amp = 0.28) => {
  let tt = t;
  while (tt < t + dur) {
    const d = 0.012 + rnd() * 0.03;
    tone(sfx, tt, d, 200 + rnd() * 1800, amp * (0.5 + rnd() * 0.5), { wave: 'sq', attack: 0.001, release: 0.002, pan: rnd() * 1.2 - 0.6 });
    if (rnd() > 0.5) noise(sfx, tt, d, amp * 0.6, { hp: 1500, attack: 0.001, release: 0.002 });
    tt += d + rnd() * 0.01;
  }
};

// ---- CENA 1: celular vibrando, caça-níquel do Pix, jackpot, palavras, SIM/NÃO com contagem
{
  const s1 = T.s1;
  // vibração do celular (zumbido grave pulsado)
  const a0 = Math.round(fr(s1.phone) * SR), a1 = Math.round(fr(s1.buzzEnd + 6) * SR);
  let ph = 0;
  for (let i = a0; i < a1; i++) {
    const t = (i - a0) / SR;
    ph += 150 / SR;
    const gate = Math.sin(2 * Math.PI * 9 * t) > -0.2 ? 1 : 0.2;
    write(sfx, i, Math.tanh(4 * Math.sin(2 * Math.PI * ph)) * 0.16 * gate * Math.min(1, t / 0.02), 0);
  }
  impact(fr(s1.phone), 0.7);
  ding(fr(s1.phone) + 0.12, 0.3);
  // números girando cada vez mais rápido
  let t = fr(s1.rollStart), gap = 0.11;
  while (t < fr(s1.hit) - 0.02) { click(t, 0.18, rnd() * 0.4 - 0.2); tone(sfx, t, 0.03, 1400 + (t - fr(s1.rollStart)) * 900, 0.06, { decay: 0.01 }); t += gap; gap = Math.max(0.025, gap * 0.86); }
  // jackpot
  const h = fr(s1.hit);
  impact(h, 1.0);
  [0, 4, 7, 12, 16].forEach((st, i) => tone(sfx, h + i * 0.05, 1.0, mtof(72 + st), 0.1, { decay: 0.35, harm: [1, 0, 0.2] }));
  for (let k = 0; k < 16; k++) coin(h + 0.05 + k * 0.05 + rnd() * 0.03, 0.15, rnd() * 1.6 - 0.8);
  pop(fr(s1.msg), 0.35, 0.2);
  // cada palavra da pergunta com um tique
  for (let i = 0; i < 11; i++) tone(sfx, fr(s1.words + i * s1.wordStep), 0.05, 1800 + i * 40, 0.05, { decay: 0.015 });
  impact(fr(s1.ask), 1.0);
  pop(fr(s1.buttons), 0.3);
  // coração acelerado durante a escolha + bipes da contagem subindo
  for (let k = 0; k < 6; k++) {
    const tt = fr(s1.buttons) + k * 0.32;
    tone(sfx, tt, 0.2, 70, 0.4, { freqEnd: 45, attack: 0.004, decay: 0.06 });
    tone(sfx, tt + 0.13, 0.2, 60, 0.25, { freqEnd: 40, attack: 0.004, decay: 0.05 });
  }
  s1.count.forEach((c, i) => tone(sfx, fr(c), 0.18, [880, 988, 1175][i], 0.16, { attack: 0.003, decay: 0.08, harm: [1, 0, 0.3] }));
  noise(sfx, fr(s1.choose), 0.3, 0.2, { bp: 900, bpEnd: 4000, q: 1.3, attack: 0.2, release: 0.05 });
}

// ---- CENA 2: chuva de moedas + glitch
for (let k = 0; k < 18; k++) coin(fr(T.s2.rain) + k * 0.09 + rnd() * 0.05, 0.12, rnd() * 1.4 - 0.7);
glitch(fr(T.s2.glitch), 0.25, 0.3);

// ---- CENA 3: dinheiro entrando e se espalhando pela rede (blips subindo)
noise(sfx, fr(T.s3.block), fr(T.s3.splits[0] - T.s3.block), 0.15, { bp: 600, bpEnd: 2500, q: 1.3, attack: 0.3, release: 0.05 });
T.s3.splits.forEach((s, li) => {
  const n = [5, 15, 30][li];
  for (let k = 0; k < Math.min(n, 14); k++) tone(sfx, fr(s) + k * 0.025, 0.06, 900 * Math.pow(1.5, li) + k * 60, 0.05, { decay: 0.02, pan: rnd() * 1.6 - 0.8 });
  noise(sfx, fr(s), 0.3, 0.12, { bp: 2000 + li * 1500, q: 1.5, attack: 0.01, decay: 0.08 });
});
impact(fr(T.s3.bold), 0.7);

// ---- CENA 4: traço + revelação
noise(sfx, fr(T.s4.boxStart), fr(T.s4.boxEnd - T.s4.boxStart), 0.3, { bp: 3200, q: 1.5, attack: 0.03, release: 0.05, mod: (t) => 0.55 + 0.45 * Math.abs(Math.sin(t * 37 + Math.sin(t * 11) * 3)) });
impact(fr(T.s4.reveal), 1.1);
[48, 51, 55, 60].forEach((m, i) => tone(sfx, fr(T.s4.reveal), 2.2, mtof(m + 12), 0.045, { attack: 0.01, decay: 0.8, pan: (i - 1.5) * 0.3 }));

// ---- CENA 5: máquina de lavar dinheiro (motor acelerando, água, tambor)
{
  const a = fr(T.s5.spinStart), b = fr(T.s5.spinEnd);
  const s0 = Math.round(a * SR), s1 = Math.round(b * SR);
  let ph = 0;
  const lp = biquad('lp', 700);
  for (let i = s0; i < s1; i++) {
    const p = (i - s0) / (s1 - s0);
    const sp = Math.sin(p * Math.PI);
    const f = 60 + 160 * sp; // motor
    ph += f / SR;
    const v = lp(Math.tanh(3 * Math.sin(2 * Math.PI * ph)) + 0.4 * (rnd() - 0.5)) * 0.16 * Math.min(1, p * 8, (1 - p) * 8);
    write(sfx, i, v, 0);
  }
  noise(sfx, a, b - a, 0.16, { bp: 500, bpEnd: 1800, q: 0.8, attack: 0.5, release: 0.6, mod: (x) => 0.5 + 0.5 * Math.abs(Math.sin(x * (6 + x * 3))) });
  for (let i = 0; i < 7; i++) noise(sfx, fr(T.s5.inStart + i * 10), 0.18, 0.12, { bp: 2200, q: 1, attack: 0.02, decay: 0.05, pan: -0.5 });
  for (let i = 0; i < 7; i++) {
    const t = fr(T.s5.outStart + i * 17);
    for (let k = 0; k < 4; k++) tone(sfx, t + k * 0.03, 0.5, 2400 + rnd() * 2500, 0.035, { decay: 0.12, pan: 0.6 });
  }
  T.s5.steps.forEach((s) => pop(fr(s), 0.35));
}

// ---- CENA 6: zoom na sua conta + "laranja" quicando
noise(sfx, fr(T.s6.zoom), 1.0, 0.18, { bp: 300, bpEnd: 2000, q: 1.2, attack: 0.6, release: 0.2 });
tone(sfx, fr(T.s6.laranja), 0.35, 300, 0.35, { freqEnd: 600, attack: 0.002, decay: 0.08 });
for (let k = 1; k < 5; k++) tone(sfx, fr(T.s6.laranja) + k * 0.35, 0.15, 260, 0.12 / k, { freqEnd: 420, decay: 0.04 });
impact(fr(T.s6.bold), 0.8);

// ---- CENA 7: carimbos + algemas fechando
T.s7.stamps.forEach((s, i) => {
  const t = fr(s);
  tone(sfx, t, 0.35, 100 - i * 8, 0.85, { freqEnd: 55, attack: 0.001, decay: 0.07 });
  noise(sfx, t, 0.1, 0.55, { bp: 1200, q: 1.1, decay: 0.025 });
});
{
  const t = fr(T.s7.cuffs);
  [2600, 3900, 5200].forEach((f0, i) => tone(sfx, t, 0.6, f0, 0.12 - i * 0.03, { decay: 0.12 }));
  noise(sfx, t, 0.04, 0.6, { hp: 2500, decay: 0.008 });
  noise(sfx, t + 0.09, 0.04, 0.45, { hp: 2500, decay: 0.008 });
}
pop(fr(T.s7.law1), 0.12);
pop(fr(T.s7.law2), 0.12);
impact(fr(T.s7.bold), 0.85);

// ---- CENA 8: balança rangendo e virando
noise(sfx, fr(T.s8.money), 0.5, 0.14, { bp: 800, bpEnd: 500, q: 6, attack: 0.05, release: 0.15, mod: (x) => 0.5 + 0.5 * Math.sign(Math.sin(x * 2 * Math.PI * 30)) });
coin(fr(T.s8.money), 0.25, -0.4);
{
  const t = fr(T.s8.reveal);
  noise(sfx, t, 0.7, 0.18, { bp: 700, bpEnd: 400, q: 6, attack: 0.05, release: 0.2, mod: (x) => 0.5 + 0.5 * Math.sign(Math.sin(x * 2 * Math.PI * 26)) });
  tone(sfx, t + 0.35, 0.6, 80, 0.7, { freqEnd: 45, attack: 0.002, decay: 0.12, pan: 0.4 });
}
impact(fr(T.s8.bold), 0.8);

// ---- CENA 9: três tics + impacto
T.s9.icons.forEach((f, i) => {
  click(fr(f), 0.3, (i - 1) * 0.5);
  tone(sfx, fr(f), 0.07, 2600 + i * 300, 0.1, { decay: 0.02, pan: (i - 1) * 0.5 });
});
impact(fr(T.s9.bold), 0.85);

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


// ---- RECOMPENSAS: whoosh em cada corte de cena, brilho nos estouros dourados, riser antes da resposta
Object.values(T.scenes).slice(1).forEach(([a], i) => {
  noise(sfx, fr(a) - 0.12, 0.32, 0.13, { bp: 700, bpEnd: 3200, q: 1.3, attack: 0.12, release: 0.15, pan: i % 2 ? 0.3 : -0.3 });
});
T.fx.filter((e) => e.k === 'gold').forEach((e) => {
  for (let k = 0; k < 6; k++) tone(sfx, fr(e.f) + 0.02 + k * 0.03, 0.5, 2400 + rnd() * 3000, 0.035, { decay: 0.12, pan: (e.x - 540) / 600 });
});
T.fx.filter((e) => e.k === 'spark').forEach((e) => tone(sfx, fr(e.f), 0.25, 3136, 0.03, { decay: 0.06, pan: (e.x - 540) / 600 }));
T.risers.forEach(([a, b]) => {
  noise(sfx, fr(a), fr(b - a), 0.22, { bp: 400, bpEnd: 5000, q: 1.2, attack: fr(b - a) * 0.9, release: 0.03 });
  tone(sfx, fr(a), fr(b - a), 110, 0.09, { freqEnd: 440, attack: fr(b - a) * 0.9, release: 0.03, wave: 'tri' });
});

// pequenos "pops" nas entradas de texto de topo (sutil)
[T.s2.text, T.s3.text, T.s5.text, T.s6.text, T.s8.text, T.s9.text, T.s10.text].forEach((f) => pop(fr(f), 0.1));

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

const MUSIC_GAIN = db(-18); // música em -18 dB em relação aos efeitos
const SFX_GAIN = db(0);
const mBus = [new Float32Array(N), new Float32Array(N)], sBus = [new Float32Array(N), new Float32Array(N)];
for (let c = 0; c < 2; c++) {
  const mRev = reverb(music[c], 0.35, 1.1, c * 23);
  const sRev = reverb(sfx[c], 0.25, 0.9, c * 23);
  for (let i = 0; i < N; i++) {
    mBus[c][i] = (music[c][i] + mRev[i]) * MUSIC_GAIN;
    sBus[c][i] = (sfx[c][i] + sRev[i]) * SFX_GAIN;
  }
}

// ---------- NARRAÇÃO OPCIONAL (public/narracao.mp3) ----------
// Se existir: voz ~8 dB acima da trilha; música abaixa para -24 dB (6 dB a mais) enquanto houver voz.
const VOICE = path.join(__dirname, '../public/narracao.mp3');
const out = [new Float32Array(N), new Float32Array(N)];
if (fs.existsSync(VOICE)) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', VOICE, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  const v = new Float32Array(N);
  const src = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 4));
  v.set(src.subarray(0, N));
  const hp = biquad('hp', 80);
  for (let i = 0; i < N; i++) v[i] = hp(v[i]);
  const bed = [0, 1].map((c) => mBus[c].map((x, i) => x + sBus[c][i]));
  const vL = lufs([v, v]), bL = lufs(bed);
  const vg = db(bL + 8 - vL);
  console.log(`Voz ${vL.toFixed(1)} LUFS, trilha ${bL.toFixed(1)} LUFS -> ganho da voz ${(20 * Math.log10(vg)).toFixed(1)} dB`);
  const att = Math.exp(-1 / (0.015 * SR)), rel = Math.exp(-1 / (0.4 * SR));
  const duckM = db(-6), duckS = db(-2);
  let e = 0;
  for (let i = 0; i < N; i++) {
    const a = Math.min(1, Math.abs(v[i]) * vg * 6);
    e = a > e ? a + (e - a) * att : a + (e - a) * rel;
    const k = Math.min(1, e * 3);
    const gm = 1 + (duckM - 1) * k, gs = 1 + (duckS - 1) * k;
    for (let c = 0; c < 2; c++) out[c][i] = mBus[c][i] * gm + sBus[c][i] * gs + v[i] * vg;
  }
} else {
  for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) out[c][i] = mBus[c][i] + sBus[c][i];
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
for (let it = 0; it < 6; it++) {
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
