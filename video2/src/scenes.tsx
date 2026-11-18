import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import T from './timeline.json';
import { W, H, GROUND, TEXT_Y, GOLD, FONT, GLOW, clamp, ease, useSpring, brl, Title, Person, Glitch, SceneFrame } from './ui';
import { Icon, Note } from './icons';
import { PriceTag, ShopWindow, SpinPhone, Calculator, Thermometer, MiniCal, PixTag, Hourglass, BigCoin } from './icons2';

const dur = (k: keyof typeof T.scenes) => T.scenes[k][1] - T.scenes[k][0];
const cubic = Easing.out(Easing.cubic);

// Texto de impacto (negrito, entra com escala)
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

// ===================== CENA 1 — GANCHO =====================
// ângulo da etiqueta: extremos exatamente nos quadros dos rangidos
const swing = (f: number, amp = 7) => amp * Math.cos((Math.PI * (f - T.s1.creaks[0])) / (T.s1.creaks[1] - T.s1.creaks[0]));

export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneFrame start={T.scenes.s1[0]} duration={dur('s1')}>
      <Icon x={540} y={490} rotate={swing(f)}>
        <PriceTag string={50} w={300} h={160} lines={[{ t: '12x', size: 64, gold: true }, { t: 'SEM JUROS', size: 32, gold: true }]} />
      </Icon>
      <Person x={290} glow={0.4} label="VOCÊ" squash={0.1} />
      <Impact at={T.s1.hookText} y={1400} size={64}>
        O ‘SEM JUROS’ É A COMPRA MAIS CARA QUE VOCÊ FAZ.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 2 =====================
export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const g = T.s2.glitches.some((a) => f >= a && f < a + 5);
  const settle = swing(T.scenes.s2[0]) * Math.exp(-(f - T.scenes.s2[0]) / 6);
  return (
    <SceneFrame start={T.scenes.s2[0]} duration={dur('s2')} transition="glitch">
      <Glitch active={g} seed="s2" strength={34}>
        <Title at={T.s2.text} size={60} bold>
          PARECE MENTIRA. NÃO É.
        </Title>
      </Glitch>
      <Icon x={540} y={490} rotate={settle}>
        <PriceTag string={50} w={300} h={160} lines={[{ t: '12x', size: 64, gold: true }, { t: 'SEM JUROS', size: 32, gold: true }]} />
      </Icon>
      <Person x={290} glow={0.35} label="VOCÊ" />
    </SceneFrame>
  );
};

// ===================== CENA 3 — A VITRINE =====================
export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [T.s3.windowStart, T.s3.windowEnd], [0, 1], { ...clamp, easing: cubic });
  const light = interpolate(f, [T.s3.lightUp, T.s3.lightUp + 10], [0, 1], { ...clamp, easing: cubic });
  const flash = Math.max(0, 1 - Math.abs(f - T.s3.lightUp - 3) / 10);
  const tag = useSpring(T.s3.tag, { damping: 13 });
  const th = useSpring(T.s3.thought, { damping: 11, stiffness: 170 });
  const thText = useSpring(T.s3.thoughtText);
  const WX = 690;
  return (
    <SceneFrame start={T.scenes.s3[0]} duration={dur('s3')}>
      <div style={{ position: 'absolute', left: WX - 260, top: 640, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12), rgba(255,255,255,0) 65%)', opacity: light * 0.8 + flash * 0.6 }} />
      <Icon x={WX} y={GROUND}>
        <ShopWindow w={460} h={470} draw={draw} light={light} />
      </Icon>
      <div style={{ position: 'absolute', inset: 0, opacity: light }}>
        <Icon x={WX} y={860}>
          <SpinPhone rot={(f - T.s3.lightUp) * 3.2} />
        </Icon>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: tag, transform: `translateY(${(1 - tag) * 20}px)` }}>
        <Icon x={WX} y={984}>
          <PriceTag string={6} w={330} h={110} lines={[{ t: '10x DE R$ 180', size: 30, gold: true }, { t: 'SEM JUROS', size: 20 }]} />
        </Icon>
      </div>
      {/* pensamento: só círculo pontilhado, sem fala */}
      <div style={{ position: 'absolute', inset: 0, opacity: th }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
          <circle cx={262} cy={815} r={7} fill="none" stroke="#fff" strokeWidth={3} />
          <circle cx={250} cy={782} r={11} fill="none" stroke="#fff" strokeWidth={3} />
          <circle cx={260} cy={640} r={105 * (0.7 + th * 0.3)} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', left: 160, width: 200, top: 640, transform: 'translateY(-50%)', opacity: thText, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 28, lineHeight: 1.2, letterSpacing: 3, color: '#fff' }}>
          CABE NO
          <br />
          BOLSO
        </div>
      </div>
      <Person x={260} glow={0.4 + light * 0.2} label="VOCÊ" />
    </SceneFrame>
  );
};

