import React from 'react';
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import T from './timeline.json';
import { W, H, GROUND, GOLD, FONT, GLOW, clamp, useSpring, Title, Person, Glitch, SceneFrame } from './ui';
import { Icon, Note, Brain } from './icons';

const dur = (k: keyof typeof T.scenes) => T.scenes[k][1] - T.scenes[k][0];
const cubic = Easing.out(Easing.cubic);
const S = { fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const Impact: React.FC<{ at: number; y: number; size: number; children: React.ReactNode }> = ({ at, y, size, children }) => {
  const s = useSpring(at, { damping: 12, stiffness: 160 });
  return (
    <div style={{ position: 'absolute', left: 120, width: 840, top: y, transform: `translateY(-50%) scale(${interpolate(s, [0, 1], [1.2, 1])})`, opacity: interpolate(s, [0, 0.3], [0, 1], clamp), textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.12, letterSpacing: 3, color: '#fff', textShadow: '0 0 22px rgba(255,255,255,0.45)' }}>
      {children}
    </div>
  );
};
const Gold: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: GOLD, textShadow: '0 0 16px rgba(217,173,69,0.5)', whiteSpace: 'nowrap' }}>{children}</span>;
const Small: React.FC<{ at: number; y: number; children: React.ReactNode; size?: number }> = ({ at, y, children, size = 22 }) => {
  const s = useSpring(at);
  return (
    <div style={{ position: 'absolute', left: 120, width: 840, top: y, opacity: s * 0.85, transform: `translateY(${(1 - s) * 10}px)`, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.45, letterSpacing: 3, color: '#fff' }}>
      {children}
    </div>
  );
};

// ---------- ícones ----------
const TV: React.FC = () => (
  <g>
    <rect x={-150} y={-100} width={300} height={190} rx={12} {...S} fill="rgba(5,5,5,0.92)" />
    <rect x={-134} y={-84} width={268} height={158} rx={6} {...S} strokeWidth={2} strokeOpacity={0.5} />
    <path d="M -40 90 L -60 130 M 40 90 L 60 130 M -80 130 L 80 130" {...S} />
    <path d="M -110 -60 L -70 -20 M -110 -30 L -90 -10" {...S} strokeWidth={2} strokeOpacity={0.5} />
  </g>
);
const Stopwatch: React.FC<{ a: number }> = ({ a }) => (
  <g>
    <circle r={70} {...S} />
    <rect x={-14} y={-96} width={28} height={16} rx={4} {...S} />
    <line x1={0} y1={0} x2={0} y2={-56} {...S} strokeWidth={4} transform={`rotate(${a})`} />
    <circle r={6} fill="#fff" />
  </g>
);

// Preço riscado + novo preço
const PriceTag: React.FC<{ f: number }> = ({ f }) => {
  const T1 = T.s1;
  const tag = useSpring(T1.tag, { damping: 12 });
  const strike = interpolate(f, [T1.strike, T1.strikeEnd], [0, 1], { ...clamp, easing: cubic });
  const np = spring({ frame: f - T1.newPrice, fps: 30, config: { damping: 8, stiffness: 220 } });
  return (
    <div style={{ position: 'absolute', left: 120, width: 840, top: 960, opacity: tag, textAlign: 'center', fontFamily: FONT }}>
      <span style={{ position: 'relative', display: 'inline-block', fontSize: 46, fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: 2 }}>
        DE R$ 3.999
        <span style={{ position: 'absolute', left: -6, top: '52%', height: 6, width: `calc(${strike * 100}% + 12px)`, background: '#fff', boxShadow: '0 0 10px #fff', transform: 'rotate(-4deg)' }} />
      </span>
      <div style={{ marginTop: 6, fontSize: 104, fontWeight: 900, color: GOLD, letterSpacing: 2, opacity: Math.min(1, np * 2), transform: `scale(${interpolate(np, [0, 1], [2.2, 1])})`, textShadow: '0 0 34px rgba(217,173,69,0.8)' }}>R$ 1.999</div>
    </div>
  );
};

