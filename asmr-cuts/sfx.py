#!/usr/bin/env python3
"""Sintetiza a trilha de áudio ASMR a partir da lista de eventos (cues) gerada pela cena.
Uso: python3 sfx.py cues.json saida.wav
Tudo é síntese (sem samples) -> sem problema de direitos autorais.
Perfis de som por alimento: juicy (suculento), crunchy (crocante), soft (macio), creamy (cremoso)."""
import json, sys, wave
import numpy as np

SR = 48000
cfg = json.load(open(sys.argv[1]))
out_path = sys.argv[2]
PROFILE = cfg.get('sound', 'juicy')
DUR = cfg['duration'] + 0.6
N = int(DUR * SR)
rng = np.random.default_rng(cfg.get('seed', 1) * 1337)
L = np.zeros(N); R = np.zeros(N)

# parâmetros do perfil
P = {
    'juicy':   dict(crisp=0.7, crunch=0.45, wet=0.75, body=0.35, crisp_lo=2500, wet_tau=0.05),
    'crunchy': dict(crisp=1.0, crunch=1.1, wet=0.2, body=0.3, crisp_lo=3200, wet_tau=0.03),
    'soft':    dict(crisp=0.35, crunch=0.15, wet=0.15, body=0.5, crisp_lo=1500, wet_tau=0.04),
    'creamy':  dict(crisp=0.45, crunch=0.2, wet=0.6, body=0.45, crisp_lo=1800, wet_tau=0.06),
}.get(PROFILE, None) or dict(crisp=0.7, crunch=0.45, wet=0.75, body=0.35, crisp_lo=2500, wet_tau=0.05)
WET = PROFILE in ('juicy', 'creamy')


def tvec(sec):
    return np.arange(int(sec * SR)) / SR


def band_noise(sec, lo, hi, seed=None):
    r = np.random.default_rng(seed) if seed is not None else rng
    n = max(16, int(sec * SR))
    X = np.fft.rfft(r.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    m = np.clip((f - lo * 0.7) / (lo * 0.3 + 1e-9), 0, 1) * np.clip((hi * 1.3 - f) / (hi * 0.3), 0, 1)
    y = np.fft.irfft(X * m, n)
    return y / (np.abs(y).max() + 1e-9)


def norm(s):
    return s / (np.abs(s).max() + 1e-9)


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
    return np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(k, nf), nf)[: len(x)]


def svf_sweep(x, fc, q=0.9):
    low = band = 0.0
    out = np.empty(len(x))
    for i in range(len(x)):
        f = 2 * np.sin(np.pi * min(fc[i], SR * 0.2) / SR)
        high = x[i] - low - q * band
        band += f * high
        low += f * band
        out[i] = band
    return out


# ------------------------------------------------------------------ kernels
def k_slice(v):
    r = np.random.default_rng(100 + v)
    t = tvec(0.14)
    crisp = band_noise(0.14, P['crisp_lo'], 12000, 200 + v) * np.exp(-t / 0.016) * np.minimum(1, t / 0.001)
    crunch = np.zeros_like(t)
    for _ in range(int(6 + 10 * P['crunch'])):
        j = int(r.uniform(0, 0.045) * SR)
        crunch[j] += r.uniform(0.3, 1.0) * r.choice([-1, 1])
    crunch = fftconv(crunch, band_noise(0.004, 2500, 9000, 300 + v) * np.exp(-tvec(0.004) / 0.0008))
    f = 230 - 90 * t / 0.14
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.022)
    wet = band_noise(0.14, 500, 2600, 400 + v) * np.exp(-t / P['wet_tau']) * (0.5 + 0.5 * r.random(len(t)))
    s = crisp * P['crisp'] + norm(crunch) * P['crunch'] + body * P['body'] + wet * P['wet'] * 0.5
    return norm(s)


def k_tap(v):
    t = tvec(0.07)
    f0 = [620, 820, 1000, 1250, 1500][v % 5]
    tone = (np.sin(2 * np.pi * f0 * t) + 0.5 * np.sin(2 * np.pi * f0 * 2.3 * t)) * np.exp(-t / 0.012)
    click = band_noise(0.07, 1500, 7000, 500 + v) * np.exp(-t / 0.004)
    wet = band_noise(0.07, 400, 2000, 520 + v) * np.exp(-t / 0.015) * (0.6 if WET else 0.1)
    return norm(tone * 0.5 + click * 0.8 + wet)


def k_land(v):  # pedaço médio caindo na tábua
    t = tvec(0.25)
    knock = (np.sin(2 * np.pi * 180 * t) * 0.6 + np.sin(2 * np.pi * 410 * t) * 0.35 + np.sin(2 * np.pi * 760 * t) * 0.15) * np.exp(-t / 0.035)
    slap = band_noise(0.25, 300, 3500, 600 + v) * np.exp(-t / (0.04 if WET else 0.015))
    return norm(knock + slap * (0.9 if WET else 0.4))


