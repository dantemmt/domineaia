import React from 'react';
import { GOLD, FONT } from './ui';

// Ícones do vídeo 3 — traço branco 3px, centrados em (0,0) salvo indicação.
const S = { fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

// ---------- Planta do supermercado vista de cima ----------
export const MAP = { x0: 140, x1: 940, y0: 540, y1: 1340 };
export const SHELF_X = [230, 350, 470, 590, 710, 830]; // borda esquerda de cada prateleira (largura 30)
export const SHELF_Y = [660, 1180];
export const RICE = { x: 870, y: 598 };
// caminho em serpentina pelos corredores até o arroz
export const SNAKE: [number, number][] = [
  [770, 1330], [770, 1225], [305, 1225], [305, 622], [425, 622], [425, 1218], [545, 1218], [545, 622],
  [665, 622], [665, 1218], [785, 1218], [785, 622], [RICE.x - 26, RICE.y + 12],
];
// caminho direto: porta → arroz → caixa
export const DIRECT: [number, number][] = [[770, 1330], [785, 1225], [785, 622], [RICE.x - 26, RICE.y + 12], [785, 622], [785, 1240], [330, 1270]];

export const pathPoint = (pts: [number, number][], p: number): [number, number] => {
  const seg = pts.slice(1).map((b, i) => Math.hypot(b[0] - pts[i][0], b[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, p)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const k = seg[i] === 0 ? 0 : Math.min(1, d / seg[i]);
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= seg[i];
  }
  return pts[pts.length - 1];
};
export const pathLen = (pts: [number, number][]) => pts.slice(1).reduce((a, b, i) => a + Math.hypot(b[0] - pts[i][0], b[1] - pts[i][1]), 0);

export const StoreMap: React.FC<{ door?: number; riceGlow?: number }> = ({ door = 1, riceGlow = 1 }) => {
  const { x0, x1, y0, y1 } = MAP;
  return (
    <g>
      {/* paredes com abertura da porta (720–820) */}
      <path d={`M 720 ${y1} L ${x0} ${y1} L ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L 820 ${y1}`} {...S} />
      {/* portas automáticas deslizando */}
      <line x1={720} y1={y1} x2={770 - 50 * door} y2={y1} {...S} strokeWidth={5} />
      <line x1={820} y1={y1} x2={770 + 50 * door} y2={y1} {...S} strokeWidth={5} />
      {/* prateleiras */}
      {SHELF_X.map((x) => (
        <g key={x}>
          <rect x={x} y={SHELF_Y[0]} width={30} height={SHELF_Y[1] - SHELF_Y[0]} rx={3} {...S} />
          {[0.2, 0.4, 0.6, 0.8].map((k) => (
            <line key={k} x1={x} x2={x + 30} y1={SHELF_Y[0] + (SHELF_Y[1] - SHELF_Y[0]) * k} y2={SHELF_Y[0] + (SHELF_Y[1] - SHELF_Y[0]) * k} {...S} strokeWidth={1.5} strokeOpacity={0.5} />
          ))}
        </g>
      ))}
      {/* prateleira do fundo */}
      <line x1={x0 + 20} x2={x1 - 20} y1={y0 + 20} y2={y0 + 20} {...S} strokeOpacity={0.6} />
      {/* caixas na entrada */}
      {[200, 330, 460].map((x) => (
        <g key={x}>
          <rect x={x} y={1266} width={80} height={36} rx={4} {...S} />
          <rect x={x + 54} y={1272} width={18} height={14} rx={2} {...S} strokeWidth={2} />
        </g>
      ))}
      {/* arroz no fundo, brilhando */}
      <g transform={`translate(${RICE.x} ${RICE.y})`}>
        <circle r={58 + 10 * riceGlow} fill="rgba(255,255,255,0.10)" opacity={riceGlow} />
        <circle r={40 + 6 * riceGlow} fill="rgba(255,255,255,0.14)" opacity={riceGlow} />
        <g style={{ filter: `drop-shadow(0 0 ${8 + 10 * riceGlow}px rgba(255,255,255,0.9))` }}>
          <RiceBag s={0.75} />
        </g>
      </g>
    </g>
  );
};

export const RiceBag: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <path d="M -34 -40 L 34 -40 L 40 44 L -40 44 Z" {...S} fill="rgba(5,5,5,0.9)" />
    <path d="M -34 -40 L -26 -52 L 26 -52 L 34 -40" {...S} />
    <path d="M -16 6 C -8 -10 8 -10 16 6 C 8 22 -8 22 -16 6 Z" {...S} strokeWidth={2.5} />
  </g>
);

// ---------- Produtos (pequenos) ----------
export const Product: React.FC<{ kind: string }> = ({ kind }) => {
  switch (kind) {
    case 'chocolate':
      return (
        <g>
          <rect x={-40} y={-22} width={80} height={44} rx={4} {...S} />
          <line x1={-14} x2={-14} y1={-22} y2={22} {...S} strokeWidth={2} />
          <line x1={14} x2={14} y1={-22} y2={22} {...S} strokeWidth={2} />
          <line x1={-40} x2={40} y1={0} y2={0} {...S} strokeWidth={2} />
        </g>
      );
    case 'biscoito':
      return (
        <g>
          <circle r={30} {...S} />
          {[[-10, -8], [8, -12], [12, 8], [-8, 12], [0, 0]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={3} fill="#fff" />
          ))}
        </g>
      );
    case 'vinho':
      return (
        <g>
          <path d="M -6 -46 L 6 -46 L 6 -24 C 18 -18 18 -10 18 0 L 18 40 L -18 40 L -18 0 C -18 -10 -18 -18 -6 -24 Z" {...S} />
          <rect x={-12} y={4} width={24} height={20} {...S} strokeWidth={2} />
        </g>
      );
    case 'queijo':
      return (
        <g>
          <path d="M -40 20 L 40 20 L 40 -6 L -40 -24 Z" {...S} />
          <circle cx={-8} cy={2} r={5} {...S} strokeWidth={2} />
          <circle cx={18} cy={8} r={4} {...S} strokeWidth={2} />
        </g>
      );
    case 'refri':
      return (
        <g>
          <rect x={-20} y={-36} width={40} height={72} rx={8} {...S} />
          <line x1={-20} x2={20} y1={-24} y2={-24} {...S} strokeWidth={2} />
          <line x1={-20} x2={20} y1={24} y2={24} {...S} strokeWidth={2} />
        </g>
      );
    case 'salgadinho':
      return (
        <g>
          <path d="M -28 -38 L 28 -38 L 24 38 L -24 38 Z" {...S} />
          <path d="M -28 -38 L -22 -30 L -16 -38 L -10 -30 L -4 -38 L 2 -30 L 8 -38 L 14 -30 L 20 -38 L 28 -38" {...S} strokeWidth={2} />
          <path d="M -10 4 L 10 -6 L 6 16 Z" {...S} strokeWidth={2} />
        </g>
      );
    case 'sorvete':
      return (
        <g>
          <rect x={-34} y={-24} width={68} height={50} rx={6} {...S} />
          <rect x={-38} y={-34} width={76} height={12} rx={4} {...S} />
          <path d="M -12 0 C -12 -12 12 -12 12 0" {...S} strokeWidth={2} />
        </g>
      );
    case 'paodealho':
      return (
        <g>
          <path d="M -44 10 C -44 -16 44 -16 44 10 C 44 22 -44 22 -44 10 Z" {...S} />
          {[-24, -6, 12, 30].map((x) => (
            <line key={x} x1={x} x2={x - 8} y1={-6} y2={14} {...S} strokeWidth={2} />
          ))}
        </g>
      );
    default:
      return <RiceBag s={0.7} />;
  }
};