// ===================== CENA 1 — A ISCA =====================
const QW = ['50%', 'OFF.', 'É', 'PROMOÇÃO', 'DE', 'VERDADE?'];
export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T1 = T.s1;
  const flick = f < 14 ? (random(`fl${f}`) > 0.45 ? 1 : 0.15) : 0.55 + 0.1 * Math.sin(f * 0.4);
  const prod = spring({ frame: f - T1.product, fps, config: { damping: 9, stiffness: 200 } });
  const badge = spring({ frame: f - T1.badge, fps, config: { damping: 8, stiffness: 240 } });
  const timer = useSpring(T1.timer, { damping: 12 });
  const stock = useSpring(T1.stock, { damping: 10 });
  const secs = Math.max(0, 599 - Math.floor((f - T1.timer) * 3.2));
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  const btn = useSpring(T1.buttons, { damping: 12, stiffness: 170 });
  const cIdx = T1.count.filter((c) => f >= c).length;
  const lastC = T1.count[cIdx - 1] ?? 0;
  const cPop = cIdx ? spring({ frame: f - lastC, fps, config: { damping: 9, stiffness: 220 } }) : 0;
  const ring = interpolate(f, [T1.count[0], T1.count[2] + 14], [1, 0], clamp);
  const cx = 540 + Math.sin((f - T1.buttons) * 0.17) * 170 * Math.min(1, (f - T1.buttons) / 12);
  const overSim = cx < 540;
  const blink = Math.floor(f / 6) % 2 === 0;
  return (
    <SceneFrame start={T.scenes.s1[0]} duration={dur('s1')} ground={false}>
      {/* letreiro neon BLACK FRIDAY piscando */}
      <div style={{ position: 'absolute', left: 120, width: 840, top: 250, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 66, letterSpacing: 10, color: 'transparent', WebkitTextStroke: '3px #fff', opacity: flick * interpolate(f, [T1.words - 4, T1.words + 4], [1, 0.0], clamp), textShadow: `0 0 ${20 * flick}px rgba(255,255,255,0.9)` }}>
        BLACK FRIDAY
      </div>
      {/* pergunta entrando palavra por palavra (substitui o letreiro) */}
      <div style={{ position: 'absolute', left: 120, width: 840, top: 240, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18, rowGap: 0, fontFamily: FONT, fontWeight: 900, fontSize: 70, letterSpacing: 2, color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.45)' }}>
        {QW.map((w, i) => {
          const s = spring({ frame: f - (T1.words + i * T1.wordStep), fps, config: { damping: 10, stiffness: 240, mass: 0.5 } });
          return (
            <span key={i} style={{ display: 'inline-block', opacity: Math.min(1, s * 2), transform: `translateY(${(1 - s) * 30}px) scale(${0.5 + s * 0.5})`, color: i < 2 ? GOLD : '#fff', whiteSpace: 'nowrap' }}>
              {w}
            </span>
          );
        })}
      </div>
      {/* produto batendo na tela */}
      <div style={{ position: 'absolute', left: 540 - 260, top: 760 - 200, width: 520, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12), rgba(255,255,255,0) 70%)', opacity: prod }} />
      <Icon x={540} y={760} scale={(0.5 + prod * 0.5) * 1.15} rotate={(1 - prod) * -10} opacity={Math.min(1, prod * 2)}>
        <TV />
        <text y={4} textAnchor="middle" fill="#fff" fontFamily={FONT} fontWeight={800} fontSize={26} letterSpacing={5}>SMART TV</text>
      </Icon>
      {/* selo -50% */}
      <div style={{ position: 'absolute', left: 735, top: 560, width: 150, height: 150, borderRadius: 75, border: `4px solid ${GOLD}`, background: 'rgba(5,5,5,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 48, color: GOLD, opacity: Math.min(1, badge * 2), transform: `scale(${interpolate(badge, [0, 1], [2.5, 1])}) rotate(${12 + Math.sin(f * 0.2) * 4}deg)`, boxShadow: '0 0 26px rgba(217,173,69,0.6)' }}>
        -50%
      </div>
      <PriceTag f={f} />
      {/* cronômetro e estoque */}
      <div style={{ position: 'absolute', left: 150, top: 615, opacity: timer, transform: `scale(${0.7 + timer * 0.3})`, border: '3px solid #fff', borderRadius: 14, padding: '6px 14px', fontFamily: FONT, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: '#fff', background: 'rgba(5,5,5,0.9)', textAlign: 'center' }}>
        ACABA EM
        <div style={{ fontSize: 40, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>00:{mm}:{ss}</div>
      </div>
      <div style={{ position: 'absolute', left: 540 - 140, top: 1180, width: 280, opacity: stock * (f >= T1.buttons ? 0 : 1) * (blink ? 1 : 0.45), transform: `scale(${0.7 + stock * 0.3})`, border: '3px solid #fff', borderRadius: 30, padding: '8px 0', textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 26, letterSpacing: 4, color: '#050505', background: '#fff' }}>
        SÓ RESTAM 2!
      </div>
      {/* SIM / NÃO com contagem */}
      {f >= T1.buttons ? (
        <div style={{ position: 'absolute', inset: 0, opacity: btn }}>
          {[{ t: 'SIM', x: 300, on: overSim }, { t: 'NÃO', x: 780, on: !overSim }].map((b) => (
            <div key={b.t} style={{ position: 'absolute', left: b.x - 120, top: 1205, width: 240, height: 96, boxSizing: 'border-box', transform: `scale(${(0.7 + btn * 0.3) * (b.on ? 1.08 : 1)})`, border: '4px solid #fff', borderRadius: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 44, letterSpacing: 6, color: b.on ? '#050505' : '#fff', background: b.on ? '#fff' : 'rgba(5,5,5,0.9)', boxShadow: b.on ? '0 0 30px rgba(255,255,255,0.8)' : 'none' }}>
              {b.t}
            </div>
          ))}
          <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
            <circle cx={540} cy={1253} r={56} fill="#050505" stroke="rgba(255,255,255,0.25)" strokeWidth={6} />
            <circle cx={540} cy={1253} r={56} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeDasharray={2 * Math.PI * 56} strokeDashoffset={2 * Math.PI * 56 * (1 - ring)} transform="rotate(-90 540 1253)" style={{ filter: GLOW }} />
          </svg>
          <div style={{ position: 'absolute', left: 480, top: 1213, width: 120, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 64, lineHeight: '80px', color: '#fff', transform: `scale(${cIdx ? 0.6 + cPop * 0.4 : 1})` }}>
            {cIdx ? 4 - cIdx : ''}
          </div>
          <Icon x={cx} y={1290} scale={0.9}>
            <path d="M 0 0 L 0 46 L 12 34 L 22 56 L 30 52 L 20 31 L 36 31 Z" fill="#050505" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
          </Icon>
        </div>
      ) : null}
    </SceneFrame>
  );
};

// ===================== CENA 2 =====================
export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const g = f >= T.s2.glitch && f < T.s2.glitch + 6;
  return (
    <SceneFrame start={T.scenes.s2[0]} duration={dur('s2')} transition="glitch">
      <Glitch active={g} seed="s2" strength={40}>
        <Title at={T.s2.text} size={58} bold>SEU CÉREBRO JÁ DISSE SIM.</Title>
      </Glitch>
      <Icon x={540} y={700} scale={1 + 0.06 * Math.abs(Math.sin(f * 0.3))}>
        <Brain />
      </Icon>
      <div style={{ position: 'absolute', left: 540 - 60, top: 600, width: 120, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 34, color: GOLD, opacity: Math.abs(Math.sin(f * 0.3)) }}>✓</div>
      <Person x={540} glow={0.8 + 0.3 * Math.sin(f * 0.3)} label="VOCÊ" />
    </SceneFrame>
  );
};

// ===================== CENA 3 — HISTÓRICO DE PREÇO =====================
export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const g = useSpring(T.s3.graph, { damping: 14 });
  const p = interpolate(f, [T.s3.drawStart, T.s3.drawEnd], [0, 1], clamp);
  const X0 = 170, X1 = 910, YL = 1060, YH = 640; // R$ 1.999 = YL, R$ 3.999 = YH
  // pontos: set, out, início nov (sobe), meados nov, black friday (cai)
  const pts: [number, number][] = [[X0, YL], [X0 + 260, YL], [X0 + 400, YL], [X0 + 440, YH], [X0 + 620, YH], [X0 + 660, YL], [X1, YL]];
  const seg = pts.slice(1).map((b, i) => Math.hypot(b[0] - pts[i][0], b[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let d = total * p;
  const drawn: [number, number][] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (d >= seg[i]) { drawn.push(pts[i + 1]); d -= seg[i]; continue; }
    const k = d / seg[i];
    drawn.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]);
    break;
  }
  const head = drawn[drawn.length - 1];
  const lbl = (at: number, x: number, y: number, top: string, val: string) => {
    const s = spring({ frame: f - at, fps: 30, config: { damping: 11, stiffness: 180 } });
    return (
      <div style={{ position: 'absolute', left: x - 130, width: 260, top: y, opacity: f >= at ? s : 0, transform: `scale(${0.6 + s * 0.4})`, textAlign: 'center', fontFamily: FONT }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 3, color: '#fff' }}>{top}</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: GOLD, textShadow: '0 0 14px rgba(217,173,69,0.6)' }}>{val}</div>
      </div>
    );
  };
  return (
    <SceneFrame start={T.scenes.s3[0]} duration={dur('s3')} ground={false}>
      <Title at={T.s3.text} size={50}>AGORA OLHA O HISTÓRICO DE PREÇO.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: g }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
          <line x1={X0} x2={X1} y1={YL + 60} y2={YL + 60} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
          {[0.25, 0.5, 0.75].map((k) => (
            <line key={k} x1={X0} x2={X1} y1={YH + (YL - YH) * k} y2={YH + (YL - YH) * k} stroke="#fff" strokeOpacity={0.08} strokeWidth={2} strokeDasharray="6 10" />
          ))}
          <polyline points={drawn.map((q) => q.join(',')).join(' ')} fill="none" stroke={GOLD} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 10px rgba(217,173,69,0.8))' }} />
          {p > 0 && p < 1 ? <circle cx={head[0]} cy={head[1]} r={12} fill={GOLD} style={{ filter: 'drop-shadow(0 0 14px rgba(217,173,69,1))' }} /> : null}
        </svg>
        {['SET', 'OUT', 'NOV', 'BLACK'].map((m, i) => (
          <div key={m} style={{ position: 'absolute', left: X0 + [60, 300, 520, 700][i] - 60, width: 120, top: YL + 74, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 20, letterSpacing: 3, color: i === 3 ? '#fff' : 'rgba(255,255,255,0.7)' }}>{m}</div>
        ))}
        {lbl(T.s3.drawStart + 10, X0 + 160, YL - 110, 'OUTUBRO', 'R$ 1.999')}
        {lbl(T.s3.jump, X0 + 530, YH - 120, 'NOVEMBRO', 'R$ 3.999')}
        {lbl(T.s3.drop, X0 + 640, YL + 115, 'BLACK FRIDAY', 'R$ 1.999')}
      </div>
      <Impact at={T.s3.bold} y={1400} size={46}>
        O "DESCONTO" VOLTOU PRO PREÇO DE SEMPRE.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 4 — A RESPOSTA =====================
