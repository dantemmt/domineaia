import React from 'react';
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import T from './timeline.json';
import { W, H, GROUND, TEXT_Y, GOLD, BLUE, FONT, GLOW, clamp, useSpring, Title, Person, SceneFrame } from './ui';
import { Icon, Note } from './icons';
import { Calculator } from './icons2';
import {
  StoreMap, SNAKE, DIRECT, pathPoint, Product, CartSide, Eye, Hand, Clock, MusicNote, Register, ListPaper, Plate, Printer,
} from './icons3';

const dur = (k: keyof typeof T.scenes) => T.scenes[k][1] - T.scenes[k][0];
const cubic = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);

const Impact: React.FC<{ at: number; y: number; size: number; children: React.ReactNode }> = ({ at, y, size, children }) => {
  const s = useSpring(at, { damping: 12, stiffness: 160 });
  return (
    <div
      style={{
        position: 'absolute', left: 120, width: 840, top: y,
        transform: `translateY(-50%) scale(${interpolate(s, [0, 1], [1.2, 1])})`,
        opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
        textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.12, letterSpacing: 3, color: '#fff',
        textShadow: '0 0 22px rgba(255,255,255,0.45)',
      }}
    >
      {children}
    </div>
  );
};
const Gold: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: GOLD, textShadow: '0 0 16px rgba(217,173,69,0.5)' }}>{children}</span>
);

// trecho percorrido de um caminho (para desenhar o rastro)
const partial = (pts: [number, number][], p: number) => {
  const out: [number, number][] = [pts[0]];
  const segs = pts.slice(1).map((b, i) => Math.hypot(b[0] - pts[i][0], b[1] - pts[i][1]));
  let d = segs.reduce((a, b) => a + b, 0) * Math.max(0, Math.min(1, p));
  for (let i = 0; i < segs.length; i++) {
    if (d >= segs[i]) { out.push(pts[i + 1]); d -= segs[i]; continue; }
    const k = d / segs[i];
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]);
    break;
  }
  return out;
};
const poly = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ');

// ===================== CENA 1 — GANCHO (vista de cima) =====================
export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const door = useSpring(T.s1.doorOpen, { damping: 16 });
  const glow = 0.6 + 0.4 * Math.sin(f * 0.25);
  return (
    <SceneFrame start={T.scenes.s1[0]} duration={dur('s1')} ground={false}>
      <Icon x={0} y={0}>
        <StoreMap door={door} riceGlow={glow} />
      </Icon>
      <Impact at={T.s1.hookText} y={400} size={58}>
        POR QUE O ARROZ FICA SEMPRE NO FUNDO DO MERCADO?
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 2 =====================
export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const roll = interpolate(f, [T.s2.wheelsStart, T.s2.wheelsEnd], [0, 1], { ...clamp, easing: cubic });
  return (
    <SceneFrame start={T.scenes.s2[0]} duration={dur('s2')} transition="glitch">
      <Title at={T.s2.text} size={58} bold>VOCÊ SÓ IA COMPRAR ARROZ.</Title>
      {/* porta automática aberta atrás */}
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW, opacity: 0.55 }}>
        <rect x={250} y={580} width={580} height={GROUND - 580} fill="none" stroke="#fff" strokeWidth={3} />
        <rect x={262} y={592} width={120} height={GROUND - 592} fill="none" stroke="#fff" strokeWidth={2} />
        <rect x={698} y={592} width={120} height={GROUND - 592} fill="none" stroke="#fff" strokeWidth={2} />
        <rect x={500} y={548} width={80} height={24} rx={4} fill="none" stroke="#fff" strokeWidth={2} />
      </svg>
      <Person x={430} glow={0.4} label="VOCÊ" />
      <Icon x={interpolate(roll, [0, 1], [760, 640])} y={GROUND}>
        <CartSide s={0.85} />
      </Icon>
    </SceneFrame>
  );
};