// ---------- Carrinho de lado (base das rodas = 0) ----------
export const CartSide: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <path d="M -110 -150 L -84 -150 L -64 -40 L 80 -40 L 96 -120 L -74 -120" {...S} />
    <line x1={-70} y1={-92} x2={88} y2={-92} {...S} strokeWidth={2} strokeOpacity={0.6} />
    <line x1={-66} y1={-66} x2={84} y2={-66} {...S} strokeWidth={2} strokeOpacity={0.6} />
    {[-30, 10, 50].map((x) => (
      <line key={x} x1={x} y1={-120} x2={x - 4} y2={-40} {...S} strokeWidth={2} strokeOpacity={0.6} />
    ))}
    <path d="M -64 -40 L -56 -22 L 70 -22" {...S} />
    <circle cx={-46} cy={-11} r={11} {...S} />
    <circle cx={60} cy={-11} r={11} {...S} />
  </g>
);

// ---------- Olho (dir: graus para onde aponta o feixe) ----------
export const Eye: React.FC<{ down?: boolean }> = ({ down = false }) => (
  <g>
    <path d="M -50 0 C -24 -32 24 -32 50 0 C 24 32 -24 32 -50 0 Z" {...S} />
    <circle cx={down ? 0 : 6} cy={down ? 10 : 0} r={13} fill="#fff" />
    {down ? <path d="M 0 40 L 0 70 M -10 60 L 0 72 L 10 60" {...S} /> : null}
  </g>
);

