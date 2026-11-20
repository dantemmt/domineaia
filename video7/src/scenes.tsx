import React from 'react';
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import T from './timeline.json';
import { W, H, GROUND, GOLD, FONT, GLOW, clamp, useSpring, brl, Title, Person, Glitch, SceneFrame } from './ui';
import { Icon, Note } from './icons';

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

// ---------- ícones do tema ----------
const Gift: React.FC<{ open?: number }> = ({ open = 0 }) => (
  <g>
    <rect x={-70} y={-50} width={140} height={110} rx={8} {...S} fill="rgba(5,5,5,0.9)" />
    <line x1={0} y1={-50} x2={0} y2={60} {...S} />
    <g transform={`translate(0 ${-50 - open * 70}) rotate(${open * -25})`}>
      <rect x={-80} y={-24} width={160} height={24} rx={6} {...S} fill="rgba(5,5,5,0.9)" />
      <line x1={0} y1={-24} x2={0} y2={0} {...S} />
      <path d="M 0 -24 C -30 -60 -60 -30 0 -24 C 30 -60 60 -30 0 -24" {...S} />
    </g>
  </g>
);
const Plate: React.FC = () => (
  <g>
    <ellipse cx={0} cy={20} rx={70} ry={18} {...S} />
    <path d="M -46 14 C -46 -40 46 -40 46 14" {...S} />
    <line x1={0} y1={-34} x2={0} y2={-46} {...S} />
    <circle cx={0} cy={-50} r={5} {...S} />
  </g>
);
const Shirt: React.FC = () => (
  <g>
    <path d="M -24 -50 L -60 -34 L -76 0 L -50 10 L -44 -6 L -44 56 L 44 56 L 44 -6 L 50 10 L 76 0 L 60 -34 L 24 -50 C 16 -36 -16 -36 -24 -50 Z" {...S} />
  </g>
);
const Plane: React.FC = () => (
  <g>
    <path d="M -70 6 L 60 -6 C 80 -8 80 8 60 8 L -70 10 Z" {...S} />
    <path d="M -6 2 L -36 -46 L -18 -46 L 24 0 M -6 8 L -36 52 L -18 52 L 24 8 M -62 6 L -74 -20 L -62 -20 L -48 4" {...S} />
  </g>
);
const Bag: React.FC = () => (
  <g>
    <path d="M -50 -26 L 50 -26 L 58 56 L -58 56 Z" {...S} />
    <path d="M -22 -26 C -22 -64 22 -64 22 -26" {...S} />
  </g>
);
const ITEMS = [
  { label: 'PRESENTES', value: 900, I: () => <Gift /> },
  { label: 'CEIA', value: 600, I: Plate },
  { label: 'ROUPA NOVA', value: 450, I: Shirt },
  { label: 'VIAGEM', value: 1200, I: Plane },
  { label: 'COMPRINHAS', value: 570, I: Bag },
];

// Calendário de página (cx, top)
const CalPage: React.FC<{ x: number; y: number; month: string; day: string; s?: number; flip?: number; w?: number }> = ({ x, y, month, day, s = 1, flip = 0, w = 260 }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, transform: `scale(${s}) rotateX(${flip * 80}deg)`, transformOrigin: '50% 0%', border: '4px solid #fff', borderRadius: 18, background: 'rgba(5,5,5,0.94)', textAlign: 'center', fontFamily: FONT, boxShadow: '0 0 24px rgba(255,255,255,0.35)', overflow: 'hidden' }}>
    <div style={{ background: '#fff', color: '#050505', fontWeight: 900, fontSize: w * 0.13, letterSpacing: 6, padding: '6px 0' }}>{month}</div>
    <div style={{ color: '#fff', fontWeight: 900, fontSize: w * 0.42, lineHeight: 1.15 }}>{day}</div>
  </div>
);