export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const lbl = useSpring(T.s4.label);
  const a = useSpring(T.s4.answer, { damping: 10 });
  return (
    <SceneFrame start={T.scenes.s4[0]} duration={dur('s4')} transition="glitch">
      <div style={{ position: 'absolute', left: 120, width: 840, top: 380, opacity: lbl * 0.85, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 28, letterSpacing: 8, color: '#fff' }}>A RESPOSTA:</div>
      <Impact at={T.s4.answer} y={540} size={96}>
        METADE DO DOBRO.
      </Impact>
      <Small at={T.s4.sub} y={720} size={34}>
        SOBE ANTES. "CAI" NA BLACK.
      </Small>
      {/* seta subindo e caindo */}
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, opacity: a, filter: GLOW }}>
        <path d={`M 300 1060 L 540 ${1060 - 220 * Math.min(1, a)} L 780 1060`} {...S} strokeWidth={6} />
        <path d="M 760 1030 L 780 1062 L 742 1066" {...S} strokeWidth={6} />
      </svg>
      <div style={{ position: 'absolute', left: 540 - 90, top: 790 + (1 - a) * 40, width: 180, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 30, color: GOLD, opacity: a }}>×2 ÷2</div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, opacity: f * 0 }} />
    </SceneFrame>
  );
};

