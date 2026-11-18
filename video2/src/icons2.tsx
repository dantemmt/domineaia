import React from 'react';
import { GOLD, FONT } from './ui';

// Ícones novos do vídeo 2 — traço branco 3px, centrados em (0,0) salvo indicação.
const S = { fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const SG = { ...S, stroke: GOLD } as const;

// Etiqueta de preço pendurada por um fio. (0,0) = ponto de fixação do fio; corpo abaixo.
export const PriceTag: React.FC<{ w?: number; h?: number; string?: number; lines: { t: string; size: number; gold?: boolean }[] }> = ({
  w = 300,
  h = 150,
  string = 120,
  lines,
}) => {
  const top = string;
  const total = lines.reduce((p, l) => p + l.size * 1.15, 0);
  let y = top + 34 + (h - 34 - total) / 2;
  return (
    <g>
      <line x1={-22} y1={0} x2={22} y2={0} {...S} />
      <line x1={0} y1={0} x2={0} y2={top + 18} {...S} strokeWidth={2} />
      <path d={`M 0 ${top} L ${w / 2} ${top + 30} L ${w / 2} ${top + h} L ${-w / 2} ${top + h} L ${-w / 2} ${top + 30} Z`} {...S} fill="rgba(5,5,5,0.85)" />
      <circle cx={0} cy={top + 20} r={6} {...S} />
      {lines.map((l, i) => {
        y += l.size * 1.15;
        return (
          <text key={i} x={0} y={y - l.size * 0.2} textAnchor="middle" fill={l.gold ? GOLD : '#fff'} fontFamily={FONT} fontWeight={800} fontSize={l.size} letterSpacing={3}>
            {l.t}
          </text>
        );
      })}
    </g>
  );
};

// Vitrine: moldura com toldo e reflexo diagonal. (0,0) = centro da base; draw 0..1 desenha o traço.
export const ShopWindow: React.FC<{ w: number; h: number; draw: number; light: number }> = ({ w, h, draw, light }) => {
  const per = 2 * (w + h);
  return (
    <g>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={6} {...S} fill={`rgba(255,255,255,${0.04 * light})`} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} />
      <g opacity={draw}>
        <path d={`M ${-w / 2 - 14} ${-h} L ${-w / 2 + 10} ${-h - 46} L ${w / 2 - 10} ${-h - 46} L ${w / 2 + 14} ${-h}`} {...S} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = -w / 2 + 10 + ((w - 20) / 6) * (i + 0.5);
          return <path key={i} d={`M ${x - (w - 20) / 12} ${-h - 46} L ${x} ${-h} `} {...S} strokeOpacity={0.5} />;
        })}
        <line x1={-w / 2 + 30} y1={-h + 60} x2={-w / 2 + 110} y2={-h + 10} {...S} strokeOpacity={0.35 + 0.3 * light} />
        <line x1={-w / 2 + 30} y1={-h + 110} x2={-w / 2 + 180} y2={-h + 16} {...S} strokeOpacity={0.25 + 0.25 * light} />
        <line x1={-w / 2} y1={-30} x2={w / 2} y2={-30} {...S} strokeOpacity={0.6} />
      </g>
    </g>
  );
};

// Celular girando (rot em graus em torno do eixo vertical)
export const SpinPhone: React.FC<{ rot: number; s?: number }> = ({ rot, s = 1 }) => {
  const c = Math.cos((rot * Math.PI) / 180);
  const sx = Math.max(0.08, Math.abs(c));
  return (
    <g transform={`scale(${sx * s} ${s})`}>
      <rect x={-60} y={-110} width={120} height={220} rx={20} {...S} fill="#050505" />
      {c > 0 ? (
        <>
          <line x1={-16} y1={-96} x2={16} y2={-96} {...S} />
          <circle cx={0} cy={94} r={6} {...S} />
          <rect x={-46} y={-80} width={92} height={160} rx={6} {...S} strokeOpacity={0.4} />
        </>
      ) : (
        <>
          <rect x={-46} y={-96} width={40} height={50} rx={12} {...S} />
          <circle cx={-26} cy={-80} r={8} {...S} />
        </>
      )}
    </g>
  );
};

// Calculadora
export const Calculator: React.FC = () => (
  <g>
    <rect x={-50} y={-66} width={100} height={132} rx={12} {...S} />
    <rect x={-36} y={-52} width={72} height={30} rx={4} {...S} />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={-36 + c * 26} y={-8 + r * 24} width={20} height={16} rx={3} {...S} strokeWidth={2.5} />),
    )}
  </g>
);