// ===================== CENA 4 — A CONTA =====================
const Tag: React.FC<{ x: number; y: number; top: string; value: string; op: number }> = ({ x, y, top, value, op }) => (
  <div style={{ position: 'absolute', left: x - 150, width: 300, top: y, opacity: op, border: '3px solid #fff', borderRadius: 14, padding: '14px 0', textAlign: 'center', fontFamily: FONT, background: 'rgba(5,5,5,0.85)', filter: GLOW }}>
    <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: '#fff' }}>{top}</div>
    <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: 2, color: GOLD, marginTop: 4 }}>{value}</div>
  </div>
);

export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const calc = useSpring(T.s4.calc, { damping: 13 });
  const typed = ['1', '10', '10 ×', '10 × R$ 1', '10 × R$ 18', '10 × R$ 180'];
  const k = T.s4.keys.filter((x) => x <= f).length;
  const expr = k > 0 ? typed[k - 1] : '';
  const eq = interpolate(f, [T.s4.equals, T.s4.equals + 10], [0, 1], { ...clamp, easing: cubic });
  const roll = interpolate(f, [T.s4.equals, T.s4.rollEnd], [0, 1], { ...clamp, easing: cubic });
  const pix = useSpring(T.s4.pix, { damping: 14 });
  const left = useSpring(T.s4.equals + 30, { damping: 14 });
  const ap = interpolate(f, [T.s4.approachStart, T.s4.approachEnd], [0, 1], { ...clamp, easing: cubic });
  const diff = useSpring(T.s4.diff, { damping: 10, stiffness: 170 });
  const pulse = f > T.s4.diff + 10 ? 1 + 0.05 * Math.sin((f - T.s4.diff) * 0.3) : 1;
  const [a, b] = expr.split('R$');
  return (
    <SceneFrame start={T.scenes.s4[0]} duration={dur('s4')}>
      <Title at={T.s4.text} size={58} bold>AGORA FAZ A CONTA.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: calc }}>
        <Icon x={540} y={545} scale={0.7}>
          <Calculator />
        </Icon>
      </div>
      <div
        style={{
          position: 'absolute', left: 120, width: 840, top: interpolate(eq, [0, 1], [680, 640]), transform: 'translateY(-50%)',
          textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: interpolate(eq, [0, 1], [72, 44]), letterSpacing: 3, color: '#fff',
          opacity: interpolate(eq, [0, 1], [1, 0.7]),
        }}
      >
        {a}
        {b !== undefined ? <Gold>R${b}</Gold> : null}
      </div>
      {f >= T.s4.equals ? (
        <div style={{ position: 'absolute', left: 120, width: 840, top: 750, transform: `translateY(-50%) scale(${0.8 + eq * 0.2})`, opacity: eq, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 92, letterSpacing: 3, fontVariantNumeric: 'tabular-nums' }}>
          <Gold>= {brl(roll * 1800)}</Gold>
        </div>
      ) : null}
      <Tag x={interpolate(ap, [0, 1], [300, 390])} y={830} top="PARCELADO" value="R$ 1.800" op={left} />
      <Tag x={interpolate(ap, [0, 1], [780, 690])} y={830} top="À VISTA NO PIX" value="R$ 1.584" op={pix} />
      <div style={{ position: 'absolute', left: 120, width: 840, top: 1060, transform: `translateY(-50%) scale(${(0.6 + diff * 0.4) * pulse})`, opacity: Math.min(1, diff * 2), textAlign: 'center', fontFamily: FONT }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: '#fff', opacity: 0.8 }}>DIFERENÇA</div>
        <div style={{ fontSize: 84, fontWeight: 900, letterSpacing: 3, color: GOLD, textShadow: '0 0 28px rgba(217,173,69,0.6)' }}>R$ 216</div>
      </div>
      <Impact at={T.s4.bold} y={1400} size={54}>
        OS JUROS JÁ ESTAVAM NO PREÇO.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 5 — DOR DE PAGAR =====================