// ===================== CENA 5 — ÂNCORA =====================
export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(f, [T.s5.boxStart, T.s5.boxEnd], [0, 1], { ...clamp, easing: cubic });
  const rev = useSpring(T.s5.reveal, { damping: 11, stiffness: 170 });
  const anchorDrop = interpolate(f, [T.s5.anchor - 14, T.s5.anchor], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const land = f >= T.s5.anchor ? spring({ frame: f - T.s5.anchor, fps, config: { damping: 7, stiffness: 200 } }) : 0;
  const bx = 150, by = 500, bw = 780, bh = 160, per = 2 * (bw + bh);
  const AY = interpolate(anchorDrop, [0, 1], [400, 900]) + (land ? (1 - land) * 20 : 0);
  return (
    <SceneFrame start={T.scenes.s5[0]} duration={dur('s5')}>
      <Title at={T.s5.text} size={74} serif>Isso tem nome.</Title>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
        <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} />
      </svg>
      <div style={{ position: 'absolute', left: bx, width: bw, top: by + bh / 2, transform: `translateY(-50%) scale(${interpolate(rev, [0, 1], [1.4, 1])})`, opacity: interpolate(rev, [0, 0.3], [0, 1], clamp), textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 72, letterSpacing: 4, color: '#fff', textShadow: '0 0 26px rgba(255,255,255,0.6)' }}>
        EFEITO ÂNCORA
      </div>
      {/* preço riscado no chão sendo "ancorado" */}
      <div style={{ position: 'absolute', left: 120, width: 840, top: 1000, textAlign: 'center', fontFamily: FONT, fontSize: 64, fontWeight: 900, color: 'rgba(255,255,255,0.8)', transform: `scale(${1 + (land ? (1 - land) * 0.15 : 0)})` }}>
        <span style={{ position: 'relative' }}>
          R$ 3.999
          <span style={{ position: 'absolute', left: -8, right: -8, top: '50%', height: 7, background: '#fff', transform: 'rotate(-4deg)', boxShadow: '0 0 12px #fff' }} />
        </span>
      </div>
      {f >= T.s5.anchor - 14 ? (
        <Icon x={540} y={AY} scale={1.2} rotate={Math.sin(f * 0.15) * 4 * (land ? 1 - land * 0.7 : 1)}>
          <line x1={0} y1={-300} x2={0} y2={-70} {...S} strokeWidth={2} strokeDasharray="6 8" />
          <circle cx={0} cy={-58} r={12} {...S} strokeWidth={4} />
          <line x1={0} y1={-46} x2={0} y2={40} {...S} strokeWidth={6} />
          <line x1={-30} y1={-20} x2={30} y2={-20} {...S} strokeWidth={6} />
          <path d="M -54 10 C -50 44 -20 56 0 56 C 20 56 50 44 54 10 M -54 10 L -64 22 M -54 10 L -40 18 M 54 10 L 64 22 M 54 10 L 40 18" {...S} strokeWidth={6} />
        </Icon>
      ) : null}
      <Small at={T.s5.sub} y={1150} size={26}>
        O PRIMEIRO PREÇO QUE VOCÊ VÊ VIRA A RÉGUA DO SEU CÉREBRO.
      </Small>
      <Impact at={T.s5.bold} y={1400} size={56}>
        O PREÇO RISCADO É A ISCA.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 6 — A PRESSA =====================
export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t1 = useSpring(T.s6.timer, { damping: 11 });
  const st = useSpring(T.s6.stock, { damping: 11 });
  const stockLeft = interpolate(f, [T.s6.stock, T.s6.stock + 40], [1, 0.12], { ...clamp, easing: cubic });
  const bn = spring({ frame: f - T.s6.banner, fps, config: { damping: 8, stiffness: 230 } });
  const blink = Math.floor(f / 5) % 2 === 0;
  return (
    <SceneFrame start={T.scenes.s6[0]} duration={dur('s6')} transition="glitch">
      <Title at={T.s6.text} size={54} bold>E AINDA TEM A PRESSA.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: t1, transform: `scale(${0.7 + t1 * 0.3})`, transformOrigin: '270px 760px' }}>
        <Icon x={270} y={760}>
          <Stopwatch a={(f - T.s6.timer) * 22} />
        </Icon>
        <div style={{ position: 'absolute', left: 150, width: 240, top: 860, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 26, letterSpacing: 3, color: '#fff' }}>CRONÔMETRO</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: st }}>
        <div style={{ position: 'absolute', left: 690, top: 700, width: 240, height: 54, border: '3px solid #fff', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ width: `${stockLeft * 100}%`, height: '100%', background: 'rgba(255,255,255,0.4)' }} />
        </div>
        <div style={{ position: 'absolute', left: 660, width: 300, top: 776, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 26, letterSpacing: 3, color: '#fff', opacity: blink ? 1 : 0.5 }}>"SÓ RESTAM 2"</div>
      </div>
      {f >= T.s6.banner ? (
        <div style={{ position: 'absolute', left: 140, width: 800, top: 960, textAlign: 'center', transform: `rotate(-4deg) scale(${interpolate(bn, [0, 1], [2.4, 1])})`, opacity: Math.min(1, bn * 2), border: '5px solid #fff', borderRadius: 14, padding: '12px 0', fontFamily: FONT, fontWeight: 900, fontSize: 50, letterSpacing: 6, color: blink ? '#050505' : '#fff', background: blink ? '#fff' : 'rgba(5,5,5,0.9)', boxShadow: '0 0 26px rgba(255,255,255,0.6)' }}>
          ÚLTIMAS HORAS!
        </div>
      ) : null}
      <Impact at={T.s6.bold} y={1400} size={52}>
        PRESSA DESLIGA A CALCULADORA.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 7 — É ENGANOSO =====================