def k_drip(v):  # gota (molhado) ou farelo (seco)
    t = tvec(0.09)
    if WET:
        f = (900 + 250 * v) * np.exp(-t / 0.02) + 350
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.018) * np.minimum(1, t / 0.001)
        s += band_noise(0.09, 2000, 8000, 700 + v) * np.exp(-t / 0.003) * 0.3
    else:
        s = band_noise(0.09, 2500, 10000, 700 + v) * np.exp(-t / 0.004)
    return norm(s)


def k_thud():
    t = tvec(0.4)
    f = 120 * np.exp(-t / 0.08) + 55
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.1)
    s += band_noise(0.4, 60, 900, 7) * np.exp(-t / 0.025) * 0.6
    s += (np.sin(2 * np.pi * 190 * t) * 0.5 + np.sin(2 * np.pi * 430 * t) * 0.3) * np.exp(-t / 0.03)
    if WET:
        s += band_noise(0.4, 400, 2500, 8) * np.exp(-t / 0.05) * 0.5
    return norm(s)


def k_squish():
    t = tvec(0.45)
    s = band_noise(0.45, 250, 2400, 8) * np.exp(-t / 0.1)
    am = np.clip(np.sin(2 * np.pi * 23 * t + 3 * np.sin(2 * np.pi * 7 * t)), 0, 1) * 0.6 + 0.4
    s = s * am * (1.0 if WET else 0.5) + np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.06) * 0.5
    s += band_noise(0.45, 3000, 9000, 9) * np.exp(-t / 0.02) * (0.4 if WET else 0.8)
    return norm(s)


def k_shing():  # lâmina metálica
    t = tvec(0.5)
    partials = [(3150, 1.0, 0.22), (4720, 0.6, 0.15), (6900, 0.45, 0.1), (2210, 0.35, 0.3), (8800, 0.25, 0.06)]
    ring = sum(a * np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 6 * t)) * np.exp(-t / d) for f, a, d in partials)
    scrape = band_noise(0.5, 3500, 12000, 10) * np.exp(-t / 0.05)
    s = (ring * 0.6 + scrape * 0.5) * np.minimum(1, t / 0.01)
    return norm(s)


def k_pop():
    t = tvec(0.14)
    f = 320 + 520 * (1 - np.exp(-t / 0.025))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.045) * np.minimum(1, t / 0.003)
    s += band_noise(0.14, 2000, 8000, 11) * np.exp(-t / 0.004) * 0.3
    return norm(s)


def bell(f0, dur, seed=0):
    t = tvec(dur)
    s = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in
            [(f0, 1.0, dur * 0.45), (f0 * 2.76, 0.35, dur * 0.16), (f0 * 5.4, 0.15, dur * 0.08), (f0 * 0.5, 0.3, dur * 0.55)])
    return norm(s * np.minimum(1, t / 0.002))


def k_chime():  # arpejo ao completar o contador
    out = np.zeros(int(1.2 * SR))
    for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
        b = bell(f, 0.9)
        j = int(i * 0.06 * SR)
        out[j:j + len(b)] += b[: len(out) - j] * (0.8 - i * 0.1)
    return norm(out)


def k_sparkle():
    out = np.zeros(int(0.8 * SR))
    r = np.random.default_rng(12)
    for i in range(10):
        b = bell(r.uniform(2500, 5000), 0.25)
        j = int(i * 0.035 * SR)
        out[j:j + len(b)] += b[: len(out) - j] * r.uniform(0.3, 1)
    return norm(out)


def k_impact():
    t = tvec(1.0)
    f = 75 * np.exp(-t / 0.15) + 38
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.28)
    crack = band_noise(1.0, 200, 6000, 13) * np.exp(-t / 0.05)
    tail = band_noise(1.0, 100, 1500, 14) * np.exp(-t / 0.3) * 0.25
    return norm(sub + crack * 0.6 + tail)


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / n
    x = np.random.default_rng(15).standard_normal(n)
    s = svf_sweep(x, 300 + 5000 * t ** 2, 0.5)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 600 * t ** 2) / SR) * 0.3
    return norm((s + tone) * t ** 2)


def whoosh(dur, seed):
    n = int(dur * SR)
    x = np.random.default_rng(seed).standard_normal(n)
    t = np.arange(n) / n
    out = svf_sweep(x, 350 + 1900 * np.sin(np.pi * t) ** 2)
    return norm(out * np.sin(np.pi * t) ** 1.6)


def rumble(dur, seed):
    t = tvec(dur)
    s = band_noise(dur, 120, 3000, seed)
    env = np.minimum(1, t / 0.15) * np.clip((dur - t) / (dur * 0.6), 0, 1) ** 1.5
    grit = band_noise(dur, 3000, 10000, seed + 1) * 0.35
    return (s + grit) * env