// ===================== CENA 1 — A ISCA =====================
const QW = ['POR', 'QUE', 'O', '13º', 'SOME', 'MAIS', 'RÁPIDO', 'QUE', 'O', 'SALÁRIO?'];
export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T1 = T.s1;
  // calendário folheando rápido até 30 NOV
  const days = [12, 18, 22, 25, 27, 28, 29, 30];
  const di = Math.min(days.length - 1, Math.floor(interpolate(f, [0, T1.calHit], [0, days.length - 1], { ...clamp, easing: Easing.in(Easing.quad) })));
  const hit = f >= T1.calHit ? spring({ frame: f - T1.calHit, fps, config: { damping: 8, stiffness: 220 } }) : 0;
  const calUp = interpolate(f, [T1.gift - 4, T1.gift + 10], [0, 1], { ...clamp, easing: cubic });
  const giftIn = spring({ frame: f - T1.gift, fps, config: { damping: 9, stiffness: 160 } });
  const shake = f > T1.gift + 8 && f < T1.burst ? Math.sin(f * 2.8) * 6 * ((f - T1.gift - 8) / (T1.burst - T1.gift - 8)) : 0;
  const open = interpolate(f, [T1.burst, T1.burst + 10], [0, 1], { ...clamp, easing: cubic });
  const money = spring({ frame: f - T1.burst, fps, config: { damping: 9, stiffness: 180 } });
  const drain = interpolate(f, [T1.drainStart, dur('s1')], [0, 1], clamp);
  const val = 3720 - 520 * Math.pow(drain, 1.4);
  const GY = 860;
  return (
    <SceneFrame start={T.scenes.s1[0]} duration={dur('s1')} ground={false}>
      {/* calendário */}
      <div style={{ position: 'absolute', inset: 0, opacity: interpolate(f, [T1.words - 6, T1.words + 4], [1, 0], clamp), transform: `translate(${calUp * 300}px, ${calUp * -120}px) scale(${1 - calUp * 0.55})`, transformOrigin: '540px 600px' }}>
        <CalPage x={540} y={470} month="NOV" day={String(days[di])} s={1 + hit * 0.12 * Math.exp(-(f - T1.calHit) / 8)} flip={f < T1.calHit ? (f % 2) * 0.35 : 0} />
      </div>
      {/* raios dourados quando o presente abre */}
      {f >= T1.burst ? (
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, opacity: 0.35 * money }}>
          <g transform={`translate(540 ${GY}) rotate(${(f - T1.burst) * 1.2})`}>
            {new Array(18).fill(0).map((_, i) => (
              <path key={i} d="M 0 0 L 560 -22 L 560 22 Z" fill={GOLD} opacity={0.14} transform={`rotate(${i * 20})`} />
            ))}
          </g>
        </svg>
      ) : null}
      {/* presente caindo, tremendo e explodindo */}
      {f >= T1.gift ? (
        <Icon x={540 + shake} y={interpolate(giftIn, [0, 1], [300, GY + 120]) } scale={1.3 * (1 - open * 0.15)} opacity={1 - Math.max(0, open - 0.6) * 2.5}>
          <Gift open={open} />
        </Icon>
      ) : null}
      {f >= T1.burst ? new Array(20).fill(0).map((_, i) => {
        const t = f - T1.burst;
        const a = -Math.PI / 2 + (random(`ga${i}`) - 0.5) * 2.4;
        const sp = 10 + random(`gs${i}`) * 8;
        const x = 540 + Math.cos(a) * sp * t;
        const y = GY + 80 + Math.sin(a) * sp * t + 0.5 * t * t;
        if (t > 70 || y > H) return null;
        return (
          <Icon key={i} x={x} y={y} rotate={t * 8} scale={0.55} gold opacity={Math.max(0, 1 - t / 70)}>
            <rect x={-30} y={-16} width={60} height={32} rx={4} fill="#050505" stroke={GOLD} strokeWidth={3} />
            <circle r={8} fill="none" stroke={GOLD} strokeWidth={2.5} />
          </Icon>
        );
      }) : null}
      {/* valor do 13º saindo do presente e já começando a escorrer */}
      <div style={{ position: 'absolute', left: 120, width: 840, top: GY - 40, transform: `translateY(-50%) scale(${0.3 + money * 0.7})`, opacity: money, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 120, letterSpacing: 2, color: GOLD, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 34px rgba(217,173,69,0.75)' }}>
        {brl(Math.round(val))}
      </div>
      <Small at={T1.label} y={GY + 50} size={20}>
        MÉDIA DO 13º EM 2026 (DIEESE) · 1ª PARCELA ATÉ 30/11
      </Small>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 300, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 16, rowGap: 4, fontFamily: FONT, fontWeight: 900, fontSize: 58, letterSpacing: 2, color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.45)' }}>
        {QW.map((w, i) => {
          const s = spring({ frame: f - (T1.words + i * T1.wordStep), fps, config: { damping: 10, stiffness: 240, mass: 0.5 } });
          return (
            <span key={i} style={{ display: 'inline-block', opacity: Math.min(1, s * 2), transform: `translateY(${(1 - s) * 30}px) scale(${0.5 + s * 0.5})`, color: w === '13º' ? GOLD : '#fff', whiteSpace: 'nowrap' }}>
              {w}
            </span>
          );
        })}
      </div>
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
        <Title at={T.s2.text} size={54} bold>TODO ANO VOCÊ JURA QUE VAI SER DIFERENTE.</Title>
      </Glitch>
      <Person x={540} glow={0.7 + 0.2 * Math.sin(f * 0.25)} label="VOCÊ" />
    </SceneFrame>
  );
};