export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [T.s5.boxStart, T.s5.boxEnd], [0, 1], { ...clamp, easing: cubic });
  const rev = useSpring(T.s5.reveal, { damping: 11, stiffness: 170 });
  const demo = useSpring(T.s5.demo, { damping: 15 });
  const up = interpolate(f, [T.s5.upStart, T.s5.upEnd], [0.12, 0.95], { ...clamp, easing: cubic });
  const down = interpolate(f, [T.s5.downStart, T.s5.downEnd], [0, 1], { ...clamp, easing: cubic });
  const sliceP = spring({ frame: f - T.s5.slice, fps: 30, config: { damping: 14, stiffness: 120 } });
  const sliced = f >= T.s5.slice;
  const bx = 220, by = 520, bw = 640, bh = 140, per = 2 * (bw + bh);
  return (
    <SceneFrame start={T.scenes.s5[0]} duration={dur('s5')} transition="glitch">
      <Title at={T.s5.text} size={74} serif>Isso tem nome.</Title>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
        <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} />
      </svg>
      <div style={{ position: 'absolute', left: bx, width: bw, top: by + bh / 2, transform: `translateY(-50%) scale(${interpolate(rev, [0, 1], [1.3, 1])})`, opacity: interpolate(rev, [0, 0.3], [0, 1], clamp), textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 66, letterSpacing: 3, color: '#fff', textShadow: '0 0 24px rgba(255,255,255,0.5)' }}>
        DOR DE PAGAR
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: demo, transform: `translateY(${(1 - demo) * 30}px)` }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
          <line x1={540} x2={540} y1={760} y2={1130} stroke="#fff" strokeOpacity={0.35} strokeWidth={2} strokeDasharray="10 12" />
        </svg>
        {[['DE UMA VEZ', 280], ['EM 10 VEZES', 690]].map(([t, x]) => (
          <div key={t as string} style={{ position: 'absolute', left: (x as number) - 150, width: 300, top: 750, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: 'rgba(255,255,255,0.85)' }}>
            {t}
          </div>
        ))}
        <Icon x={280} y={900} gold>
          <BigCoin r={88} label="R$ 1.800" />
        </Icon>
        <Icon x={430} y={GROUND - 8}>
          <Thermometer level={up} h={300} />
        </Icon>
        {!sliced ? (
          <Icon x={690} y={900} gold>
            <BigCoin r={88} label="R$ 1.800" />
          </Icon>
        ) : (
          <Icon x={690} y={900} gold>
            {new Array(10).fill(0).map((_, i) => {
              const off = (i - 4.5) * 17 * sliceP;
              return (
                <g key={i} transform={`translate(0 ${off})`}>
                  <ellipse rx={88} ry={9} fill="#050505" stroke={GOLD} strokeWidth={3} />
                </g>
              );
            })}
          </Icon>
        )}
        {sliced ? (
          <div style={{ position: 'absolute', left: 540, width: 300, top: 1050, opacity: sliceP, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 3, color: GOLD }}>
            10 × R$ 180
          </div>
        ) : null}
        <Icon x={880} y={GROUND - 8}>
          <Thermometer level={up - (up - 0.08) * down} h={300} />
        </Icon>
      </div>
      <Impact at={T.s5.sub} y={1400} size={40}>
        DIVIDIDO, DÓI MENOS.
        <br />E VOCÊ COMPRA MAIS.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 6 =====================
