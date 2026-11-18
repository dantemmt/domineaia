import React from 'react';
import { GOLD, FONT } from './ui';

const S = { fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const SG = { ...S, stroke: GOLD } as const;

// Cartão de crédito — frente (borda e chip dourados). (0,0) = centro
export const CardFront: React.FC<{ w?: number; h?: number }> = ({ w = 440, h = 270 }) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={24} {...SG} fill="rgba(5,5,5,0.92)" />
    <rect x={-w / 2 + 34} y={-h / 2 + 62} width={66} height={50} rx={8} {...SG} />
    <path d={`M ${-w / 2 + 34} ${-h / 2 + 87} L ${-w / 2 + 100} ${-h / 2 + 87} M ${-w / 2 + 67} ${-h / 2 + 62} L ${-w / 2 + 67} ${-h / 2 + 112}`} {...SG} strokeWidth={2} />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${-w / 2 + 122 + i * 12} ${-h / 2 + 72 - i * 2} C ${-w / 2 + 130 + i * 12} ${-h / 2 + 82} ${-w / 2 + 130 + i * 12} ${-h / 2 + 92} ${-w / 2 + 122 + i * 12} ${-h / 2 + 102 + i * 2}`} {...S} strokeWidth={2.5} />
    ))}
    <text x={-w / 2 + 34} y={h / 2 - 82} fill="#fff" fontFamily={FONT} fontWeight={700} fontSize={26} letterSpacing={6}>
      •••• •••• •••• 4821
    </text>
    <text x={-w / 2 + 34} y={h / 2 - 34} fill="#fff" fontFamily={FONT} fontWeight={600} fontSize={18} letterSpacing={6} opacity={0.8}>
      VOCÊ
    </text>
    <circle cx={w / 2 - 74} cy={h / 2 - 44} r={20} {...S} />
    <circle cx={w / 2 - 50} cy={h / 2 - 44} r={20} {...S} />
  </g>
);
export const CardBack: React.FC<{ w?: number; h?: number }> = ({ w = 440, h = 270 }) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={24} {...SG} fill="rgba(5,5,5,0.92)" />
    <rect x={-w / 2} y={-h / 2 + 40} width={w} height={50} fill="#fff" opacity={0.85} />
    <rect x={-w / 2 + 30} y={-h / 2 + 120} width={w * 0.55} height={40} rx={4} {...S} />
  </g>
);

// Banco (prédio com colunas). base = 0
export const Bank: React.FC = () => (
  <g>
    <path d="M -210 -300 L 0 -400 L 210 -300 Z" {...S} />
    <line x1={-220} x2={220} y1={-280} y2={-280} {...S} />
    {[-160, -80, 0, 80, 160].map((x) => (
      <g key={x}>
        <line x1={x - 16} x2={x - 16} y1={-262} y2={-40} {...S} />
        <line x1={x + 16} x2={x + 16} y1={-262} y2={-40} {...S} />
      </g>
    ))}
    <line x1={-230} x2={230} y1={-30} y2={-30} {...S} />
    <line x1={-250} x2={250} y1={0} y2={0} {...S} />
    <circle cx={0} cy={-336} r={14} {...S} />
  </g>
);

// Carteira
export const Wallet: React.FC = () => (
  <g>
    <rect x={-60} y={-40} width={120} height={84} rx={12} {...S} />
    <path d="M -52 -40 L 30 -64 L 40 -40" {...S} />
    <rect x={18} y={-14} width={50} height={32} rx={8} {...S} />
    <circle cx={34} cy={2} r={5} fill="#fff" />
  </g>
);

// Cursor (ponta em 0,0)
export const Cursor: React.FC = () => (
  <g>
    <path d="M 0 0 L 0 46 L 12 34 L 22 56 L 30 52 L 20 31 L 36 31 Z" fill="#050505" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
  </g>
);

// Pedaço de confete
export const Confetti: React.FC<{ kind: number }> = ({ kind }) =>
  kind % 3 === 0 ? <rect x={-8} y={-4} width={16} height={8} {...S} strokeWidth={2.5} /> : kind % 3 === 1 ? <path d="M -10 0 C -5 -8 5 8 10 0" {...S} strokeWidth={2.5} /> : <circle r={5} {...S} strokeWidth={2.5} />;