// ===================== CENA 3 — O LABIRINTO =====================
const CART = { x: 840, y: 1520 };
export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [T.s3.walkStart, T.s3.walkEnd], [0, 1], { ...clamp, easing: inOut });
  const [dx, dy] = pathPoint(SNAKE, p);
  const trail = partial(SNAKE, p);
  const fly = T.s3.flyFrames;
  const count = T.s3.items.filter((it) => f >= it.f + fly).length;
  const lastPop = T.s3.items.map((it) => it.f + fly).filter((x) => x <= f).pop();
  const bump = lastPop !== undefined ? Math.exp(-(f - lastPop) / 4) : 0;
  const ansIn = interpolate(f, [T.s3.answer - 6, T.s3.answer], [1, 0], clamp);
  const burst = f >= T.s3.answerBurst ? 1 + 0.6 * Math.exp(-(f - T.s3.answerBurst) / 10) : 1;
  return (
    <SceneFrame start={T.scenes.s3[0]} duration={dur('s3')} ground={false}>
      <div style={{ position: 'absolute', inset: 0, opacity: ansIn }}>
        <Title at={T.s3.text} size={46}>PRA CHEGAR NELE, VOCÊ ATRAVESSA A LOJA INTEIRA.</Title>
      </div>
      <Impact at={T.s3.answer} y={TEXT_Y} size={52}>
        O SUPERMERCADO ESCONDE O ARROZ NO FUNDO. DE PROPÓSITO.
      </Impact>
      <Icon x={0} y={0}>
        <StoreMap door={1} riceGlow={(0.7 + 0.3 * Math.sin(f * 0.25)) * burst} />
        <polyline points={poly(SNAKE)} fill="none" stroke={BLUE} strokeOpacity={0.18} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
        <polyline points={poly(trail)} fill="none" stroke={BLUE} strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" />
      </Icon>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: `drop-shadow(0 0 10px ${BLUE}) drop-shadow(0 0 20px ${BLUE})` }}>
        <circle cx={dx} cy={dy} r={13} fill={BLUE} />
        <circle cx={dx} cy={dy} r={6} fill="#fff" />
      </svg>
      {/* itens saltando das prateleiras para o carrinho */}
      {T.s3.items.map((it, i) => {
        if (f < it.f || f > it.f + fly + 2) return null;
        const pp = interpolate(it.f, [T.s3.walkStart, T.s3.walkEnd], [0, 1], { ...clamp, easing: inOut });
        const [sx, sy] = pathPoint(SNAKE, pp);
        const k = interpolate(f, [it.f, it.f + fly], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
        const x = interpolate(k, [0, 1], [sx + (i % 2 ? 40 : -40), CART.x]);
        const y = interpolate(k, [0, 1], [sy, CART.y - 70]) - Math.sin(k * Math.PI) * 160;
        return (
          <Icon key={i} x={x} y={y} scale={interpolate(k, [0, 0.2, 1], [0.2, 0.55, 0.4])} rotate={k * 200} opacity={k > 0.97 ? 0 : 1}>
            <Product kind={it.icon} />
          </Icon>
        );
      })}
      <Icon x={CART.x} y={CART.y} scale={1 + bump * 0.06} opacity={0.35 + 0.65 * ansIn}>
        <CartSide s={0.62} />
      </Icon>
      <div style={{ opacity: 0.35 + 0.65 * ansIn, position: 'absolute', left: 300, width: 420, top: CART.y - 40, transform: 'translateY(-50%)', textAlign: 'right', fontFamily: FONT, fontWeight: 800, fontSize: 36, letterSpacing: 4, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.4)' }}>
        ITENS: <span style={{ display: 'inline-block', transform: `scale(${1 + bump * 0.35})`, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 4 — ALTURA DOS OLHOS =====================
const Box: React.FC<{ w: number; h: number; lit: number }> = ({ w, h, lit }) => (
  <g>
    <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill={`rgba(255,255,255,${0.03 + lit * 0.1})`} stroke="#fff" strokeWidth={3} />
    <rect x={-w / 2 + 14} y={-h + 18} width={w - 28} height={h * 0.32} rx={4} fill="none" stroke="#fff" strokeWidth={2} />
    <line x1={-w / 2 + 14} x2={w / 2 - 14} y1={-h * 0.38} y2={-h * 0.38} stroke="#fff" strokeWidth={2} strokeOpacity={0.6} />
    <line x1={-w / 2 + 14} x2={w / 2 - 34} y1={-h * 0.24} y2={-h * 0.24} stroke="#fff" strokeWidth={2} strokeOpacity={0.6} />
  </g>
);
const PriceChip: React.FC<{ x: number; y: number; txt: string; op: number; scale?: number }> = ({ x, y, txt, op, scale = 1 }) => (
  <div style={{ position: 'absolute', left: x - 90, width: 180, top: y, transform: `translateY(-50%) scale(${scale})`, opacity: op, border: `3px solid ${GOLD}`, borderRadius: 10, padding: '8px 0', textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 32, letterSpacing: 2, color: GOLD, background: 'rgba(5,5,5,0.9)', boxShadow: `0 0 ${12 * op}px rgba(217,173,69,0.5)` }}>
    {txt}
  </div>
);
export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const shelf = useSpring(T.scenes.s4[0] + 2, { damping: 16 });
  const t1out = interpolate(f, [T.s4.text2 - 8, T.s4.text2], [1, 0], clamp);
  const beam = interpolate(f, [T.s4.beamDown, T.s4.beamDownEnd], [0, 1], { ...clamp, easing: cubic });
  const lit = useSpring(T.s4.cheapLit, { damping: 12 });
  const sparkle = f >= T.s4.shimmer ? Math.max(0, 1 - (f - T.s4.shimmer) / 40) : 0;
  const eye = { x: 200, y: 840 };
  const tgt = { x: interpolate(beam, [0, 1], [690, 410]), y: interpolate(beam, [0, 1], [840, 1112]) };
  return (
    <SceneFrame start={T.scenes.s4[0]} duration={dur('s4')}>
      <div style={{ opacity: t1out }}>
        <Title at={T.s4.text1} size={46}>O MAIS CARO FICA NA ALTURA DOS SEUS OLHOS.</Title>
      </div>
      <Title at={T.s4.text2} size={52} bold>O MAIS BARATO, PERTO DO CHÃO.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: shelf }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
          <rect x={300} y={560} width={620} height={GROUND - 560} fill="none" stroke="#fff" strokeWidth={3} />
          <line x1={300} x2={920} y1={720} y2={720} stroke="#fff" strokeWidth={3} />
          <line x1={300} x2={920} y1={920} y2={920} stroke="#fff" strokeWidth={3} />
          {/* andar de cima: genéricos */}
          {[380, 480, 580, 680, 780, 860].map((x, i) => (
            <rect key={x} x={x - 30} y={720 - 70 - (i % 2) * 20} width={60} height={70 + (i % 2) * 20} rx={4} fill="none" stroke="#fff" strokeWidth={2} strokeOpacity={0.45} />
          ))}
          {/* feixe do olho */}
          <line x1={eye.x + 50} y1={eye.y} x2={tgt.x} y2={tgt.y} stroke="#fff" strokeWidth={3} strokeDasharray="3 12" strokeLinecap="round" strokeOpacity={0.8} />
        </svg>
        {/* luz no andar do meio */}
        <div style={{ position: 'absolute', left: 430, top: 700, width: 520, height: 260, background: 'radial-gradient(ellipse, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%)' }} />
        {[560, 690, 820].map((x) => (
          <Icon key={x} x={x} y={918}>
            <Box w={110} h={150} lit={1} />
          </Icon>
        ))}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.35 + lit * 0.65 }}>
          {[560, 690, 820].map((x) => (
            <Icon key={x} x={x} y={1148}>
              <Box w={84} h={100} lit={lit} />
            </Icon>
          ))}
        </div>
        {lit > 0.01 ? <div style={{ position: 'absolute', left: 290, top: 1040, width: 260, height: 150, opacity: lit, background: 'radial-gradient(ellipse, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)' }} /> : null}
        <PriceChip x={410} y={850} txt="R$ 12,90" op={1} />
        <PriceChip x={410} y={1112} txt="R$ 6,49" op={0.35 + lit * 0.65} scale={1 + lit * 0.08} />
        {new Array(10).fill(0).map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: 470 + random(`s4x${i}`) * 420, top: 770 + random(`s4y${i}`) * 140 - (1 - sparkle) * 30, width: 7, height: 7, borderRadius: 4, background: '#fff', boxShadow: '0 0 10px #fff', opacity: sparkle * (0.4 + 0.6 * random(`s4o${i}`)) }} />
        ))}
        <Icon x={eye.x} y={eye.y}>
          <Eye down={beam > 0.5} />
        </Icon>
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 5 — CARRINHO GIGANTE =====================
const SIX = ['chocolate', 'biscoito', 'vinho', 'queijo', 'refri', 'salgadinho'];
export const Scene5: React.FC = () => {
  const c1 = useSpring(T.s5.cart1, { damping: 14 });
  const c2 = useSpring(T.s5.cart2, { damping: 14 });
  // posições dos itens: no carrinho pequeno transbordam; no gigante ficam no fundo
  const small = [[-55, -138], [-5, -142], [45, -136], [-30, -170], [22, -176], [0, -205]];
  return (
    <SceneFrame start={T.scenes.s5[0]} duration={dur('s5')} transition="glitch">
      <Title at={T.s5.text} size={52} bold>CARRINHO GRANDE. A COMPRA PARECE PEQUENA.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: c1, transform: `translateX(${(1 - c1) * -120}px)` }}>
        <Icon x={300} y={GROUND}>
          <CartSide s={0.9} />
          {SIX.map((k, i) => (
            <g key={k} transform={`translate(${small[i][0]} ${small[i][1] + 30}) scale(0.42)`}>
              <Product kind={k} />
            </g>
          ))}
        </Icon>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: c2, transform: `translateX(${(1 - c2) * 120}px)` }}>
        <Icon x={710} y={GROUND}>
          <CartSide s={2.0} />
          {SIX.map((k, i) => (
            <g key={k} transform={`translate(${-80 + i * 34} ${-98 - (i % 2) * 6}) scale(0.42)`}>
              <Product kind={k} />
            </g>
          ))}
        </Icon>
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 6 — A MÚSICA =====================
export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const a = T.s6.walkStart, b = T.s6.walkEnd;
  // fase da caminhada: velocidade cai suavemente (passos cada vez mais lentos)
  let phase = 0;
  for (let k = a; k < Math.min(f, b); k++) phase += interpolate(k, [a, b], [0.42, 0.1], { ...clamp, easing: cubic });
  const bob = Math.abs(Math.sin(phase));
  return (
    <SceneFrame start={T.scenes.s6[0]} duration={dur('s6')}>
      <Title at={T.s6.text} size={46}>MÚSICA LENTA. VOCÊ ANDA DEVAGAR. E COMPRA MAIS.</Title>
      {new Array(7).fill(0).map((_, i) => {
        const x = 170 + random(`n${i}`) * 740;
        const y0 = 640 + random(`ny${i}`) * 420;
        const y = y0 - (f - a) * (0.25 + random(`ns${i}`) * 0.35);
        return (
          <Icon key={i} x={x + 18 * Math.sin(f * 0.03 + i)} y={y} scale={0.7 + random(`nz${i}`) * 0.5} rotate={10 * Math.sin(f * 0.04 + i)} opacity={0.55}>
            <MusicNote double={i % 3 === 0} />
          </Icon>
        );
      })}
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-bob * 16}px) rotate(${Math.sin(phase) * 2}deg)`, transformOrigin: `540px ${GROUND}px` }}>
        <Person x={540} glow={0.4} label="VOCÊ" />
      </div>
      <Title at={T.s6.sub} y={1260} size={22}>
        <span style={{ opacity: 0.7, letterSpacing: 4 }}>ESTUDOS DE COMPORTAMENTO DO CONSUMIDOR</span>
      </Title>
    </SceneFrame>
  );
};

// ===================== CENA 7 — O CAIXA =====================
export const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const q = useSpring(T.s7.queue, { damping: 16 });
  const hIn = interpolate(f, [T.s7.hand, T.s7.hand + 12], [0, 1], { ...clamp, easing: cubic });
  const hMove = interpolate(f, [T.s7.hand + 14, T.s7.handEnd], [0, 1], { ...clamp, easing: inOut });
  const hOut = interpolate(f, [T.s7.handEnd + 4, T.s7.handEnd + 14], [1, 0], clamp);
  const hx = interpolate(hMove, [0, 1], [905, 790]);
  const hy = interpolate(hIn, [0, 1], [860, 990]) + interpolate(hMove, [0, 1], [0, 30]) - Math.sin(hMove * Math.PI) * 70;
  const choc = f >= T.s7.hand + 12;
  const inCart = f >= T.s7.handEnd;
  return (
    <SceneFrame start={T.scenes.s7[0]} duration={dur('s7')}>
      <Title at={T.s7.text} size={46}>NA FILA, CANSADO, ESPERANDO... SÓ UM CHOCOLATE.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: q }}>
        <Icon x={430} y={640}>
          <Clock a={(f - T.s7.clockStart) * 26} />
        </Icon>
        <Icon x={195} y={GROUND} scale={0.95}>
          <Register />
        </Icon>
        {[325, 430, 535].map((x) => (
          <Person key={x} x={x} glow={0.08} scale={0.76} opacity={0.5} />
        ))}
        <Person x={655} glow={0.3} label="VOCÊ" scale={0.86} />
        <Icon x={790} y={GROUND}>
          <CartSide s={0.55} />
          {inCart ? (
            <g transform="translate(-4 -90) scale(0.45)">
              <Product kind="chocolate" />
            </g>
          ) : null}
        </Icon>
        {/* prateleira baixa com chocolates e balas iluminados */}
        <div style={{ position: 'absolute', left: 840, top: 990, width: 120, height: 162, background: 'radial-gradient(ellipse, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)' }} />
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
          <rect x={852} y={1000} width={100} height={GROUND - 1000} fill="none" stroke="#fff" strokeWidth={3} />
          <line x1={852} x2={952} y1={1076} y2={1076} stroke="#fff" strokeWidth={3} />
          {[875, 925].map((x) => (
            <circle key={x} cx={x} cy={1128} r={12} fill="none" stroke="#fff" strokeWidth={2.5} />
          ))}
          {!choc ? <rect x={880} y={1048} width={46} height={26} rx={3} fill="none" stroke="#fff" strokeWidth={2.5} /> : null}
          <rect x={862} y={1048} width={14} height={26} rx={3} fill="none" stroke="#fff" strokeWidth={2} strokeOpacity={0.5} />
        </svg>
        {hIn > 0 && hOut > 0 ? (
          <Icon x={hx} y={hy} opacity={Math.min(hIn, hOut)} scale={0.8}>
            <Hand />
            {choc && !inCart ? (
              <g transform="translate(0 46) scale(0.55)">
                <Product kind="chocolate" />
              </g>
            ) : null}
          </Icon>
        ) : null}
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 8 — A NOTA FISCAL =====================
export const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pr = useSpring(T.s8.printer, { damping: 16 });
  const R = T.receipt;
  const shown = R.filter((_, i) => f >= T.s8.lineStart + i * T.s8.lineStep).length;
  const tot = f >= T.s8.total;
  const totS = spring({ frame: f - T.s8.total, fps, config: { damping: 10, stiffness: 170 } });
  const pulse = tot ? 1 + 0.05 * Math.sin((f - T.s8.total) * 0.3) : 1;
  const rowH = 44;
  const targetH = 30 + shown * rowH + (tot ? 86 : 0);
  const PW = 480, PX = 540 - PW / 2, PY = 560;
  return (
    <SceneFrame start={T.scenes.s8[0]} duration={dur('s8')}>
      <div style={{ position: 'absolute', inset: 0, opacity: pr }}>
        <div style={{ position: 'absolute', left: PX, top: PY, width: PW, height: targetH, overflow: 'hidden', borderLeft: '3px solid #fff', borderRight: '3px solid #fff', borderBottom: '3px dashed rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.05)', filter: GLOW, transition: 'none' }}>
          <div style={{ padding: '18px 26px 0', fontFamily: FONT }}>
            {R.slice(0, shown).map(([n, v], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', height: rowH, fontSize: 23, fontWeight: 700, letterSpacing: 2, color: '#fff', opacity: interpolate(f, [T.s8.lineStart + i * T.s8.lineStep, T.s8.lineStart + i * T.s8.lineStep + 5], [0, 1], clamp) }}>
                <span>{n}</span>
                <span style={{ flex: 1, borderBottom: '3px dotted rgba(255,255,255,0.45)', margin: '0 10px', transform: 'translateY(-6px)' }} />
                <span style={{ color: GOLD }}>{v}</span>
              </div>
            ))}
            {tot ? (
              <div style={{ display: 'flex', alignItems: 'center', height: 80, marginTop: 6, borderTop: '3px solid #fff', fontWeight: 900, letterSpacing: 3, opacity: totS }}>
                <span style={{ fontSize: 30, color: '#fff' }}>TOTAL</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 46, color: GOLD, display: 'inline-block', transform: `scale(${(0.7 + totS * 0.3) * pulse})`, transformOrigin: 'right center', textShadow: '0 0 24px rgba(217,173,69,0.6)' }}>R$ 168,47</span>
              </div>
            ) : null}
          </div>
        </div>
        <Icon x={540} y={PY + 4}>
          <Printer w={PW} />
        </Icon>
      </div>
      <Impact at={T.s8.bold} y={1420} size={52}>
        VOCÊ ENTROU PRA GASTAR <Gold>R$ 25.</Gold>
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 9 — ISSO TEM NOME =====================
export const Scene9: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [T.s9.boxStart, T.s9.boxEnd], [0, 1], { ...clamp, easing: cubic });
  const rev = useSpring(T.s9.reveal, { damping: 11, stiffness: 170 });
  const sub = useSpring(T.s9.sub);
  const bx = 160, by = 600, bw = 760, bh = 230, per = 2 * (bw + bh);
  return (
    <SceneFrame start={T.scenes.s9[0]} duration={dur('s9')} transition="glitch">
      <Title at={T.s9.text} size={74} serif>Isso tem nome.</Title>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
        <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} />
      </svg>
      <div style={{ position: 'absolute', left: bx, width: bw, top: by + bh / 2, transform: `translateY(-50%) scale(${interpolate(rev, [0, 1], [1.3, 1])})`, opacity: interpolate(rev, [0, 0.3], [0, 1], clamp), textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 66, lineHeight: 1.1, letterSpacing: 3, color: '#fff', textShadow: '0 0 24px rgba(255,255,255,0.5)' }}>
        ARQUITETURA
        <br />
        DE ESCOLHA
      </div>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 920, opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 34, letterSpacing: 3, color: 'rgba(255,255,255,0.85)' }}>
        A LOJA DECIDE ANTES DE VOCÊ.
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 10 — O OUTRO LADO =====================
export const Scene10: React.FC = () => {
  const f = useCurrentFrame();
  const other = useSpring(T.s10.other, { damping: 15 });
  const [i1, i2, i3] = T.s10.icons;
  const s1 = useSpring(i1, { damping: 12, stiffness: 170 });
  const s2 = useSpring(i2, { damping: 12, stiffness: 170 });
  const s3 = useSpring(i3, { damping: 12, stiffness: 170 });
  const mapIn = interpolate(f, [T.s10.mapIn, T.s10.mapIn + 8], [0, 1], { ...clamp, easing: cubic });
  const p = interpolate(f, [T.s10.pathStart, T.s10.pathEnd], [0, 1], { ...clamp, easing: inOut });
  const [dx, dy] = pathPoint(DIRECT, p);
  const item = (x: number, s: number, icon: React.ReactNode, txt: React.ReactNode) => (
    <div style={{ position: 'absolute', inset: 0, opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
      <Icon x={x} y={620} scale={0.8}>
        {icon}
      </Icon>
      <div style={{ position: 'absolute', left: x - 130, width: 260, top: 700, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 22, lineHeight: 1.3, letterSpacing: 3, color: '#fff' }}>{txt}</div>
    </div>
  );
  return (
    <SceneFrame start={T.scenes.s10[0]} duration={dur('s10')} ground={false}>
      <Title at={T.s10.text} size={50}>QUEM ACUMULA ENTRA DIFERENTE.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - mapIn }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
          <line x1={-200} x2={W + 200} y1={GROUND} y2={GROUND} stroke="#fff" strokeOpacity={0.55} strokeWidth={3} strokeDasharray="18 14" />
        </svg>
        {item(270, s1, <ListPaper />, <>LISTA<br />NA MÃO</>)}
        {item(540, s2, <Plate />, <>BARRIGA<br />CHEIA</>)}
        {item(810, s3, <Eye down />, <>OLHA A PRATELEIRA<br />DE BAIXO</>)}
        <div style={{ position: 'absolute', inset: 0, opacity: other, transform: `translateY(${(1 - other) * 30}px)` }}>
          <Person x={540} glow={0.6} glowColor={GOLD} />
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: mapIn }}>
        <Icon x={0} y={0}>
          <StoreMap door={1} riceGlow={0.8} />
          <polyline points={poly(partial(DIRECT, p))} fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" />
        </Icon>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: `drop-shadow(0 0 10px ${GOLD}) drop-shadow(0 0 20px ${GOLD})` }}>
          <circle cx={dx} cy={dy} r={13} fill={GOLD} />
        </svg>
      </div>
      <Impact at={T.s10.bold} y={1430} size={50}>
        MESMA LOJA. OUTRA CONTA.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 11 — GUARDA ESSA REGRA =====================
export const Scene11: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fall = spring({ frame: f - T.s11.noteFall, fps, config: { damping: 14, stiffness: 90, mass: 1 } });
  const tSince = Math.max(0, f - T.s11.noteFall);
  const sw = 7 * Math.exp(-tSince / 22) * Math.sin(tSince * 0.28) + 0.8 * Math.sin(f * 0.07);
  const txt = T.s11.typeText;
  let shown = 0;
  for (let i = 0; i < txt.length; i++) if (T.s11.typeStart + Math.round(i * T.s11.framesPerChar) <= f) shown = i + 1;
  const lines = txt.slice(0, shown).split('\n');
  const cursorOn = shown < txt.length || Math.floor(f / 8) % 2 === 0;
  const PINX = 540, PINY = 560, NW = 820, NH = 380;
  return (
    <SceneFrame start={T.scenes.s11[0]} duration={dur('s11')}>
      <Title at={T.s11.text} size={58} bold>GUARDA ESSA REGRA.</Title>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - fall) * -1100}px) rotate(${sw}deg)`, transformOrigin: `${PINX}px ${PINY}px` }}>
        <Icon x={PINX} y={PINY}>
          <Note w={NW} h={NH} />
        </Icon>
        <div style={{ position: 'absolute', left: PINX - NW / 2 + 50, width: NW - 100, top: PINY + 84, fontFamily: FONT, fontWeight: 700, fontSize: 44, lineHeight: 1.4, letterSpacing: 3, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.3)', whiteSpace: 'pre' }}>
          {lines.map((l, i) => (
            <div key={i} style={{ minHeight: 60 }}>
              {l}
              {i === lines.length - 1 && cursorOn ? <span style={{ opacity: 0.9 }}>▍</span> : null}
            </div>
          ))}
        </div>
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 12 — PERGUNTA FINAL =====================
export const Scene12: React.FC = () => {
  const f = useCurrentFrame();
  const p1 = useSpring(T.s12.pill1, { damping: 12, stiffness: 170 });
  const ou = useSpring(T.s12.ou);
  const p2 = useSpring(T.s12.pill2, { damping: 12, stiffness: 170 });
  const pulse = f >= T.s12.pill2 + 10 ? 0.5 + 0.5 * Math.sin((f - T.s12.pill2) * 0.22) : 0;
  const pill = (s: number, gold: boolean): React.CSSProperties => ({
    opacity: s,
    transform: `scale(${0.6 + s * 0.4 + (gold ? pulse * 0.04 : 0)})`,
    border: `3px solid ${gold ? GOLD : '#fff'}`,
    borderRadius: 44, padding: '16px 26px', fontFamily: FONT, fontWeight: 800, fontSize: 23, lineHeight: 1.25, letterSpacing: 3, textAlign: 'center',
    color: gold ? '#f3d98f' : '#fff',
    background: gold ? `rgba(217,173,69,${0.1 + pulse * 0.12})` : 'rgba(255,255,255,0.03)',
    boxShadow: gold ? `0 0 ${14 + pulse * 26}px rgba(217,173,69,${0.35 + pulse * 0.35})` : '0 0 10px rgba(255,255,255,0.25)',
  });
  return (
    <SceneFrame start={T.scenes.s12[0]} duration={dur('s12')}>
      <Title at={T.s12.text} size={140} bold>E VOCÊ?</Title>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 680, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <div style={pill(p1, false)}>COMPRA O QUE<br />A LOJA QUER</div>
        <div style={{ opacity: ou, fontFamily: FONT, fontWeight: 600, fontSize: 24, letterSpacing: 4, color: 'rgba(255,255,255,0.7)' }}>OU</div>
        <div style={pill(p2, true)}>COMPRA O QUE<br />PRECISA</div>
      </div>
      <Person x={540} glow={0.45} label="VOCÊ" />
    </SceneFrame>
  );
};

