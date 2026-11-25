#!/usr/bin/env python3
"""Sintetiza a trilha de áudio ASMR a partir da lista de eventos (cues) gerada pela cena.
Uso: python3 sfx.py cues.json saida.wav
Todos os sons são gerados por síntese (sem samples), então não há problema de direitos autorais."""
import json, sys, wave
import numpy as np

SR = 48000
cfg = json.load(open(sys.argv[1]))
out_path = sys.argv[2]
DUR = cfg['duration'] + 0.5
N = int(DUR * SR)
rng = np.random.default_rng(cfg.get('seed', 1) * 1337)
L = np.zeros(N); R = np.zeros(N)


def tvec(sec):
    return np.arange(int(sec * SR)) / SR


def band_noise(sec, lo, hi, seed=None):
    r = np.random.default_rng(seed) if seed is not None else rng
    n = int(sec * SR)
    x = r.standard_normal(n)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    m = np.clip((f - lo * 0.7) / (lo * 0.3 + 1e-9), 0, 1) * np.clip((hi * 1.3 - f) / (hi * 0.3), 0, 1)
    y = np.fft.irfft(X * m, n)
    return y / (np.abs(y).max() + 1e-9)


def pan_gains(p):
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def add(sig, t, amp=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0:
        return
    s = sig * amp
    if i < 0:
        s = s[-i:]; i = 0
    s = s[: N - i]
    gl, gr = pan_gains(pan)
    L[i:i + len(s)] += s * gl
    R[i:i + len(s)] += s * gr


def fftconv(x, k):
    n = len(x) + len(k) - 1
    nf = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(k, nf), nf)[:n]
    return y[: len(x)]


# ------------------------------------------------------------------ kernels
def k_slice(v):
    r = np.random.default_rng(100 + v)
    t = tvec(0.12)
    crisp = band_noise(0.12, 2500, 11000, 200 + v) * np.exp(-t / 0.016) * np.minimum(1, t / 0.001)
    crunch = np.zeros_like(t)
    for _ in range(9):
        j = int(r.uniform(0, 0.035) * SR)
        crunch[j] += r.uniform(0.3, 1.0) * r.choice([-1, 1])
    crunch = fftconv(crunch, band_noise(0.004, 3000, 9000, 300 + v) * np.exp(-tvec(0.004) / 0.0008))
    f = 230 - 80 * t / 0.12
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.02) * 0.35
    wet = band_noise(0.12, 600, 2600, 400 + v) * np.exp(-t / 0.035) * (0.6 + 0.4 * r.random(len(t))) * 0.28
    s = crisp * 0.8 + crunch * 0.7 + body + wet
    return s / np.abs(s).max()


def k_tap(v):
    t = tvec(0.07)
    f0 = [620, 820, 1000, 1250, 1500][v % 5]
    tone = (np.sin(2 * np.pi * f0 * t) + 0.5 * np.sin(2 * np.pi * f0 * 2.3 * t)) * np.exp(-t / 0.012)
    click = band_noise(0.07, 1500, 7000, 500 + v) * np.exp(-t / 0.004)
    s = tone * 0.6 + click * 0.8
    return s / np.abs(s).max()


def k_thud():
    t = tvec(0.35)
    f = 120 * np.exp(-t / 0.08) + 55
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
    s += band_noise(0.35, 60, 900, 7) * np.exp(-t / 0.025) * 0.6
    s += (np.sin(2 * np.pi * 190 * t) * 0.5 + np.sin(2 * np.pi * 430 * t) * 0.3) * np.exp(-t / 0.03)
    return s / np.abs(s).max()


def k_squish():
    t = tvec(0.4)
    s = band_noise(0.4, 250, 2200, 8) * np.exp(-t / 0.09)
    am = np.clip(np.sin(2 * np.pi * 23 * t + 3 * np.sin(2 * np.pi * 7 * t)), 0, 1) * 0.6 + 0.4
    s = s * am + np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.06) * 0.5
    s += band_noise(0.4, 3000, 9000, 9) * np.exp(-t / 0.02) * 0.4
    return s / np.abs(s).max()


def k_pop():
    t = tvec(0.14)
    f = 320 + 520 * (1 - np.exp(-t / 0.025))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.045) * np.minimum(1, t / 0.003)
    s += band_noise(0.14, 2000, 8000, 11) * np.exp(-t / 0.004) * 0.3
    return s / np.abs(s).max()


def k_ding():
    t = tvec(1.6)
    s = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in
            [(1318.5, 1.0, 0.7), (1318.5 * 2.76, 0.35, 0.25), (1318.5 * 5.4, 0.15, 0.12), (659.25, 0.3, 0.9)])
    s *= np.minimum(1, t / 0.002)
    return s / np.abs(s).max()