// ---------- Mão (aberta, apontando para baixo para pegar) ----------
export const Hand: React.FC = () => (
  <g>
    <path d="M -22 -60 L -22 0 C -22 18 22 18 22 0 L 22 -60" {...S} />
    <path d="M -22 0 L -34 -16" {...S} />
    {[-14, -2, 10].map((x) => (
      <path key={x} d={`M ${x} 10 L ${x} 30`} {...S} />
    ))}
    <path d="M 22 4 L 30 24" {...S} />
  </g>
);

// ---------- Relógio (a = ângulo do ponteiro) ----------
export const Clock: React.FC<{ a: number }> = ({ a }) => (
  <g>
    <circle r={50} {...S} />
    {new Array(12).fill(0).map((_, i) => (
      <line key={i} x1={0} y1={-42} x2={0} y2={-36} {...S} strokeWidth={2} transform={`rotate(${i * 30})`} />
    ))}
    <line x1={0} y1={0} x2={0} y2={-34} {...S} transform={`rotate(${a})`} />
    <line x1={0} y1={0} x2={0} y2={-22} {...S} transform={`rotate(${a / 12})`} />
    <circle r={4} fill="#fff" />
  </g>
);

// ---------- Nota musical ----------
export const MusicNote: React.FC<{ double?: boolean }> = ({ double }) =>
  double ? (
    <g>
      <ellipse cx={-22} cy={24} rx={12} ry={9} {...S} transform="rotate(-20 -22 24)" />
      <ellipse cx={22} cy={16} rx={12} ry={9} {...S} transform="rotate(-20 22 16)" />
      <path d="M -11 22 L -11 -30 L 33 -38 L 33 14" {...S} />
    </g>
  ) : (
    <g>
      <ellipse cx={-8} cy={24} rx={12} ry={9} {...S} transform="rotate(-20 -8 24)" />
      <path d="M 3 22 L 3 -34 C 12 -24 22 -20 20 -6" {...S} />
    </g>
  );

// ---------- Caixa registradora ----------
export const Register: React.FC = () => (
  <g>
    <rect x={-70} y={-110} width={140} height={110} rx={6} {...S} />
    <rect x={-40} y={-170} width={80} height={44} rx={4} {...S} />
    <line x1={0} y1={-126} x2={0} y2={-110} {...S} />
    <rect x={-50} y={-90} width={60} height={30} rx={3} {...S} strokeWidth={2} />
  </g>
);

// ---------- Papel com lista / prato com talheres ----------
export const ListPaper: React.FC = () => (
  <g>
    <rect x={-40} y={-52} width={80} height={104} rx={6} {...S} />
    {[-26, -6, 14, 34].map((y) => (
      <g key={y}>
        <path d={`M -28 ${y} L -22 ${y + 6} L -14 ${y - 4}`} {...S} strokeWidth={2.5} />
        <line x1={-6} x2={28} y1={y + 1} y2={y + 1} {...S} strokeWidth={2.5} />
      </g>
    ))}
  </g>
);
export const Plate: React.FC = () => (
  <g>
    <circle r={40} {...S} />
    <circle r={26} {...S} strokeWidth={2} />
    <path d="M -62 -36 L -62 40 M -70 -36 L -70 -14 C -70 -6 -54 -6 -54 -14 L -54 -36" {...S} />
    <path d="M 60 40 L 60 -36 C 72 -26 72 -6 60 -4" {...S} />
  </g>
);

// ---------- Impressora térmica (topo do papel = 0) ----------
export const Printer: React.FC<{ w: number }> = ({ w }) => (
  <g>
    <rect x={-w / 2 - 30} y={-86} width={w + 60} height={80} rx={14} {...S} fill="rgba(5,5,5,0.95)" />
    <line x1={-w / 2 - 6} x2={w / 2 + 6} y1={-6} y2={-6} {...S} strokeWidth={5} />
    <circle cx={w / 2 + 6} cy={-60} r={6} fill="#fff" />
    <text x={-w / 2} y={-38} fill="#fff" fontFamily={FONT} fontWeight={700} fontSize={18} letterSpacing={4} opacity={0.7}>
      CAIXA 03
    </text>
  </g>
);

export const GoldDot: React.FC<{ r?: number }> = ({ r = 12 }) => <circle r={r} fill={GOLD} />;
