import React from 'react';
import { random, useCurrentFrame } from 'remotion';
import { W, H, GROUND } from './ui';

// Fundo animado em preto e branco: rastros de luz (cometas), partículas com rastro,
// anéis tracejados girando, cruzes à deriva, linhas respirando e varredura suave.

// rastros de luz atravessando o fundo na diagonal
const STREAKS = new Array(7).fill(0).map((_, i) => ({
  period: 150 + Math.floor(random(`sp${i}`) * 140),
  offset: Math.floor(random(`so${i}`) * 300),
  y0: 150 + random(`sy${i}`) * (H - 300),
  len: 220 + random(`sl${i}`) * 260,
  ang: -0.22 - random(`sa${i}`) * 0.25, // sobe levemente para a direita
  op: 0.16 + random(`sop${i}`) * 0.18,
  w: 1.5 + random(`sw${i}`) * 1.5,
  dir: i % 3 === 2 ? -1 : 1,
}));
const DUST = new Array(50).fill(0).map((_, i) => ({
  x: random(`dx${i}`) * W,
  y: random(`dy${i}`) * H,
  r: 1.2 + random(`dr${i}`) * 2.4,
  speed: 0.3 + random(`ds${i}`) * 0.9,
  sway: 10 + random(`dw${i}`) * 30,
  phase: random(`dp${i}`) * Math.PI * 2,
  op: 0.12 + random(`do${i}`) * 0.25,
}));
const CROSSES = new Array(9).fill(0).map((_, i) => ({
  x: 80 + random(`cx${i}`) * (W - 160),
  y: 200 + random(`cy${i}`) * (H - 500),
  s: 8 + random(`cs${i}`) * 8,
  rot: random(`cr${i}`) * 90,
  drift: 0.08 + random(`cd${i}`) * 0.15,
  phase: random(`cp${i}`) * Math.PI * 2,
}));

export const BackgroundFX: React.FC = () => {
  const f = useCurrentFrame();
  const scan = ((f % 240) / 240) * (H + 400) - 200;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
      <defs>
        <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.035} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.85" stopColor="#fff" stopOpacity={0.7} />
          <stop offset="1" stopColor="#fff" stopOpacity={1} />
        </linearGradient>
      </defs>
      {/* anéis tracejados girando devagar atrás da cena */}
      <g transform={`translate(${W / 2} ${GROUND - 330})`} opacity={0.1}>
        <circle r={430} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="4 22" transform={`rotate(${f * 0.12})`} />
        <circle r={330} fill="none" stroke="#fff" strokeWidth={1.5} strokeDasharray="60 30 6 30" transform={`rotate(${-f * 0.2})`} />
        <circle r={520 + 8 * Math.sin(f * 0.03)} fill="none" stroke="#fff" strokeWidth={1} opacity={0.6} />
      </g>
      {/* rastros de luz (cometas) */}
      {STREAKS.map((s, i) => {
        const p = ((f + s.offset) % s.period) / s.period; // 0..1
        const travel = W + s.len * 2;
        const x = s.dir > 0 ? -s.len + p * travel : W + s.len - p * travel;
        const y = s.y0 + (x - W / 2) * Math.tan(s.ang);
        const fade = Math.sin(p * Math.PI); // entra e sai suave
        const rot = (Math.atan(Math.tan(s.ang)) * 180) / Math.PI + (s.dir > 0 ? 0 : 180);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={s.op * fade} style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}>
            <rect x={-s.len} y={-s.w / 2} width={s.len} height={s.w} rx={s.w / 2} fill="url(#trail)" />
            <circle cx={0} cy={0} r={s.w * 1.6} fill="#fff" />
          </g>
        );
      })}
      {/* linhas finas horizontais respirando abaixo do chão */}
      {[0, 1, 2].map((i) => (
        <line key={i} x1={0} x2={W} y1={GROUND + 120 + i * 90} y2={GROUND + 120 + i * 90} stroke="#fff" strokeWidth={1}
          opacity={0.03 + 0.025 * Math.sin(f * 0.05 + i * 1.3)} strokeDasharray="2 14" strokeDashoffset={-f * (0.6 + i * 0.3)} />
      ))}
      {/* cruzes à deriva */}
      {CROSSES.map((c, i) => {
        const y = c.y - ((f * c.drift) % 300) + 8 * Math.sin(f * 0.03 + c.phase);
        return (
          <g key={i} transform={`translate(${c.x} ${y}) rotate(${c.rot + f * 0.3})`} opacity={0.08 + 0.04 * Math.sin(f * 0.05 + c.phase)}>
            <line x1={-c.s} x2={c.s} y1={0} y2={0} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
            <line x1={0} x2={0} y1={-c.s} y2={c.s} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          </g>
        );
      })}
      {/* poeira subindo com pequeno rastro */}
      {DUST.map((d, i) => {
        const y = ((d.y - f * d.speed) % H + H) % H;
        const x = d.x + d.sway * Math.sin(f * 0.02 + d.phase);
        const tw = 0.6 + 0.4 * Math.sin(f * 0.08 + d.phase);
        const tail = 10 + d.speed * 26;
        return (
          <g key={i} opacity={d.op * tw}>
            <line x1={x} x2={x - d.sway * 0.02 * Math.cos(f * 0.02 + d.phase) * tail} y1={y} y2={y + tail} stroke="#fff" strokeWidth={d.r * 0.8} strokeLinecap="round" opacity={0.35} />
            <circle cx={x} cy={y} r={d.r} fill="#fff" />
          </g>
        );
      })}
      {/* varredura suave */}
      <rect x={0} y={scan} width={W} height={200} fill="url(#scan)" />
    </svg>
  );
};