def whoosh(dur, seed):
    n = int(dur * SR)
    x = np.random.default_rng(seed).standard_normal(n)
    t = np.arange(n) / n
    fc = 350 + 1900 * np.sin(np.pi * t) ** 2
    low = band = 0.0
    out = np.empty(n)
    q = 0.9
    for i in range(n):
        f = 2 * np.sin(np.pi * fc[i] / SR)
        high = x[i] - low - q * band
        band += f * high
        low += f * band
        out[i] = band
    out *= np.sin(np.pi * t) ** 1.6
    return out / (np.abs(out).max() + 1e-9)


def rumble(dur, seed):
    t = tvec(dur)
    s = band_noise(dur, 120, 3000, seed)
    env = np.minimum(1, t / 0.15) * np.clip((dur - t) / (dur * 0.6), 0, 1) ** 1.5
    grit = band_noise(dur, 3000, 10000, seed + 1) * 0.35
    return (s + grit) * env


# ------------------------------------------------------------------ build
slice_k = [k_slice(v) for v in range(4)]
tap_k = [k_tap(v) for v in range(5)]
thud_k, squish_k, pop_k, ding_k = k_thud(), k_squish(), k_pop(), k_ding()

# trens de impulsos para eventos muito numerosos (cortes rápidos, cubinhos caindo)
trains = {}


def impulse(name, t, amp, pan):
    if name not in trains:
        trains[name] = (np.zeros(N), np.zeros(N))
    i = int(t * SR)
    if 0 <= i < N:
        gl, gr = pan_gains(pan)
        trains[name][0][i] += amp * gl
        trains[name][1][i] += amp * gr


n_whoosh = 0
for c in cfg['cues']:
    typ, t, amp, pan = c['type'], c['t'], c.get('amp', 0.5), c.get('pan', 0.0)
    v = int(c.get('v', 0))
    if typ == 'slice':
        impulse(f'slice{v % 4}', t, amp * rng.uniform(0.8, 1.1), pan)
    elif typ == 'tap':
        impulse(f'tap{v % 5}', t, amp * rng.uniform(0.6, 1.2), pan + rng.uniform(-0.15, 0.15))
    elif typ == 'thud':
        add(thud_k, t, amp * 0.9, pan)
    elif typ == 'squish':
        add(squish_k, t, amp * 0.7, 0)
    elif typ == 'pop':
        add(pop_k, t, amp * 0.45, 0)
    elif typ == 'ding':
        add(ding_k, t, amp * 0.35, 0)
    elif typ == 'whoosh':
        n_whoosh += 1
        add(whoosh(c.get('dur', 0.2), n_whoosh), t, amp * 0.55, pan)
    elif typ == 'rumble':
        add(rumble(c.get('dur', 1.0), 77 + n_whoosh), t, amp * 0.18, 0)

for name, (il, ir) in trains.items():
    k = slice_k[int(name[-1])] if name.startswith('slice') else tap_k[int(name[-1])]
    L += fftconv(il, k)
    R += fftconv(ir, k)

# ------------------------------------------------------------------ trilha ambiente (opcional)
if cfg.get('music', True):
    t = np.arange(N) / SR
    midi = lambda m: 440 * 2 ** ((m - 69) / 12)
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 64]]
    CH = 2.4
    pad = np.zeros(N)
    for ci in range(int(DUR / CH) + 1):
        notes = chords[ci % 4]
        s0 = int(ci * CH * SR)
        seg = int((CH + 1.2) * SR)
        tt = np.arange(seg) / SR
        env = np.minimum(1, tt / 0.6) * np.clip((CH + 1.2 - tt) / 1.2, 0, 1)
        sig = np.zeros(seg)
        for m in notes:
            f = midi(m)
            sig += np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2.003 * tt) + 0.5 * np.sin(2 * np.pi * f * 1.004 * tt)
        e = min(N, s0 + seg)
        pad[s0:e] += (sig * env)[: e - s0]
    # pluck suave (notas da escala pentatônica)
    scale = [69, 72, 74, 76, 79, 81]
    pl = np.zeros(N)
    r2 = np.random.default_rng(5)
    step = CH / 8
    for k in range(int(DUR / step)):
        if r2.random() < 0.55:
            m = scale[r2.integers(len(scale))]
            f = midi(m)
            tt = tvec(0.9)
            s = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt / 0.3) * np.minimum(1, tt / 0.004)
            i = int(k * step * SR)
            e = min(N, i + len(s)); pl[i:e] += s[: e - i]
    music = pad / (np.abs(pad).max() + 1e-9) * 0.05 + pl / (np.abs(pl).max() + 1e-9) * 0.035
    fade = np.minimum(1, t / 0.8) * np.clip((DUR - 0.3 - t) / 1.0, 0, 1)
    L += music * fade; R += music * fade

# ------------------------------------------------------------------ master
mix = np.stack([L, R], 1)
peak = np.abs(mix).max() + 1e-9
mix = mix / peak * 1.6
mix = np.tanh(mix) / np.tanh(1.6) * 0.89
fade_out = np.clip((DUR - np.arange(N) / SR) / 0.4, 0, 1)
mix *= fade_out[:, None]
pcm = (mix * 32767).astype(np.int16)
with wave.open(out_path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f'áudio: {out_path} ({DUR:.1f}s)')
