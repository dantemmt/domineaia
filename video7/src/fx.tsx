import React from 'react';
import { interpolate, random, useCurrentFrame } from 'remotion';
import T from './timeline.json';
import { W, H, GOLD, clamp } from './ui';

// Efeitos de "recompensa" nos momentos-chave: soco de câmera, flash, onda de choque e partículas.
type Fx = { f: number; k: string; x: number; y: number };
const FX = (T as unknown as { fx: Fx[] }).fx;
const LIFE = 26;

// soco de câmera (zoom rápido que assenta) + micro tremor, somando os impactos ativos
export const useCameraPunch = () => {
  const f = useCurrentFrame();
  let scale = 1, dx = 0, dy = 0;
  for (const e of FX) {
    if (e.k !== 'impact' || f < e.f || f > e.f + 14) continue;
    const t = f - e.f;
    const k = Math.exp(-t / 4);
    scale += 0.028 * k;
    dx += Math.sin(t * 2.9) * 5 * k;
    dy += Math.cos(t * 3.3) * 3 * k;
  }
  return { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, transformOrigin: '50% 50%' } as React.CSSProperties;
};

export const FxLayer: React.FC = () => {
  const f = useCurrentFrame();
  const active = FX.filter((e) => f >= e.f && f < e.f + LIFE);
  const flash = FX.filter((e) => e.k === 'impact' && f >= e.f && f < e.f + 6).length ? interpolate(f - Math.max(...FX.filter((e) => e.k === 'impact' && f >= e.f && f < e.f + 6).map((e) => e.f)), [0, 6], [0.07, 0], clamp) : 0;
  return (
    <>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
        {active.map((e, idx) => {
          const t = f - e.f;
          const p = t / LIFE;
          const color = e.k === 'gold' ? GOLD : '#fff';
          const ringR = interpolate(t, [0, 18], [20, e.k === 'impact' ? 520 : 220], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
          const ringO = interpolate(t, [0, 18], [e.k === 'impact' ? 0.35 : 0.5, 0], clamp);
          const n = e.k === 'impact' ? 0 : e.k === 'gold' ? 18 : 10;
          return (
            <g key={idx} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
              <circle cx={e.x} cy={e.y} r={ringR} fill="none" stroke={color} strokeWidth={e.k === 'impact' ? 3 : 2.5} opacity={ringO} />
              {new Array(n).fill(0).map((_, i) => {
                const a = (i / n) * Math.PI * 2 + random(`${e.f}-${i}-a`) * 0.5;
                const sp = (e.k === 'gold' ? 9 : 7) * (0.6 + random(`${e.f}-${i}-s`) * 0.8);
                const dist = sp * t * (1 - p * 0.45);
                const x = e.x + Math.cos(a) * dist;
                const y = e.y + Math.sin(a) * dist + (e.k === 'gold' ? 0.35 * t * t * 0.5 : 0);
                const r = (e.k === 'gold' ? 4.5 : 3) * (1 - p * 0.7);
                return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={(1 - p) * 0.95} />;
              })}
            </g>
          );
        })}
      </svg>
      {flash > 0 ? <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash, pointerEvents: 'none' }} /> : null}
    </>
  );
};