export const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame: f - T.s7.stamp, fps, config: { damping: 10, stiffness: 220 } });
  const stat = spring({ frame: f - T.s7.stat, fps, config: { damping: 9, stiffness: 200 } });
  return (
    <SceneFrame start={T.scenes.s7[0]} duration={dur('s7')}>
      <Title at={T.s7.text} size={50}>E ISSO NÃO É SÓ ESPERTEZA.</Title>
      {f >= T.s7.stamp ? (
        <div style={{ position: 'absolute', left: 150, width: 780, top: 560, textAlign: 'center', transform: `rotate(-5deg) scale(${interpolate(k, [0, 1], [2.4, 1])})`, opacity: Math.min(1, k * 2), border: '5px solid #fff', borderRadius: 14, padding: '14px 0', fontFamily: FONT, fontWeight: 900, color: '#fff', background: 'rgba(5,5,5,0.9)', boxShadow: '0 0 24px rgba(255,255,255,0.5)' }}>
          <div style={{ fontSize: 46, letterSpacing: 5 }}>PROPAGANDA ENGANOSA</div>
          <div style={{ fontSize: 20, letterSpacing: 4, marginTop: 6, opacity: 0.85 }}>PROIBIDA PELO CÓDIGO DE DEFESA DO CONSUMIDOR</div>
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: 120, width: 840, top: 820, opacity: Math.min(1, stat * 2), transform: `scale(${interpolate(stat, [0, 1], [1.6, 1])})`, textAlign: 'center', fontFamily: FONT }}>
        <div style={{ fontSize: 120, fontWeight: 900, color: '#fff', letterSpacing: 2, textShadow: '0 0 30px rgba(255,255,255,0.6)' }}>1 EM 5</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: 3, lineHeight: 1.4, marginTop: 4 }}>
          PRODUTOS MONITORADOS FICOU
          <br />
          MAIS CARO NA BLACK FRIDAY PASSADA
        </div>
      </div>
      <Impact at={T.s7.bold} y={1400} size={50}>
        O PROCON ALERTA TODO ANO.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 8 — O OUTRO LADO =====================