// ===================== CENA 3 — PRA ONDE ELE VAI =====================
export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tot = useSpring(T.s3.total);
  let v = 3720;
  T.s3.items.forEach((st, i) => { v -= ITEMS[i].value * interpolate(f, [st, st + 10], [0, 1], { ...clamp, easing: cubic }); });
  const lastHit = T.s3.items.filter((s) => s <= f).pop();
  const hitK = lastHit !== undefined ? Math.exp(-(f - lastHit) / 5) : 0;
  const cal = spring({ frame: f - T.s3.cal, fps, config: { damping: 10, stiffness: 180 } });
  return (
    <SceneFrame start={T.scenes.s3[0]} duration={dur('s3')}>
      <Title at={T.s3.text} size={50}>OLHA PRA ONDE ELE VAI.</Title>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 640, transform: `translateY(-50%) scale(${(0.7 + tot * 0.3) * (1 - hitK * 0.06)})`, opacity: tot, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 104, color: v < 1 ? '#fff' : GOLD, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 28px rgba(217,173,69,0.6)' }}>
        {brl(Math.max(0, Math.round(v)))}
      </div>
      {ITEMS.map((it, i) => {
        const st = T.s3.items[i];
        if (f < st) return null;
        const p = spring({ frame: f - st, fps, config: { damping: 14, stiffness: 120 } });
        const out = interpolate(f, [st + 34, st + 44], [0, 1], clamp);
        if (out >= 1 && i < ITEMS.length - 1) return null;
        const tx = [230, 850, 230, 850, 540][i];
        const ty = [900, 900, 960, 960, 930][i];
        const x = interpolate(p, [0, 1], [540, tx]);
        const y = interpolate(p, [0, 1], [700, ty]) - Math.sin(p * Math.PI) * 120 - out * 60;
        const op = Math.min(1, p * 3) * (1 - out);
        const Ico = it.I;
        return (
          <React.Fragment key={i}>
            <Icon x={x} y={y} scale={0.4 + p * 0.5} rotate={(1 - p) * 30} opacity={op}>
              <Ico />
            </Icon>
            <div style={{ position: 'absolute', left: x - 160, width: 320, top: y + 70, opacity: op, textAlign: 'center', fontFamily: FONT }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: GOLD, textShadow: '0 0 14px rgba(217,173,69,0.5)' }}>-{brl(it.value)}</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: '#fff', opacity: 0.85 }}>{it.label}</div>
            </div>
          </React.Fragment>
        );
      })}
      {f >= T.s3.cal ? <CalPage x={840} y={1180} month="DEZ" day="25" w={170} s={0.6 + cal * 0.4} /> : null}
      <Impact at={T.s3.bold} y={1400} size={56}>
        ANTES DO NATAL, ACABOU.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 4 — A RESPOSTA =====================
export const Scene4: React.FC = () => {
  const lbl = useSpring(T.s4.label);
  return (
    <SceneFrame start={T.scenes.s4[0]} duration={dur('s4')} transition="glitch">
      <div style={{ position: 'absolute', left: 120, width: 840, top: 360, opacity: lbl * 0.85, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 28, letterSpacing: 8, color: '#fff' }}>A RESPOSTA:</div>
      <Impact at={T.s4.answer} y={540} size={74}>
        O CÉREBRO CHAMA O 13º DE BÔNUS.
      </Impact>
      <Small at={T.s4.sub} y={760} size={36}>
        E BÔNUS PARECE DINHEIRO GRÁTIS.
      </Small>
      <Person x={540} glow={0.6} label="VOCÊ" />
    </SceneFrame>
  );
};

