import React from 'react';
import { GOLD, GLOW, GOLD_GLOW, FONT } from './ui';

// Todos os ícones: traço branco fino (3px), pictograma minimalista, desenhados em SVG.
// Cada ícone é centrado em (0,0) dentro de um <g>; use <Icon x y scale> para posicionar.

const S = { fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const SG = { ...S, stroke: GOLD } as const;

export const Icon: React.FC<{ x: number; y: number; scale?: number; rotate?: number; opacity?: number; gold?: boolean; children: React.ReactNode }> = ({
  x,
  y,
  scale = 1,
  rotate = 0,
  opacity = 1,
  gold = false,
  children,
}) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity, filter: gold ? GOLD_GLOW : GLOW }}>
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>{children}</g>
  </svg>
);

// Lâmpada pendurada (cabo a partir do topo). (0,0) = centro do bulbo
export const Lamp: React.FC<{ on: number; cordTop: number }> = ({ on, cordTop }) => (
  <g>
    <line x1={0} y1={cordTop} x2={0} y2={-58} {...S} />
    <rect x={-18} y={-62} width={36} height={22} rx={4} {...S} />
    <path d="M -16 -40 C -46 -20 -50 25 -22 50 L 22 50 C 50 25 46 -20 16 -40 Z" {...S} fill={`rgba(255,255,255,${0.9 * on})`} />
    <path d="M -10 48 L -6 20 L 0 32 L 6 20 L 10 48" {...S} stroke={on > 0.5 ? '#111' : '#fff'} strokeWidth={2.5} />
  </g>
);

// Calendário de destacar (base = 0, largura 200)
export const Calendar: React.FC<{ day: number | string; flip?: number }> = ({ day, flip = 0 }) => (
  <g>
    <rect x={-100} y={-230} width={200} height={230} rx={14} {...S} />
    <line x1={-100} y1={-175} x2={100} y2={-175} {...S} />
    <line x1={-55} y1={-250} x2={-55} y2={-210} {...S} />
    <line x1={55} y1={-250} x2={55} y2={-210} {...S} />
    <text x={0} y={-192} textAnchor="middle" fill="#fff" fontFamily={FONT} fontWeight={700} fontSize={26} letterSpacing={6}>
      DIA
    </text>
    <text x={0} y={-48} textAnchor="middle" fill="#fff" fontFamily={FONT} fontWeight={800} fontSize={104} letterSpacing={2}>
      {day}
    </text>
    {flip > 0 && flip < 1 ? (
      // folha virando para cima
      <g transform={`translate(0 -175) scale(1 ${Math.cos(flip * Math.PI)})`}>
        <rect x={-96} y={0} width={192} height={170} rx={8} {...S} fill="#050505" />
      </g>
    ) : null}
  </g>
);

// Celular de linha. (0,0) = centro
export const Phone: React.FC = () => (
  <g>
    <rect x={-115} y={-210} width={230} height={420} rx={34} {...S} />
    <line x1={-28} y1={-188} x2={28} y2={-188} {...S} />
    <circle cx={0} cy={186} r={10} {...S} />
  </g>
);

// Cérebro de linha. (0,0) = centro
export const Brain: React.FC = () => (
  <g>
    <path
      d="M -4 -62 C -30 -78 -66 -60 -64 -32 C -92 -24 -94 14 -70 26 C -76 52 -46 72 -22 60 C -12 74 0 70 -4 56 Z"
      {...S}
    />
    <path d="M 4 -62 C 30 -78 66 -60 64 -32 C 92 -24 94 14 70 26 C 76 52 46 72 22 60 C 12 74 0 70 4 56 Z" {...S} />
    <path d="M -40 -30 C -24 -24 -24 -6 -40 0 M -52 20 C -36 14 -22 22 -24 38" {...S} />
    <path d="M 40 -30 C 24 -24 24 -6 40 0 M 52 20 C 36 14 22 22 24 38" {...S} />
  </g>
);

// Duas canecas brindando
export const Cheers: React.FC = () => (
  <g>
    <g transform="rotate(-14) translate(-44 0)">
      <rect x={-30} y={-40} width={60} height={80} rx={6} {...S} />
      <path d="M -30 -20 C -54 -20 -54 20 -30 20" {...S} />
      <path d="M -30 -40 C -24 -54 -8 -56 0 -46 C 8 -58 26 -52 30 -40" {...S} />
    </g>
    <g transform="rotate(14) translate(44 0)">
      <rect x={-30} y={-40} width={60} height={80} rx={6} {...S} />
      <path d="M 30 -20 C 54 -20 54 20 30 20" {...S} />
      <path d="M -30 -40 C -26 -54 -8 -56 0 -46 C 8 -58 24 -54 30 -40" {...S} />
    </g>
    <path d="M 0 -78 L 0 -96 M -18 -72 L -28 -86 M 18 -72 L 28 -86" {...S} />
  </g>
);