// Termômetro: base = 0. level 0..1
export const Thermometer: React.FC<{ level: number; h?: number }> = ({ level, h = 260 }) => {
  const tubeTop = -h, tubeBot = -44;
  const fillTop = tubeBot - (tubeBot - tubeTop - 14) * level;
  return (
    <g>
      <path d={`M -14 ${tubeBot} L -14 ${tubeTop + 14} A 14 14 0 0 1 14 ${tubeTop + 14} L 14 ${tubeBot}`} {...S} />
      <circle cx={0} cy={-26} r={26} {...S} />
      <circle cx={0} cy={-26} r={16} fill="#fff" />
      <rect x={-6} y={fillTop} width={12} height={tubeBot - fillTop + 6} rx={6} fill="#fff" style={{ filter: `drop-shadow(0 0 ${6 + level * 14}px rgba(255,255,255,${0.4 + level * 0.5}))` }} />
      {[0.25, 0.5, 0.75].map((k) => (
        <line key={k} x1={20} x2={32} y1={tubeBot - (tubeBot - tubeTop) * k} y2={tubeBot - (tubeBot - tubeTop) * k} {...S} strokeWidth={2} strokeOpacity={0.6} />
      ))}
    </g>
  );
};

// Mini calendário com X dourado (x 0..1). (0,0) = centro
export const MiniCal: React.FC<{ x: number; n: number }> = ({ x, n }) => (
  <g>
    <rect x={-56} y={-60} width={112} height={120} rx={10} {...S} />
    <line x1={-56} y1={-30} x2={56} y2={-30} {...S} />
    <line x1={-28} y1={-72} x2={-28} y2={-50} {...S} />
    <line x1={28} y1={-72} x2={28} y2={-50} {...S} />
    <text x={0} y={34} textAnchor="middle" fill="#fff" fontFamily={FONT} fontWeight={800} fontSize={40}>
      {n}
    </text>
    {x > 0 ? (
      <g>
        <line x1={-40} y1={-20} x2={-40 + 80 * Math.min(1, x * 2)} y2={-20 + 74 * Math.min(1, x * 2)} {...SG} strokeWidth={6} />
        {x > 0.5 ? <line x1={40} y1={-20} x2={40 - 80 * (x - 0.5) * 2} y2={-20 + 74 * (x - 0.5) * 2} {...SG} strokeWidth={6} /> : null}
      </g>
    ) : null}
  </g>
);

// Etiqueta "PIX"
export const PixTag: React.FC = () => (
  <g>
    <path d="M -70 -40 L 50 -40 L 80 0 L 50 40 L -70 40 Z" {...S} />
    <circle cx={-46} cy={0} r={8} {...S} />
    <text x={12} y={14} textAnchor="middle" fill={GOLD} fontFamily={FONT} fontWeight={800} fontSize={38} letterSpacing={3}>
      PIX
    </text>
  </g>
);

// Ampulheta: rot em graus, sand 0..1 (quanto já escorreu)
export const Hourglass: React.FC<{ rot: number; sand: number }> = ({ rot, sand }) => (
  <g transform={`rotate(${rot})`}>
    <line x1={-46} y1={-66} x2={46} y2={-66} {...S} />
    <line x1={-46} y1={66} x2={46} y2={66} {...S} />
    <path d="M -36 -66 C -36 -20 -6 -10 -6 0 C -6 10 -36 20 -36 66 M 36 -66 C 36 -20 6 -10 6 0 C 6 10 36 20 36 66" {...S} />
    {/* areia de cima e de baixo */}
    <path d={`M ${-24 * (1 - sand)} ${-56 + 40 * sand} L ${24 * (1 - sand)} ${-56 + 40 * sand} L 0 -6 Z`} fill="#fff" opacity={1 - sand * 0.9} />
    <path d={`M -30 62 L 30 62 L ${30 - 26 * sand} ${62 - 44 * sand} L ${-30 + 26 * sand} ${62 - 44 * sand} Z`} fill="#fff" opacity={0.15 + sand * 0.85} />
    {sand > 0 && sand < 1 ? <line x1={0} y1={-4} x2={0} y2={58 - 44 * sand} stroke="#fff" strokeWidth={2} strokeDasharray="3 4" /> : null}
  </g>
);

// Moeda grande dourada com texto
export const BigCoin: React.FC<{ r: number; label: string }> = ({ r, label }) => (
  <g>
    <circle r={r} {...SG} fill="#050505" />
    <circle r={r * 0.8} {...SG} strokeWidth={2} />
    <text y={r * 0.13} textAnchor="middle" fill={GOLD} fontFamily={FONT} fontWeight={800} fontSize={r * 0.36} letterSpacing={1}>
      {label}
    </text>
  </g>
);