// ===================== CENA 5 — ISSO TEM NOME =====================
const Jar: React.FC<{ label: string; locked: boolean; f: number }> = ({ label, locked, f }) => (
  <g>
    <path d="M -80 -150 L 80 -150 L 90 -120 L 90 0 L -90 0 L -90 -120 Z" {...S} fill="rgba(5,5,5,0.85)" />
    <rect x={-70} y={-176} width={140} height={26} rx={6} {...S} transform={locked ? '' : `translate(0 ${-40}) rotate(${-25 + Math.sin(f * 0.2) * 5})`} />
    {locked ? (
      <g transform="translate(0 -90)">
        <rect x={-24} y={-6} width={48} height={40} rx={6} {...S} />
        <path d="M -14 -6 L -14 -22 C -14 -38 14 -38 14 -22 L 14 -6" {...S} />
      </g>
    ) : null}
    <text y={-30} textAnchor="middle" fill="#fff" fontFamily={FONT} fontWeight={900} fontSize={24} letterSpacing={4}>{label}</text>
  </g>
);
export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [T.s5.boxStart, T.s5.boxEnd], [0, 1], { ...clamp, easing: cubic });
  const rev = useSpring(T.s5.reveal, { damping: 11, stiffness: 170 });
  const jars = useSpring(T.s5.jars, { damping: 14 });
  const bx = 150, by = 500, bw = 780, bh = 180, per = 2 * (bw + bh);
  return (
    <SceneFrame start={T.scenes.s5[0]} duration={dur('s5')}>
      <Title at={T.s5.text} size={74} serif>Isso tem nome.</Title>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
        <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} />
      </svg>
      <div style={{ position: 'absolute', left: bx, width: bw, top: by + bh / 2, transform: `translateY(-50%) scale(${interpolate(rev, [0, 1], [1.4, 1])})`, opacity: interpolate(rev, [0, 0.3], [0, 1], clamp), textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 52, lineHeight: 1.12, letterSpacing: 3, color: '#fff', textShadow: '0 0 26px rgba(255,255,255,0.6)' }}>
        EFEITO
        <br />
        "DINHEIRO DA CASA"
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: jars, transform: `translateY(${(1 - jars) * 40}px)` }}>
        <Icon x={300} y={GROUND}>
          <Jar label="SALÁRIO" locked f={f} />
        </Icon>
        <Icon x={780} y={GROUND}>
          <Jar label="BÔNUS" locked={false} f={f} />
        </Icon>
        {new Array(8).fill(0).map((_, i) => {
          const t = ((f - T.s5.jars + i * 9) % 50) / 50;
          if (f < T.s5.jars) return null;
          return (
            <Icon key={i} x={780 + Math.sin(i * 2.3) * 40 + t * (i % 2 ? 120 : -120)} y={GROUND - 200 - t * 260} rotate={t * 300} scale={0.45} gold opacity={1 - t}>
              <rect x={-30} y={-16} width={60} height={32} rx={4} fill="#050505" stroke={GOLD} strokeWidth={3} />
            </Icon>
          );
        })}
      </div>
      <Small at={T.s5.study} y={1190} size={20}>
        EXPERIMENTO: QUEM RECEBEU O VALOR COMO "BÔNUS" GASTOU MAIS
        <br />
        DO QUE QUEM RECEBEU O MESMO VALOR COMO "DEVOLUÇÃO".
      </Small>
      <Impact at={T.s5.bold} y={1400} size={50}>
        MESMO DINHEIRO. RÓTULO DIFERENTE.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 6 — JANEIRO CHEGA =====================
