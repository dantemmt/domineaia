import React from 'react';
import { interpolate, random, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion';

export const W = 1080;
export const H = 1920;
export const GROUND = Math.round(H * 0.6); // 1152
export const TEXT_Y = Math.round(H * 0.22); // 422
export const GOLD = '#D9AD45';
export const BLUE = '#9fd4ff';
export const FONT = "Inter, 'Inter Display', sans-serif";
export const SERIF = "'Liberation Serif', 'DejaVu Serif', serif";
export const GLOW = 'drop-shadow(0 0 6px rgba(255,255,255,0.55))';
export const GOLD_GLOW = 'drop-shadow(0 0 8px rgba(217,173,69,0.6))';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const ease = Easing.bezier(0.25, 0.1, 0.25, 1);

// Spring suave padrão a partir de um frame
export const useSpring = (from: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - from, fps, config: { damping: 18, stiffness: 120, mass: 0.8, ...cfg } });
};

export const brl = (v: number) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

// ---------------- Texto ----------------
export const Title: React.FC<{
  children: React.ReactNode;
  at: number;
  y?: number;
  size?: number;
  bold?: boolean;
  serif?: boolean;
  color?: string;
  maxWidth?: number;
  lineHeight?: number;
}> = ({ children, at, y = TEXT_Y, size = 52, bold = false, serif = false, color = '#fff', maxWidth = 840, lineHeight = 1.2 }) => {
  const s = useSpring(at, { damping: 20, stiffness: 140 });
  return (
    <div
      style={{
        position: 'absolute',
        left: (W - maxWidth) / 2,
        width: maxWidth,
        top: y,
        transform: `translateY(-50%) translateY(${(1 - s) * 24}px)`,
        opacity: s,
        textAlign: 'center',
        fontFamily: serif ? SERIF : FONT,
        fontWeight: bold ? 800 : serif ? 400 : 500,
        fontSize: size,
        letterSpacing: serif ? 6 : 3,
        lineHeight,
        color,
        textTransform: 'uppercase',
        textShadow: color === GOLD ? '0 0 18px rgba(217,173,69,0.45)' : '0 0 14px rgba(255,255,255,0.35)',
        filter: `blur(${(1 - s) * 6}px)`,
      }}
    >
      {children}
    </div>
  );
};

// ---------------- Pessoa (pictograma) ----------------
export const Person: React.FC<{
  x: number;
  ground?: number;
  glow?: number; // 0..1.5
  glowColor?: string;
  label?: string;
  scale?: number;
  opacity?: number;
  fill?: string;
  squash?: number; // 0..1 curva o personagem (peso nas costas)
}> = ({ x, ground = GROUND, glow = 0.6, glowColor = BLUE, label, scale = 1, opacity = 1, fill = '#fff', squash = 0 }) => {
  const w = 108 * scale * (1 + squash * 0.08);
  const bodyH = 205 * scale * (1 - squash * 0.2);
  const r = 42 * scale;
  const headCy = ground - bodyH - 18 * scale * (1 - squash * 0.6) - r;
  const lean = squash * 22 * scale;
  const g = Math.max(0, glow);
  const shadow = `drop-shadow(0 0 ${4 + 10 * g}px ${glowColor}) drop-shadow(0 0 ${2 + 26 * g}px ${glowColor}${Math.round(Math.min(1, 0.25 + g * 0.5) * 255)
    .toString(16)
    .padStart(2, '0')})`;
  return (
    <>
      <svg
        width={W}
        height={H}
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity, filter: shadow }}
      >
        <circle cx={x + lean} cy={headCy} r={r} fill={fill} stroke={glowColor} strokeWidth={3} />
        <rect x={x - w / 2} y={ground - bodyH} width={w} height={bodyH} rx={w / 2} fill={fill} stroke={glowColor} strokeWidth={3} />
      </svg>
      {label ? (
        <div
          style={{
            position: 'absolute',
            left: x - 150,
            width: 300,
            top: ground + 26,
            textAlign: 'center',
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: 8,
            color: '#fff',
            opacity: 0.85 * opacity,
          }}
        >
          {label}
        </div>
      ) : null}
    </>
  );
};

// ---------------- Chão tracejado ----------------
export const Ground: React.FC<{ opacity?: number; shake?: number }> = ({ opacity = 1, shake = 0 }) => (
  <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: shake, opacity, filter: GLOW }}>
    <line x1={-200} x2={W + 200} y1={GROUND} y2={GROUND} stroke="#fff" strokeOpacity={0.55} strokeWidth={3} strokeDasharray="18 14" />
  </svg>
);

// ---------------- Contador dourado ----------------
export const Counter: React.FC<{ value: number; y?: number; size?: number; x?: number; opacity?: number; scale?: number }> = ({
  value,
  y = 760,
  size = 120,
  x = W / 2,
  opacity = 1,
  scale = 1,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 450,
      width: 900,
      top: y,
      transform: `translateY(-50%) scale(${scale})`,
      textAlign: 'center',
      fontFamily: FONT,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: 3,
      color: GOLD,
      opacity,
      fontVariantNumeric: 'tabular-nums',
      textShadow: '0 0 24px rgba(217,173,69,0.5)',
    }}
  >
    {brl(value)}
  </div>
);

// ---------------- Glitch horizontal (fatias) ----------------
export const Glitch: React.FC<{ active: boolean; seed: string | number; children: React.ReactNode; strength?: number }> = ({
  active,
  seed,
  children,
  strength = 40,
}) => {
  const frame = useCurrentFrame();
  if (!active) return <>{children}</>;
  const bands = 7;
  const cuts = new Array(bands + 1).fill(0).map((_, i) => (i === 0 ? 0 : i === bands ? 100 : random(`${seed}-c-${frame}-${i}`) * 100)).sort((a, b) => a - b);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {cuts.slice(0, -1).map((top, i) => {
        const bottom = 100 - cuts[i + 1];
        const dx = (random(`${seed}-x-${frame}-${i}`) - 0.5) * 2 * strength;
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, clipPath: `inset(${top}% 0 ${bottom}% 0)`, transform: `translateX(${dx}px)` }}>
            {children}
          </div>
        );
      })}
      {/* franja RGB sutil */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${strength * 0.25}px)`, opacity: 0.25, mixBlendMode: 'screen', filter: 'grayscale(1) brightness(1.4)' }}>
        {children}
      </div>
    </div>
  );
};

// ---------------- Cena: zoom 1.0→1.04 + transição (fade 6f ou glitch 4f) ----------------
export const SceneFrame: React.FC<{
  start: number;
  duration: number;
  transition?: 'fade' | 'glitch';
  children: React.ReactNode;
  ground?: boolean;
  shake?: number;
}> = ({ start, duration, transition = 'fade', children, ground = true, shake = 0 }) => {
  const frame = useCurrentFrame() - start;
  const zoom = interpolate(frame, [0, duration], [1, 1.04], clamp);
  const fadeIn = transition === 'fade' ? interpolate(frame, [0, 6], [0, 1], clamp) : 1;
  const content = (
    <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '50% 50%' }}>
      {ground ? <Ground shake={shake} /> : null}
      {children}
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fadeIn }}>
      {transition === 'glitch' ? (
        <Glitch active={frame < 4} seed="scene" strength={60}>
          {content}
        </Glitch>
      ) : (
        content
      )}
    </div>
  );
};