// Caixa de tênis
export const ShoeBox: React.FC = () => (
  <g>
    <rect x={-70} y={-10} width={140} height={60} rx={4} {...S} />
    <rect x={-78} y={-24} width={156} height={16} rx={3} {...S} />
    <path d="M -56 -24 L -56 -48 C -40 -50 -30 -62 -24 -70 L -8 -62 C 2 -50 30 -48 56 -40 C 62 -36 62 -28 58 -24" {...S} />
    <path d="M -24 -60 L -16 -52 M -16 -66 L -8 -58" {...S} />
  </g>
);

// Moto de delivery
export const Moto: React.FC = () => (
  <g>
    <circle cx={-56} cy={30} r={24} {...S} />
    <circle cx={60} cy={30} r={24} {...S} />
    <path d="M -56 30 L -20 30 L 0 0 L 40 0 L 60 30" {...S} />
    <path d="M 40 0 L 30 -36 L 46 -36" {...S} />
    <rect x={-70} y={-48} width={50} height={44} rx={4} {...S} />
    <path d="M -20 30 C -14 6 6 4 18 12" {...S} />
    <path d="M -96 -20 L -80 -20 M -104 0 L -82 0" {...S} />
  </g>
);

// Carrinho de mercado
export const Cart: React.FC = () => (
  <g>
    <path d="M -80 -50 L -60 -50 L -40 30 L 50 30" {...S} />
    <path d="M -54 -30 L 70 -30 L 56 14 L -44 14" {...S} />
    <line x1={-20} y1={-30} x2={-14} y2={14} {...S} />
    <line x1={14} y1={-30} x2={14} y2={14} {...S} />
    <line x1={46} y1={-30} x2={40} y2={14} {...S} />
    <circle cx={-30} cy={48} r={10} {...S} />
    <circle cx={38} cy={48} r={10} {...S} />
  </g>
);

// Casa
export const House: React.FC = () => (
  <g>
    <path d="M -76 -6 L 0 -70 L 76 -6" {...S} />
    <path d="M -58 -20 L -58 54 L 58 54 L 58 -20" {...S} />
    <rect x={-16} y={10} width={32} height={44} {...S} />
    <rect x={26} y={-6} width={20} height={20} {...S} />
    <path d="M 38 -42 L 38 -64 L 52 -64 L 52 -30" {...S} />
  </g>
);

// Cofre dourado. base = 0, largura 200. doorOpen 0..1, dial em graus
export const Vault: React.FC<{ dial?: number; doorOpen?: number }> = ({ dial = 0, doorOpen = 0 }) => (
  <g>
    <rect x={-100} y={-200} width={200} height={186} rx={14} {...SG} />
    <rect x={-80} y={-182} width={160} height={150} rx={8} {...SG} strokeOpacity={0.6} />
    <g transform={`translate(-80 -182) scale(${1 - doorOpen * 0.85} 1)`}>
      <rect x={0} y={0} width={160} height={150} rx={8} {...SG} fill="#050505" />
      <g transform={`translate(80 75) rotate(${dial})`}>
        <circle r={34} {...SG} />
        <circle r={8} {...SG} />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line key={a} x1={0} y1={-34} x2={0} y2={-46} {...SG} transform={`rotate(${a})`} />
        ))}
      </g>
      <line x1={138} y1={56} x2={138} y2={94} {...SG} />
    </g>
    <line x1={-80} y1={-14} x2={-80} y2={0} {...SG} />
    <line x1={80} y1={-14} x2={80} y2={0} {...SG} />
  </g>
);

// Pilha de moedas douradas (base = 0)
export const CoinStack: React.FC<{ count: number; x?: number }> = ({ count, x = 0 }) => (
  <g>
    {new Array(Math.max(0, Math.floor(count))).fill(0).map((_, i) => (
      <g key={i} transform={`translate(${x} ${-i * 14 - 10})`}>
        <ellipse rx={30} ry={9} {...SG} fill="#050505" />
        <path d="M -30 0 L -30 6 C -30 18 30 18 30 6 L 30 0" {...SG} />
      </g>
    ))}
  </g>
);

// Moeda solta (centro)
export const Coin: React.FC<{ r?: number }> = ({ r = 22 }) => (
  <g>
    <circle r={r} {...SG} fill="#050505" />
    <circle r={r * 0.62} {...SG} strokeWidth={2} />
  </g>
);

// Bilhete de papel com alfinete. (0,0) = alfinete
export const Note: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <g>
    <path d={`M ${-w / 2} 20 L ${w / 2} 20 L ${w / 2} ${20 + h - 40} L ${w / 2 - 40} ${20 + h} L ${-w / 2} ${20 + h} Z`} {...S} fill="rgba(5,5,5,0.85)" />
    <path d={`M ${w / 2} ${20 + h - 40} L ${w / 2 - 40} ${20 + h - 40} L ${w / 2 - 40} ${20 + h}`} {...S} />
    <circle cx={0} cy={6} r={14} {...S} fill="#050505" />
    <line x1={0} y1={20} x2={0} y2={46} {...S} />
  </g>
);