const BILLS = ['IPVA', 'IPTU', 'MATERIAL ESCOLAR', 'FATURA DO NATAL'];
export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cal = spring({ frame: f - T.s6.cal, fps, config: { damping: 9, stiffness: 200 } });
  return (
    <SceneFrame start={T.scenes.s6[0]} duration={dur('s6')} transition="glitch">
      <Title at={T.s6.text} size={54} bold>E AÍ CHEGA JANEIRO.</Title>
      {f >= T.s6.cal ? <CalPage x={540} y={520} month="JAN" day="01" w={200} s={0.5 + cal * 0.5} /> : null}
      {BILLS.map((b, i) => {
        const st = T.s6.stamps[i];
        if (f < st) return null;
        const k = spring({ frame: f - st, fps, config: { damping: 11, stiffness: 220 } });
        return (
          <div key={b} style={{ position: 'absolute', left: 540 - 290, top: 790 + i * 92, width: 580, textAlign: 'center', transform: `rotate(${[-5, 4, -3, 5][i]}deg) scale(${interpolate(k, [0, 1], [2.4, 1])})`, opacity: Math.min(1, k * 2), border: '5px solid #fff', borderRadius: 12, padding: '8px 0', fontFamily: FONT, fontWeight: 900, fontSize: 40, letterSpacing: 5, color: '#fff', background: 'rgba(5,5,5,0.9)', boxShadow: '0 0 20px rgba(255,255,255,0.45)' }}>
            {b}
          </div>
        );
      })}
      <Impact at={T.s6.bold} y={1400} size={54}>
        COM O 13º JÁ GASTO.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 7 — DIVIDE ANTES =====================
const SPLIT = [
  { name: 'DÍVIDAS E JANEIRO', pct: '50%', value: 1860 },
  { name: 'RESERVA', pct: '30%', value: 1116 },
  { name: 'CURTIR SEM CULPA', pct: '20%', value: 744 },
];
export const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stack = useSpring(T.s7.stack, { damping: 12 });
  const split = interpolate(f, [T.s7.split, T.s7.split + 14], [0, 1], { ...clamp, easing: cubic });
  return (
    <SceneFrame start={T.scenes.s7[0]} duration={dur('s7')}>
      <Title at={T.s7.text} size={46}>QUEM ACUMULA DIVIDE ANTES DE GASTAR.</Title>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 600, transform: `translateY(-50%) scale(${(0.7 + stack * 0.3) * (1 - split * 0.3)})`, opacity: stack, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 90, color: GOLD, textShadow: '0 0 26px rgba(217,173,69,0.6)' }}>
        R$ 3.720
      </div>
      {SPLIT.map((sp, i) => {
        const x = [250, 540, 830][i];
        const fill = spring({ frame: f - T.s7.fills[i], fps, config: { damping: 14, stiffness: 120 } });
        const h = [260, 170, 120][i];
        // moedas voando do valor até o pote
        const cf = f - T.s7.split;
        return (
          <React.Fragment key={i}>
            {cf > 0 && cf < 40 ? new Array(3).fill(0).map((_, k) => {
              const p = Math.min(1, Math.max(0, (cf - k * 6 - i * 5) / 18));
              if (p <= 0 || p >= 1) return null;
              return (
                <Icon key={k} x={interpolate(p, [0, 1], [540, x])} y={interpolate(p, [0, 1], [620, GROUND - 120]) - Math.sin(p * Math.PI) * 100} gold scale={0.5}>
                  <circle r={20} fill="#050505" stroke={GOLD} strokeWidth={3} />
                </Icon>
              );
            }) : null}
            <div style={{ position: 'absolute', left: x - 120, top: GROUND - 300, width: 240, height: 300, opacity: split }}>
              <div style={{ position: 'absolute', left: 30, right: 30, bottom: 0, height: 290, border: '3px solid #fff', borderTop: 'none', borderRadius: '0 0 20px 20px', boxShadow: '0 0 14px rgba(255,255,255,0.3)', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h * fill, background: 'linear-gradient(to top, rgba(217,173,69,0.55), rgba(217,173,69,0.15))' }} />
              </div>
            </div>
            <div style={{ position: 'absolute', left: x - 140, width: 280, top: GROUND + 20, opacity: fill, textAlign: 'center', fontFamily: FONT }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: GOLD }}>{brl(sp.value)}</div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 3, color: '#fff', marginTop: 4 }}>{sp.pct} · {sp.name}</div>
            </div>
          </React.Fragment>
        );
      })}
      <Impact at={T.s7.bold} y={1420} size={52}>
        E AINDA CURTE. SEM CULPA.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 8 — A ORDEM =====================
