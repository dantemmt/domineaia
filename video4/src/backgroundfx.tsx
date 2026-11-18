import React from 'react';
import { random, useCurrentFrame } from 'remotion';
import { W, H, GROUND } from './ui';

// Animações de fundo discretas em preto e branco: poeira flutuando, anéis tracejados
// girando devagar, pequenas cruzes à deriva e uma linha de varredura suave.
const DUST = new Array(46).fill(0).map((_, i) => ({
  x: random(`dx${i}`) * W,
  y: random(`dy${i}`) * H,
  r: 1.2 + random(`dr${i}`) * 2.4,
  speed: 0.25 + random(`ds${i}`) * 0.6,
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
      </defs>
      {/* anéis tracejados girando devagar atrás da cena */}
      <g transform={`translate(${W / 2} ${GROUND - 330})`} opacity={0.1}>
        <circle r={430} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="4 22" transform={`rotate(${f * 0.12})`} />
        <circle r={330} fill="none" stroke="#fff" strokeWidth={1.5} strokeDasharray="60 30 6 30" transform={`rotate(${-f * 0.2})`} />
        <circle r={520 + 8 * Math.sin(f * 0.03)} fill="none" stroke="#fff" strokeWidth={1} opacity={0.6} />
      </g>
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
      {/* poeira flutuando */}
      {DUST.map((d, i) => {
        const y = ((d.y - f * d.speed) % H + H) % H;
        const x = d.x + d.sway * Math.sin(f * 0.02 + d.phase);
        const tw = 0.6 + 0.4 * Math.sin(f * 0.08 + d.phase);
        return <circle key={i} cx={x} cy={y} r={d.r} fill="#fff" opacity={d.op * tw} />;
      })}
      {/* varredura suave */}
      <rect x={0} y={scan} width={W} height={200} fill="url(#scan)" />
    </svg>
  );
};