export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const step = interpolate(f, [T.s6.step, T.s6.step + 16], [0, 1], { ...clamp, easing: cubic });
  const hop = Math.sin(step * Math.PI) * 18;
  const tag = useSpring(T.s6.tag, { damping: 11, stiffness: 160 });
  return (
    <SceneFrame start={T.scenes.s6[0]} duration={dur('s6')}>
      <Title at={T.s6.text} size={54} bold>ENTÃO VOCÊ PARCELA DE NOVO.</Title>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-hop}px)` }}>
        <Person x={interpolate(step, [0, 1], [330, 480])} glow={0.4} label="VOCÊ" />
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: tag }}>
        <Icon x={760} y={720} scale={0.7 + tag * 0.3} rotate={10 * Math.exp(-(f - T.s6.tag) / 10) * Math.sin((f - T.s6.tag) * 0.35)}>
          <PriceTag string={50} w={260} h={140} lines={[{ t: '6x', size: 54, gold: true }, { t: 'SEM JUROS', size: 28, gold: true }]} />
        </Icon>
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 7 — A PILHA =====================
const BLOCK_H = 66, BLOCK_W = 380;
export const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const B = T.s7.blocks;
  const fall = T.s7.fallFrames;
  const landed = B.filter((b) => f >= b.f + fall).length;
  // compressão suave por bloco
  let squash = 0;
  B.forEach((b) => {
    squash += 0.22 * spring({ frame: f - b.f - fall, fps: 30, config: { damping: 9, stiffness: 160 } });
  });
  const lastLand = B.map((b) => b.f + fall).filter((x) => x <= f).pop();
  const shake = lastLand !== undefined && f - lastLand < 10 ? Math.sin((f - lastLand) * 2.6) * 6 * (1 - (f - lastLand) / 10) * (1 + landed * 0.2) : 0;
  const PX = 400;
  const bodyH = 205 * (1 - squash * 0.2);
  const headTop = GROUND - bodyH - 18 * (1 - squash * 0.6) - 84;
  let total = 0;
  B.forEach((b) => {
    total += b.value * interpolate(f, [b.f + fall, b.f + fall + 10], [0, 1], { ...clamp, easing: cubic });
  });
  const counter = useSpring(T.s7.counter);
  return (
    <SceneFrame start={T.scenes.s7[0]} duration={dur('s7')} shake={shake}>
      <div style={{ position: 'absolute', left: 120, width: 840, top: TEXT_Y, transform: 'translateY(-50%)', opacity: counter, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 76, letterSpacing: 3, color: GOLD, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 24px rgba(217,173,69,0.5)' }}>
        {brl(total)} <span style={{ fontSize: 40, letterSpacing: 4 }}>POR MÊS</span>
      </div>
      <Person x={PX} glow={0.4 - squash * 0.25} label="VOCÊ" squash={squash} />
      {B.map((b, i) => {
        if (f < b.f) return null;
        const restY = headTop - (i + 1) * BLOCK_H + shake * 0.5;
        const t = (f - b.f) / fall;
        const fallY = t < 1 ? interpolate(t, [0, 1], [-260, restY], { easing: Easing.in(Easing.quad) }) : restY - Math.max(0, Math.sin((f - b.f - fall) * 0.6) * 8 * Math.exp(-(f - b.f - fall) / 4));
        const x = PX + 38 + (i % 2 ? -10 : 10);
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x - BLOCK_W / 2, top: fallY, width: BLOCK_W, height: BLOCK_H, boxSizing: 'border-box',
              border: '3px solid #fff', borderRadius: 6, background: 'rgba(5,5,5,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
              fontFamily: FONT, fontWeight: 800, fontSize: 25, letterSpacing: 3, filter: GLOW, transform: `rotate(${(i % 2 ? -1 : 1) * 1.5}deg)`,
            }}
          >
            <span style={{ color: '#fff' }}>{b.label}</span>
            <span style={{ color: GOLD }}>R$ {b.value}/MÊS</span>
          </div>
        );
      })}
      <Impact at={T.s7.bold} y={1400} size={56}>
        ANTES DO SALÁRIO CAIR.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 8 — A VIRADA =====================
export const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const cals = useSpring(T.s8.calendars, { damping: 15 });
  return (
    <SceneFrame start={T.scenes.s8[0]} duration={dur('s8')}>
      <Title at={T.s8.line1} y={350} size={50} bold>VOCÊ NÃO COMPROU UM CELULAR.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: cals, transform: `translateY(${(1 - cals) * 30}px)` }}>
        {new Array(10).fill(0).map((_, i) => {
          const xf = T.s8.xStart + i * T.s8.xStep;
          const x = interpolate(f, [xf, xf + 6], [0, 1], { ...clamp, easing: cubic });
          return (
            <Icon key={i} x={220 + (i % 5) * 160} y={i < 5 ? 740 : 930} scale={0.95}>
              <MiniCal x={x} n={i + 1} />
            </Icon>
          );
        })}
      </div>
      <Impact at={T.s8.line2} y={1360} size={54}>
        VOCÊ VENDEU <Gold>10 MESES</Gold>
        <br />
        DO SEU FUTURO.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 9 — O OUTRO LADO =====================
export const Scene9: React.FC = () => {
  const f = useCurrentFrame();
  const other = useSpring(T.s9.other, { damping: 15 });
  const [i1, i2, i3] = T.s9.icons;
  const s1 = useSpring(i1, { damping: 12, stiffness: 170 });
  const s2 = useSpring(i2, { damping: 12, stiffness: 170 });
  const s3 = useSpring(i3, { damping: 12, stiffness: 170 });
  const rot = interpolate(f, [i3 + 4, T.s9.flipEnd], [0, 180], { ...clamp, easing: cubic });
  const sand = interpolate(f, [T.s9.flipEnd, T.s9.sandEnd], [0, 1], { ...clamp, easing: cubic });
  const item = (x: number, s: number, icon: React.ReactNode, txt: React.ReactNode) => (
    <div style={{ position: 'absolute', inset: 0, opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
      <Icon x={x} y={600} scale={0.75 + s * 0.05}>
        {icon}
      </Icon>
      <div style={{ position: 'absolute', left: x - 130, width: 260, top: 680, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 22, lineHeight: 1.3, letterSpacing: 3, color: '#fff' }}>{txt}</div>
    </div>
  );
  return (
    <SceneFrame start={T.scenes.s9[0]} duration={dur('s9')} transition="glitch">
      <Title at={T.s9.text} size={52}>QUEM ACUMULA FAZ DIFERENTE.</Title>
      {item(270, s1, <Calculator />, <>MULTIPLICA<br />A PARCELA</>)}
      {item(540, s2, <PixTag />, <>PERGUNTA O PREÇO<br />À VISTA</>)}
      {item(810, s3, <Hourglass rot={rot} sand={sand} />, <>ESPERA<br />48 HORAS</>)}
      <Icon x={320} y={GROUND} scale={0.72}>
        <ShopWindow w={420} h={430} draw={1} light={0.6} />
      </Icon>
      <Icon x={320} y={GROUND - 165} scale={0.65}>
        <SpinPhone rot={f * 3.2} />
      </Icon>
      <div style={{ position: 'absolute', inset: 0, opacity: other, transform: `translateY(${(1 - other) * 30}px)` }}>
        <Person x={760} glow={0.6} glowColor={GOLD} />
      </div>
      <Impact at={T.s9.bold} y={1400} size={50}>
        MESMA VONTADE.
        <br />
        OUTRA DECISÃO.
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
  const PINX = 540, PINY = 560, NW = 820, NH = 440;
  return (
    <SceneFrame start={T.scenes.s10[0]} duration={dur('s10')}>
      <Title at={T.s10.text} size={58} bold>GUARDA ESSA REGRA.</Title>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - fall) * -1100}px) rotate(${sw}deg)`, transformOrigin: `${PINX}px ${PINY}px` }}>
        <Icon x={PINX} y={PINY}>
          <Note w={NW} h={NH} />
        </Icon>
        <div style={{ position: 'absolute', left: PINX - NW / 2 + 50, width: NW - 100, top: PINY + 80, fontFamily: FONT, fontWeight: 700, fontSize: 40, lineHeight: 1.4, letterSpacing: 3, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.3)', whiteSpace: 'pre' }}>
          {lines.map((l, i) => (
            <div key={i} style={{ marginTop: i === 2 ? 30 : 0, minHeight: 56 }}>
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
  const pulse = f >= T.s11.pill2 + 10 ? 0.5 + 0.5 * Math.sin((f - T.s11.pill2) * 0.22) : 0;
  const pill = (s: number, gold: boolean): React.CSSProperties => ({
    opacity: s,
    transform: `scale(${0.6 + s * 0.4 + (gold ? pulse * 0.04 : 0)})`,
    border: `3px solid ${gold ? GOLD : '#fff'}`,
    borderRadius: 60, padding: '18px 22px', fontFamily: FONT, fontWeight: 800, fontSize: 23, letterSpacing: 3, whiteSpace: 'nowrap',
    color: gold ? '#f3d98f' : '#fff',
    background: gold ? `rgba(217,173,69,${0.1 + pulse * 0.12})` : 'rgba(255,255,255,0.03)',
    boxShadow: gold ? `0 0 ${14 + pulse * 26}px rgba(217,173,69,${0.35 + pulse * 0.35})` : '0 0 10px rgba(255,255,255,0.25)',
  });
  return (
    <SceneFrame start={T.scenes.s11[0]} duration={dur('s11')}>
      <Title at={T.s11.text} size={140} bold>E VOCÊ?</Title>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 690, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
        <div style={pill(p1, false)}>PARCELA SEM PENSAR</div>
        <div style={{ opacity: ou, fontFamily: FONT, fontWeight: 600, fontSize: 24, letterSpacing: 4, color: 'rgba(255,255,255,0.7)' }}>OU</div>
        <div style={pill(p2, true)}>FAZ A CONTA ANTES</div>
      </div>
      <Person x={540} glow={0.45} label="VOCÊ" />
    </SceneFrame>
  );
};