const ORDER = ['QUITA O JURO CARO (ROTATIVO, CHEQUE ESPECIAL)', 'SEPARA AS CONTAS DE JANEIRO', 'GUARDA A RESERVA', 'CURTE O RESTO'];
export const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SceneFrame start={T.scenes.s8[0]} duration={dur('s8')} ground={false}>
      <Title at={T.s8.text} size={56} bold>A ORDEM IMPORTA.</Title>
      {ORDER.map((o, i) => {
        const st = T.s8.items[i];
        const k = spring({ frame: f - st, fps, config: { damping: 12, stiffness: 170 } });
        const on = f >= st;
        return (
          <div key={i} style={{ position: 'absolute', left: 130, width: 820, top: 560 + i * 125, height: 100, display: 'flex', alignItems: 'center', gap: 26, opacity: 0.3 + 0.7 * Math.min(1, k * 1.5), transform: `translateX(${(1 - k) * -40}px)` }}>
            <div style={{ width: 84, height: 84, flexShrink: 0, borderRadius: 42, border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: on ? '#050505' : '#fff', background: on ? '#fff' : 'transparent', boxShadow: on ? '0 0 22px rgba(255,255,255,0.7)' : 'none', transform: `scale(${on ? 1 + 0.15 * Math.exp(-(f - st) / 5) : 1})` }}>
              {on ? '✓' : i + 1}
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: i === 0 ? 30 : 36, lineHeight: 1.2, letterSpacing: 2, color: '#fff' }}>{o}</div>
          </div>
        );
      })}
    </SceneFrame>
  );
};

// ===================== CENA 9 — DOIS JANEIROS =====================
export const Scene9: React.FC = () => {
  const L = useSpring(T.s9.left, { damping: 12, stiffness: 160 });
  const R = useSpring(T.s9.right, { damping: 12, stiffness: 160 });
  const split = useSpring(T.s9.text);
  return (
    <SceneFrame start={T.scenes.s9[0]} duration={dur('s9')}>
      <Title at={T.s9.text} size={50}>JANEIRO DE QUEM GASTOU vs. DE QUEM DIVIDIU</Title>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <line x1={540} x2={540} y1={560} y2={560 + 940 * split} stroke="#fff" strokeOpacity={0.5} strokeWidth={3} strokeDasharray="16 14" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, opacity: L }}>
        <CalPage x={270} y={560} month="JAN" day="01" w={150} />
        <Person x={270} glow={0.1} label="VOCÊ" scale={0.8} squash={0.35} opacity={0.75} />
        <div style={{ position: 'absolute', left: 70, width: 400, top: 1230, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 22, lineHeight: 1.45, letterSpacing: 3, color: '#fff' }}>
          FATURA ALTA
          <br />
          13º JÁ ERA
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: R }}>
        <CalPage x={810} y={560} month="JAN" day="01" w={150} />
        <Person x={810} glow={0.7} glowColor={GOLD} scale={0.8} />
        <div style={{ position: 'absolute', left: 610, width: 400, top: 1230, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 22, lineHeight: 1.45, letterSpacing: 3, color: '#fff' }}>
          CONTAS PAGAS
          <br />
          RESERVA DE <span style={{ color: GOLD }}>R$ 1.116</span>
        </div>
      </div>
      <Impact at={T.s9.bold} y={1420} size={56}>
        MESMO 13º. OUTRO ANO.
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
        <div style={{ position: 'absolute', left: PINX - NW / 2 + 50, width: NW - 100, top: PINY + 80, fontFamily: FONT, fontWeight: 700, fontSize: 42, lineHeight: 1.42, letterSpacing: 3, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.3)', whiteSpace: 'pre' }}>
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
        <div style={pill(p1, false)}>GASTA ATÉ O NATAL</div>
        <div style={{ opacity: ou, fontFamily: FONT, fontWeight: 600, fontSize: 24, letterSpacing: 4, color: 'rgba(255,255,255,0.7)' }}>OU</div>
        <div style={pill(p2, true)}>DIVIDE ANTES</div>
      </div>
      <Person x={540} glow={0.45} label="VOCÊ" />
    </SceneFrame>
  );
};