# ------------------------------------------------------------------ montagem
slice_k = [k_slice(v) for v in range(4)]
tap_k = [k_tap(v) for v in range(5)]
drip_k = [k_drip(v) for v in range(4)]
land_k = [k_land(v) for v in range(5)]
K = dict(thud=k_thud(), squish=k_squish(), pop=k_pop(), ding=bell(1318.5, 1.6), shing=k_shing(),
         chime=k_chime(), sparkle=k_sparkle(), impact=k_impact())
GAIN = dict(thud=0.9, squish=0.7, pop=0.45, ding=0.35, shing=0.22, chime=0.3, sparkle=0.25, impact=0.8)

trains = {}


def impulse(name, t, amp, pan):
    if name not in trains:
        trains[name] = (np.zeros(N), np.zeros(N))
    i = int(t * SR)
    if 0 <= i < N:
        gl, gr = pan_gains(pan)
        trains[name][0][i] += amp * gl
        trains[name][1][i] += amp * gr


nw = 0
for c in cfg['cues']:
    typ, t, amp, pan = c['type'], c['t'], c.get('amp', 0.5), c.get('pan', 0.0)
    v = int(c.get('v', 0))
    if typ == 'slice':
        impulse(f'slice{v % 4}', t, amp * rng.uniform(0.8, 1.1), pan)
    elif typ == 'tap':
        impulse(f'tap{v % 5}', t, amp * rng.uniform(0.6, 1.2), pan + rng.uniform(-0.15, 0.15))
    elif typ == 'drip':
        impulse(f'drip{v % 4}', t, amp * rng.uniform(0.6, 1.1), pan)
    elif typ == 'land':
        impulse(f'land{v % 5}', t, amp * 0.8, pan)
    elif typ in K:
        add(K[typ], t, amp * GAIN[typ], pan)
    elif typ == 'whoosh':
        nw += 1
        add(whoosh(c.get('dur', 0.2), nw), t, amp * 0.55, pan)
    elif typ == 'riser':
        add(riser(c.get('dur', 0.5)), t, amp * 0.4, 0)
    elif typ == 'rumble':
        add(rumble(c.get('dur', 1.0), 77 + nw), t, amp * 0.18, 0)

kern = dict(slice=slice_k, tap=tap_k, drip=drip_k, land=land_k)
for name, (il, ir) in trains.items():
    k = kern[name.rstrip('0123456789')][int(name[-1])]
    L += fftconv(il, k)
    R += fftconv(ir, k)

# ------------------------------------------------------------------ reverb (sala pequena)
t = tvec(0.9)
irL = band_noise(0.9, 200, 7000, 21) * np.exp(-t / 0.18)
irR = band_noise(0.9, 200, 7000, 22) * np.exp(-t / 0.18)
irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
dry_peak = max(np.abs(L).max(), np.abs(R).max()) + 1e-9
L, R = L + fftconv(L, irL) * 0.22, R + fftconv(R, irR) * 0.22

# ------------------------------------------------------------------ trilha ambiente (opcional)
if cfg.get('music', True):
    tt_all = np.arange(N) / SR
    midi = lambda m: 440 * 2 ** ((m - 69) / 12)
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 64]]
    CH = 2.4
    pad = np.zeros(N)
    for ci in range(int(DUR / CH) + 1):
        s0 = int(ci * CH * SR); seg = int((CH + 1.2) * SR)
        tt = np.arange(seg) / SR
        env = np.minimum(1, tt / 0.6) * np.clip((CH + 1.2 - tt) / 1.2, 0, 1)
        sig = sum(np.sin(2 * np.pi * midi(m) * tt) + 0.25 * np.sin(2 * np.pi * midi(m) * 2.003 * tt) + 0.5 * np.sin(2 * np.pi * midi(m) * 1.004 * tt) for m in chords[ci % 4])
        e = min(N, s0 + seg); pad[s0:e] += (sig * env)[: e - s0]
    scale = [69, 72, 74, 76, 79, 81]
    pl = np.zeros(N); r2 = np.random.default_rng(5); step = CH / 8
    for k in range(int(DUR / step)):
        if r2.random() < 0.55:
            f = midi(scale[r2.integers(len(scale))]); tt = tvec(0.9)
            s = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt / 0.3) * np.minimum(1, tt / 0.004)
            i = int(k * step * SR); e = min(N, i + len(s)); pl[i:e] += s[: e - i]
    music = (norm(pad) * 0.05 + norm(pl) * 0.035) * dry_peak * 1.6
    fade = np.minimum(1, tt_all / 0.8) * np.clip((DUR - 0.3 - tt_all) / 1.0, 0, 1)
    L += music * fade; R += music * fade

# ------------------------------------------------------------------ master
mix = np.stack([L, R], 1)
mix = mix / (np.abs(mix).max() + 1e-9) * 1.6
mix = np.tanh(mix) / np.tanh(1.6) * 0.89
mix *= np.clip((DUR - np.arange(N) / SR) / 0.4, 0, 1)[:, None]
with wave.open(out_path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print(f'áudio: {out_path} ({DUR:.1f}s, perfil {PROFILE})')