export const Scene8: React.FC = () => {
  const other = useSpring(T.s8.other, { damping: 15 });
  const [i1, i2, i3] = T.s8.icons;
  const s1 = useSpring(i1, { damping: 12, stiffness: 170 });
  const s2 = useSpring(i2, { damping: 12, stiffness: 170 });
  const s3 = useSpring(i3, { damping: 12, stiffness: 170 });
  const item = (x: number, s: number, icon: React.ReactNode, txt: React.ReactNode) => (
    <div style={{ position: 'absolute', inset: 0, opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
      <Icon x={x} y={620} scale={0.85}>{icon}</Icon>
      <div style={{ position: 'absolute', left: x - 130, width: 260, top: 700, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 21, lineHeight: 1.3, letterSpacing: 3, color: '#fff' }}>{txt}</div>
    </div>
  );
  return (
    <SceneFrame start={T.scenes.s8[0]} duration={dur('s8')}>
      <Title at={T.s8.text} size={48}>QUEM ACUMULA COMPRA DIFERENTE.</Title>
      {item(270, s1, (
        <g>
          <path d="M -60 40 L -60 -40 M -60 40 L 64 40" {...S} />
          <path d="M -50 20 L -20 0 L 10 10 L 50 -36" fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
        </g>
      ), <>OLHA O HISTÓRICO<br />DE 30+ DIAS</>)}
      {item(540, s2, (
        <g>
          <rect x={-40} y={-52} width={80} height={104} rx={6} {...S} />
          {[-26, -6, 14, 34].map((y) => (
            <g key={y}>
              <path d={`M -28 ${y} L -22 ${y + 6} L -14 ${y - 4}`} {...S} strokeWidth={2.5} />
              <line x1={-6} x2={28} y1={y + 1} y2={y + 1} {...S} strokeWidth={2.5} />
            </g>
          ))}
        </g>
      ), <>LISTA FEITA<br />ANTES DA BLACK</>)}
      {item(810, s3, (
        <g>
          <rect x={-56} y={-30} width={84} height={56} rx={6} {...S} />
          <path d="M 28 -14 L 50 -14 L 62 4 L 62 26 L 28 26" {...S} />
          <circle cx={-34} cy={34} r={10} {...S} />
          <circle cx={42} cy={34} r={10} {...S} />
        </g>
      ), <>PREÇO FINAL<br />COM FRETE</>)}
      <div style={{ position: 'absolute', inset: 0, opacity: other, transform: `translateY(${(1 - other) * 30}px)` }}>
        <Person x={540} glow={0.6} glowColor={GOLD} />
      </div>
      <Impact at={T.s8.bold} y={1400} size={54}>
        COMPARA. DEPOIS COMPRA.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 9 — DOIS CARRINHOS =====================
const CartSide: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <path d="M -110 -150 L -84 -150 L -64 -40 L 80 -40 L 96 -120 L -74 -120" {...S} />
    <path d="M -64 -40 L -56 -22 L 70 -22" {...S} />
    <circle cx={-46} cy={-11} r={11} {...S} />
    <circle cx={60} cy={-11} r={11} {...S} />
  </g>
);
export const Scene9: React.FC = () => {
  const f = useCurrentFrame();
  const L = useSpring(T.s9.left, { damping: 12, stiffness: 160 });
  const R = useSpring(T.s9.right, { damping: 12, stiffness: 160 });
  const split = useSpring(T.s9.text);
  return (
    <SceneFrame start={T.scenes.s9[0]} duration={dur('s9')}>
      <Title at={T.s9.text} size={48}>COMPROU PELO % vs. COMPROU PELA LISTA</Title>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <line x1={540} x2={540} y1={560} y2={560 + 900 * split} stroke="#fff" strokeOpacity={0.5} strokeWidth={3} strokeDasharray="16 14" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, opacity: L }}>
        <Icon x={270} y={GROUND}>
          <CartSide s={1.1} />
          {new Array(9).fill(0).map((_, i) => (
            <rect key={i} x={-80 + (i % 4) * 40} y={-150 - Math.floor(i / 4) * 34 - (i % 2) * 6} width={34} height={30} rx={4} {...S} strokeWidth={2.5} transform={`rotate(${(i % 3 - 1) * 8} ${-63 + (i % 4) * 40} ${-135})`} />
          ))}
        </Icon>
        <div style={{ position: 'absolute', left: 70, width: 400, top: 1190, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 22, lineHeight: 1.4, letterSpacing: 3, color: '#fff' }}>
          9 ITENS "EM PROMOÇÃO"
          <br />
          <span style={{ color: GOLD }}>FATURA EM JANEIRO</span>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: R }}>
        <Icon x={810} y={GROUND}>
          <CartSide s={1.1} />
          <rect x={-20} y={-160} width={40} height={36} rx={4} {...S} strokeWidth={2.5} />
        </Icon>
        <div style={{ position: 'absolute', left: 610, width: 400, top: 1190, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 22, lineHeight: 1.4, letterSpacing: 3, color: '#fff' }}>
          1 ITEM DA LISTA
          <br />
          <span style={{ color: GOLD }}>O RESTO NO BOLSO</span>
        </div>
        <div style={{ position: 'absolute', left: 810 - 60, top: 700 + Math.sin(f * 0.15) * 8, width: 120, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 60, color: GOLD, textShadow: '0 0 20px rgba(217,173,69,0.7)' }}>$</div>
      </div>
      <Impact at={T.s9.bold} y={1420} size={44}>
        DESCONTO SÓ É DESCONTO SE VOCÊ JÁ IA COMPRAR.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 10 — GUARDA ESSA REGRA =====================
export const Scene10: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fall = spring({ frame: f - T.s10.noteFall, fps, config: { damping: 14, stiffness: 90, mass: 1 } });
  const tSince = Math.max(0, f - T.s10.noteFall);
  const sw = 7 * Math.exp(-tSince / 22) * Math.sin(tSince * 0.28) + 0.8 * Math.sin(f * 0.07);
  const txt = T.s10.typeText;
  let shown = 0;
  for (let i = 0; i < txt.length; i++) if (T.s10.typeStart + Math.round(i * T.s10.framesPerChar) <= f) shown = i + 1;
  const lines = txt.slice(0, shown).split('\n');
  const cursorOn = shown < txt.length || Math.floor(f / 8) % 2 === 0;
  const PINX = 540, PINY = 560, NW = 820, NH = 420;
  return (
    <SceneFrame start={T.scenes.s10[0]} duration={dur('s10')}>
      <Title at={T.s10.text} size={58} bold>GUARDA ESSA REGRA.</Title>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - fall) * -1100}px) rotate(${sw}deg)`, transformOrigin: `${PINX}px ${PINY}px` }}>
        <Icon x={PINX} y={PINY}>
          <Note w={NW} h={NH} />
        </Icon>
        <div style={{ position: 'absolute', left: PINX - NW / 2 + 50, width: NW - 100, top: PINY + 80, fontFamily: FONT, fontWeight: 700, fontSize: 40, lineHeight: 1.42, letterSpacing: 3, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.3)', whiteSpace: 'pre' }}>
          {lines.map((l, i) => (
            <div key={i} style={{ minHeight: 58 }}>
              {l}
              {i === lines.length - 1 && cursorOn ? <span style={{ opacity: 0.9 }}>▍</span> : null}
            </div>
          ))}
        </div>
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 11 — PERGUNTA FINAL =====================
export const Scene11: React.FC = () => {
  const f = useCurrentFrame();
  const p1 = useSpring(T.s11.pill1, { damping: 12, stiffness: 170 });
  const ou = useSpring(T.s11.ou);
  const p2 = useSpring(T.s11.pill2, { damping: 12, stiffness: 170 });
  const pulse = f >= T.s11.pill2 + 8 ? 0.5 + 0.5 * Math.sin((f - T.s11.pill2) * 0.25) : 0;
  const pill = (s: number, gold: boolean): React.CSSProperties => ({
    opacity: s, transform: `scale(${0.6 + s * 0.4 + (gold ? pulse * 0.04 : 0)})`,
    border: `3px solid ${gold ? GOLD : '#fff'}`, borderRadius: 60, padding: '18px 22px', fontFamily: FONT, fontWeight: 800, fontSize: 23, letterSpacing: 3, whiteSpace: 'nowrap',
    color: gold ? '#f3d98f' : '#fff', background: gold ? `rgba(217,173,69,${0.1 + pulse * 0.12})` : 'rgba(255,255,255,0.03)',
    boxShadow: gold ? `0 0 ${14 + pulse * 26}px rgba(217,173,69,${0.35 + pulse * 0.35})` : '0 0 10px rgba(255,255,255,0.25)',
  });
  return (
    <SceneFrame start={T.scenes.s11[0]} duration={dur('s11')}>
      <Title at={T.s11.text} size={140} bold>E VOCÊ?</Title>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 690, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <div style={pill(p1, false)}>COMPRA PELO %</div>
        <div style={{ opacity: ou, fontFamily: FONT, fontWeight: 600, fontSize: 24, letterSpacing: 4, color: 'rgba(255,255,255,0.7)' }}>OU</div>
        <div style={pill(p2, true)}>COMPRA PELA LISTA</div>
      </div>
      <Person x={540} glow={0.45} label="VOCÊ" />
    </SceneFrame>
  );
};
