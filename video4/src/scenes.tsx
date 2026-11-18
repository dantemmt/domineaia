import React from 'react';
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import T from './timeline.json';
import { W, H, GROUND, TEXT_Y, GOLD, FONT, GLOW, clamp, useSpring, brl, Title, Person, Glitch, SceneFrame } from './ui';
import { Icon, Note } from './icons';
import { CardFront, CardBack, Bank, Wallet, Cursor, Confetti } from './icons4';

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
// texto que some quando o próximo entra (sequência no mesmo lugar)
const Seq: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const f = useCurrentFrame();
  if (f >= to) return null;
  return <div style={{ position: 'absolute', inset: 0, opacity: interpolate(f, [to - 8, to], [1, 0], clamp) }}>{children}</div>;
};

// ===================== CENA 1 — GANCHO =====================
export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [T.s1.spinStart, T.s1.spinEnd], [0, 1], { ...clamp, easing: cubic });
  const ang = (1 - p) * 540;
  const back = Math.cos((ang * Math.PI) / 180) < 0;
  const settle = f >= T.s1.spinEnd ? Math.exp(-(f - T.s1.spinEnd) / 5) * Math.sin((f - T.s1.spinEnd) * 0.9) * 4 : 0;
  const label = useSpring(T.s1.label);
  return (
    <SceneFrame start={T.scenes.s1[0]} duration={dur('s1')}>
      <div style={{ position: 'absolute', left: 300, top: 560, width: 480, height: 320, transform: `perspective(1400px) rotateY(${ang + settle}deg)`, filter: 'drop-shadow(0 0 10px rgba(217,173,69,0.45))' }}>
        <svg width={480} height={320} style={{ overflow: 'visible', transform: back ? 'scaleX(-1)' : undefined }}>
          <g transform="translate(240 160)">{back ? <CardBack /> : <CardFront />}</g>
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 940, opacity: label, transform: `translateY(${(1 - label) * 14}px)`, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: '#fff' }}>
        LIMITE DISPONÍVEL: <Gold>R$ 5.000</Gold>
      </div>
      <Impact at={T.s1.hookText} y={1370} size={60}>
        SEU LIMITE DO CARTÃO NÃO É SEU DINHEIRO.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 2 =====================
export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const g = T.s2.glitches.some((a) => f >= a && f < a + 5);
  return (
    <SceneFrame start={T.scenes.s2[0]} duration={dur('s2')} transition="glitch">
      <Glitch active={g} seed="s2" strength={34}>
        <Title at={T.s2.text} size={54} bold>
          PARECE ÓBVIO. MAS O SEU CÉREBRO NÃO ACHA.
        </Title>
      </Glitch>
      <Person x={540} glow={0.35} label="VOCÊ" />
    </SceneFrame>
  );
};

// ===================== CENA 3 — A CONTA ERRADA =====================
export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const b1 = useSpring(T.s3.bar1, { damping: 12, stiffness: 170 });
  const b2 = useSpring(T.s3.bar2, { damping: 12, stiffness: 170 });
  const fuse = interpolate(f, [T.s3.fuseStart, T.s3.fuseEnd], [0, 1], { ...clamp, easing: inOut });
  const merged = useSpring(T.s3.merged, { damping: 11, stiffness: 160 });
  const glitchOn = f >= T.s3.glitch && f < T.s3.glitch + 6;
  const shake = f >= T.s3.glitch && f < T.s3.glitch + 10 ? Math.sin(f * 3.1) * 8 : 0;
  const strike = interpolate(f, [T.s3.strike, T.s3.strikeEnd], [0, 1], { ...clamp, easing: cubic });
  const after = interpolate(f, [T.s3.strikeEnd, T.s3.strikeEnd + 12], [0, 1], { ...clamp, easing: cubic });
  const X0 = 160, FULL = 760, W1 = (FULL * 2800) / 7800, W2 = FULL - W1;
  const y1 = 640, y2 = interpolate(fuse, [0, 1], [780, 640]);
  const x2 = interpolate(fuse, [0, 1], [X0, X0 + W1]);
  const lbl = (x: number, y: number, name: string, val: string, op: number) => (
    <div style={{ position: 'absolute', left: x, top: y - 52, opacity: op, fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: '#fff', whiteSpace: 'nowrap' }}>
      {name} <Gold>{val}</Gold>
    </div>
  );
  return (
    <SceneFrame start={T.scenes.s3[0]} duration={dur('s3')}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${shake}px)` }}>
        <Glitch active={glitchOn} seed="s3" strength={40}>
          {lbl(X0, y1, 'SALÁRIO', 'R$ 2.800', b1 * (1 - merged))}
          {lbl(X0, 780, 'LIMITE', 'R$ 5.000', b2 * (1 - fuse))}
          <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: `drop-shadow(0 0 ${6 + merged * 16}px rgba(255,255,255,${0.4 + merged * 0.4}))` }}>
            <rect x={X0} y={y1} width={W1 * b1} height={60} rx={10} fill="rgba(255,255,255,0.14)" stroke="#fff" strokeWidth={3} />
            <rect x={x2} y={y2} width={W2 * b2} height={60} rx={10} fill={`rgba(255,255,255,${0.06 + merged * 0.12 - after * 0.14})`} stroke="#fff" strokeWidth={3} strokeDasharray={after > 0 ? '10 10' : undefined} opacity={1 - after * 0.6} />
          </svg>
          <div style={{ position: 'absolute', left: 120, width: 840, top: 560, transform: `translateY(-50%) scale(${0.8 + merged * 0.2})`, opacity: merged, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 54, letterSpacing: 3, color: '#fff' }}>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <Gold>R$ 7.800</Gold>
              <span style={{ position: 'absolute', left: -8, top: '52%', height: 6, width: `calc(${strike * 100}% + 16px)`, background: '#fff', boxShadow: '0 0 12px #fff' }} />
            </span>{' '}
            PRA GASTAR
          </div>
        </Glitch>
      </div>
      <Person x={540} glow={0.35 + merged * 0.4 - after * 0.3} label="VOCÊ" />
      <Impact at={T.s3.bold} y={1380} size={56}>
        ERRADO. SÓ <Gold>R$ 2.800</Gold> SÃO SEUS.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 4 — O PRESENTE =====================
export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const phone = useSpring(T.s4.phone, { damping: 14 });
  const notif = useSpring(T.s4.notif, { damping: 14, stiffness: 140 });
  const PX = 540, PY = 820, PW = 340, PH = 560;
  return (
    <SceneFrame start={T.scenes.s4[0]} duration={dur('s4')}>
      <Seq from={T.s4.text1} to={T.s4.text2}>
        <Title at={T.s4.text1} size={46}>QUANDO O BANCO AUMENTA SEU LIMITE...</Title>
      </Seq>
      <Title at={T.s4.text2} size={50} bold>...ELE NÃO ESTÁ TE DANDO UM PRESENTE.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: phone, transform: `translateY(${(1 - phone) * 60}px)` }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
          <rect x={PX - PW / 2} y={PY - PH / 2} width={PW} height={PH} rx={40} fill="rgba(5,5,5,0.9)" stroke="#fff" strokeWidth={3} />
          <line x1={PX - 30} x2={PX + 30} y1={PY - PH / 2 + 24} y2={PY - PH / 2 + 24} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', left: PX - PW / 2 + 16, top: PY - PH / 2 + 50, width: PW - 32, height: PH - 80, overflow: 'hidden', borderRadius: 20 }}>
          <div style={{ position: 'absolute', left: 6, right: 6, top: interpolate(notif, [0, 1], [-200, 16]), opacity: notif, border: '2px solid #fff', borderRadius: 18, padding: '16px 10px', textAlign: 'center', fontFamily: FONT, background: 'rgba(255,255,255,0.06)', filter: GLOW }}>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 3, color: '#fff' }}>PARABÉNS!</div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2, color: '#fff', marginTop: 8, lineHeight: 1.35 }}>
              SEU LIMITE
              <br />
              AUMENTOU PARA
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 2, color: GOLD, marginTop: 6 }}>R$ 8.000</div>
          </div>
        </div>
      </div>
      {/* confetes: caem, congelam no segundo texto e despencam no chão */}
      {new Array(34).fill(0).map((_, i) => {
        const st = T.s4.confetti + random(`c${i}`) * 50;
        if (f < st) return null;
        const x0 = 150 + random(`cx${i}`) * 780;
        const sp = 2.2 + random(`cs${i}`) * 2;
        const tf = Math.min(f, T.s4.freeze) - st;
        let y = 470 + tf * sp;
        let rot = tf * (6 + random(`cr${i}`) * 10);
        let x = x0 + Math.sin(tf * 0.12 + i) * 24;
        if (f > T.s4.drop) {
          const k = interpolate(f, [T.s4.drop, T.s4.drop + 14 + random(`cd${i}`) * 8], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
          y = interpolate(k, [0, 1], [y, GROUND - 6]);
          rot = interpolate(k, [0, 1], [rot, Math.round(rot / 180) * 180]);
        }
        if (y > GROUND - 6) y = GROUND - 6;
        return (
          <Icon key={i} x={x} y={y} rotate={rot} opacity={0.85}>
            <Confetti kind={i} />
          </Icon>
        );
      })}
    </SceneFrame>
  );
};

// ===================== CENA 5 — O BURACO =====================
export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const open = interpolate(f, [T.s5.open, T.s5.openEnd], [0, 1], { ...clamp, easing: cubic });
  const deep = interpolate(f, [T.s5.deepStart, T.s5.deepEnd], [0, 1], { ...clamp, easing: inOut });
  const MAXD = 300;
  const depth = open * MAXD * (5 / 8) + deep * MAXD * (3 / 8);
  const value = 5000 + 3000 * deep;
  const HX0 = 400, HX1 = 700;
  const gap = open;
  const gx0 = interpolate(gap, [0, 1], [550, HX0]), gx1 = interpolate(gap, [0, 1], [550, HX1]);
  const rumble = f >= T.s5.open && f < T.s5.deepEnd ? Math.sin(f * 2.3) * 1.6 : 0;
  return (
    <SceneFrame start={T.scenes.s5[0]} duration={dur('s5')} ground={false}>
      <Impact at={T.s5.text} y={TEXT_Y} size={52}>
        ELE ESTÁ AUMENTANDO O TAMANHO DO BURACO.
      </Impact>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: rumble, filter: GLOW }}>
        <line x1={-200} x2={gx0} y1={GROUND} y2={GROUND} stroke="#fff" strokeOpacity={0.55} strokeWidth={3} strokeDasharray="18 14" />
        <line x1={gx1} x2={W + 200} y1={GROUND} y2={GROUND} stroke="#fff" strokeOpacity={0.55} strokeWidth={3} strokeDasharray="18 14" />
        {open > 0 ? (
          <>
            <path d={`M ${gx0} ${GROUND} L ${gx0} ${GROUND + depth} L ${gx1} ${GROUND + depth} L ${gx1} ${GROUND}`} fill="rgba(0,0,0,0.6)" stroke="#fff" strokeWidth={3} />
            {/* régua */}
            <line x1={760} x2={760} y1={GROUND} y2={GROUND + depth} stroke="#fff" strokeWidth={3} />
            {new Array(Math.floor(depth / 25) + 1).fill(0).map((_, i) => (
              <line key={i} x1={760} x2={i % 4 === 0 ? 790 : 776} y1={GROUND + i * 25} y2={GROUND + i * 25} stroke="#fff" strokeWidth={2} />
            ))}
            <line x1={750} x2={800} y1={GROUND + depth} y2={GROUND + depth} stroke={GOLD} strokeWidth={4} />
          </>
        ) : null}
      </svg>
      {open > 0.3 ? (
        <div style={{ position: 'absolute', left: 810, top: GROUND + depth + rumble, transform: 'translateY(-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 36, letterSpacing: 2, color: GOLD, textShadow: '0 0 16px rgba(217,173,69,0.5)', fontVariantNumeric: 'tabular-nums', opacity: interpolate(open, [0.3, 1], [0, 1]), whiteSpace: 'nowrap' }}>
          {brl(Math.round(value / 100) * 100)}
        </div>
      ) : null}
      <Person x={320} glow={0.3} label="VOCÊ" squash={0.18} />
    </SceneFrame>
  );
};

// ===================== CENA 6 — A FATURA =====================
export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const app = useSpring(T.s6.app, { damping: 15 });
  const PX = 540, PY = 840, PW = 520, PH = 600;
  const bTotal = { x: PX - 118, y: PY + 150 }, bMin = { x: PX + 118, y: PY + 150 };
  // trajetória do cursor
  const start = { x: 860, y: 1180 };
  const pA = interpolate(f, [T.s6.cursorIn, T.s6.hover], [0, 1], { ...clamp, easing: inOut });
  const pB = interpolate(f, [T.s6.hesitateEnd, T.s6.click - 4], [0, 1], { ...clamp, easing: inOut });
  const wob = f > T.s6.hover && f < T.s6.hesitateEnd ? Math.sin((f - T.s6.hover) * 0.5) * 10 : 0;
  let cx = interpolate(pA, [0, 1], [start.x, bTotal.x + 30]) + wob;
  let cy = interpolate(pA, [0, 1], [start.y, bTotal.y + 6]);
  if (f >= T.s6.hesitateEnd) {
    cx = interpolate(pB, [0, 1], [bTotal.x + 30, bMin.x + 20]);
    cy = interpolate(pB, [0, 1], [bTotal.y + 6, bMin.y + 6]) - Math.sin(pB * Math.PI) * 30;
  }
  const press = f >= T.s6.click && f < T.s6.click + 8 ? 0.94 : 1;
  const hoverTotal = f >= T.s6.hover && f < T.s6.hesitateEnd;
  const clicked = f >= T.s6.click;
  const btn = (b: { x: number; y: number }, txt: string, hl: boolean, sc: number) => (
    <div style={{ position: 'absolute', left: b.x - 108, top: b.y - 34, width: 216, height: 68, boxSizing: 'border-box', transform: `scale(${sc})`, border: '3px solid #fff', borderRadius: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 19, letterSpacing: 2, color: hl ? '#050505' : '#fff', background: hl ? '#fff' : 'rgba(5,5,5,0.9)', boxShadow: hl ? '0 0 18px rgba(255,255,255,0.6)' : 'none' }}>
      {txt}
    </div>
  );
  return (
    <SceneFrame start={T.scenes.s6[0]} duration={dur('s6')}>
      <Seq from={T.s6.text1} to={T.s6.text2}>
        <Title at={T.s6.text1} size={50}>UM DIA A FATURA NÃO FECHA.</Title>
      </Seq>
      <Title at={T.s6.text2} size={56} bold>VOCÊ PAGA O MÍNIMO.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: app, transform: `translateY(${(1 - app) * 50}px)` }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
          <rect x={PX - PW / 2} y={PY - PH / 2} width={PW} height={PH} rx={36} fill="rgba(5,5,5,0.9)" stroke="#fff" strokeWidth={3} />
          <line x1={PX - PW / 2} x2={PX + PW / 2} y1={PY - PH / 2 + 80} y2={PY - PH / 2 + 80} stroke="#fff" strokeWidth={2} strokeOpacity={0.5} />
        </svg>
        <div style={{ position: 'absolute', left: PX - PW / 2, width: PW, top: PY - PH / 2 + 26, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: 5, color: 'rgba(255,255,255,0.8)' }}>CARTÃO · FATURA</div>
        <div style={{ position: 'absolute', left: PX - PW / 2, width: PW, top: PY - 150, textAlign: 'center', fontFamily: FONT }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 3, color: '#fff' }}>FATURA DE NOVEMBRO</div>
          <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: 2, color: GOLD, marginTop: 10, textShadow: '0 0 22px rgba(217,173,69,0.5)' }}>R$ 2.000</div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: 3, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>VENCE HOJE</div>
        </div>
        {btn(bTotal, 'PAGAR TOTAL', hoverTotal, 1)}
        {btn(bMin, 'PAGAR MÍNIMO', clicked, clicked ? press : 1)}
        {f >= T.s6.cursorIn ? (
          <Icon x={cx} y={cy} scale={press}>
            <Cursor />
          </Icon>
        ) : null}
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 7 — O ROTATIVO =====================
const MONTHS = ['DEZ', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI'];
export const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const M = T.s7.months;
  const done = M.filter((m) => f >= m).length;
  const val = 2000 + 2000 * interpolate(f, [M[0], M[M.length - 1] + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const hit = f >= T.s7.hit ? Math.exp(-(f - T.s7.hit) / 6) : 0;
  const barW = interpolate(val, [2000, 4000], [200, 640]);
  const law = useSpring(T.s7.law);
  return (
    <SceneFrame start={T.scenes.s7[0]} duration={dur('s7')}>
      <Title at={T.s7.text} size={50}>O RESTO ENTRA NO ROTATIVO.</Title>
      {MONTHS.map((m, i) => {
        const on = i < done;
        const flip = M[i] !== undefined && f >= M[i] && f < M[i] + 6 ? Math.cos(((f - M[i]) / 6) * Math.PI) : 1;
        return (
          <div key={m} style={{ position: 'absolute', left: 150 + i * 135, top: 540, width: 110, height: 110, transform: `scaleY(${Math.abs(flip)})`, boxSizing: 'border-box', border: `3px solid ${on ? '#fff' : 'rgba(255,255,255,0.35)'}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, filter: on ? GLOW : undefined }}>
            <div style={{ position: 'absolute', top: 26, left: 0, right: 0, borderTop: `3px solid ${on ? '#fff' : 'rgba(255,255,255,0.35)'}` }} />
            <div style={{ marginTop: 22, fontSize: 28, fontWeight: 800, letterSpacing: 3, color: on ? '#fff' : 'rgba(255,255,255,0.35)' }}>{m}</div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 120, width: 840, top: 790, transform: `translateY(-50%) scale(${1 + hit * 0.12})`, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 110, letterSpacing: 3, color: GOLD, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 ${24 + hit * 30}px rgba(217,173,69,0.6)` }}>
        {brl(Math.round(val / 10) * 10)}
      </div>
      {/* barra de dívida empurrando o personagem */}
      <div style={{ position: 'absolute', left: 120, top: GROUND - 84, width: barW, height: 84, boxSizing: 'border-box', border: `3px solid ${GOLD}`, borderRadius: 8, background: 'rgba(217,173,69,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 26, letterSpacing: 6, color: GOLD, boxShadow: '0 0 16px rgba(217,173,69,0.35)' }}>
        DÍVIDA
      </div>
      <Person x={Math.min(900, 120 + barW + 62)} glow={0.3} label="VOCÊ" squash={0.1 + 0.15 * (val - 2000) / 2000} />
      <Impact at={T.s7.bold} y={1360} size={44}>
        MESMO COM O LIMITE DA LEI, A DÍVIDA PODE DOBRAR.
      </Impact>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 1480, opacity: law * 0.75, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 19, lineHeight: 1.45, letterSpacing: 3, color: '#fff' }}>
        LEI 14.690/2023: JUROS E ENCARGOS DO ROTATIVO
        <br />
        LIMITADOS A 100% DA DÍVIDA ORIGINAL
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 8 — ISSO TEM NOME =====================
export const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [T.s8.boxStart, T.s8.boxEnd], [0, 1], { ...clamp, easing: cubic });
  const rev = useSpring(T.s8.reveal, { damping: 11, stiffness: 170 });
  const sub = useSpring(T.s8.sub);
  const bx = 150, by = 600, bw = 780, bh = 230, per = 2 * (bw + bh);
  return (
    <SceneFrame start={T.scenes.s8[0]} duration={dur('s8')} transition="glitch">
      <Title at={T.s8.text} size={74} serif>Isso tem nome.</Title>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
        <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} />
      </svg>
      <div style={{ position: 'absolute', left: bx, width: bw, top: by + bh / 2, transform: `translateY(-50%) scale(${interpolate(rev, [0, 1], [1.3, 1])})`, opacity: interpolate(rev, [0, 0.3], [0, 1], clamp), textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 64, lineHeight: 1.1, letterSpacing: 3, color: '#fff', textShadow: '0 0 24px rgba(255,255,255,0.5)' }}>
        CONTABILIDADE
        <br />
        MENTAL
      </div>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 900, opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 32, lineHeight: 1.4, letterSpacing: 3, color: 'rgba(255,255,255,0.85)' }}>
        SEU CÉREBRO SOMA O LIMITE
        <br />
        COM O SALÁRIO.
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 9 — A VIRADA =====================
export const Scene9: React.FC = () => {
  const bank = useSpring(T.s9.bank, { damping: 20, stiffness: 60 });
  return (
    <SceneFrame start={T.scenes.s9[0]} duration={dur('s9')}>
      <div style={{ position: 'absolute', left: 290, top: 640, width: 500, height: 520, background: 'radial-gradient(ellipse at 50% 30%, rgba(200,220,255,0.16), rgba(200,220,255,0) 65%)', opacity: bank }} />
      <div style={{ position: 'absolute', inset: 0, opacity: bank * 0.55, filter: 'drop-shadow(0 0 12px rgba(200,220,255,0.6))' }}>
        <Icon x={540} y={GROUND} scale={0.95}>
          <Bank />
        </Icon>
      </div>
      <Impact at={T.s9.line1} y={430} size={50}>
        PRO BANCO, O CLIENTE IDEAL NÃO É QUEM PAGA EM DIA.
      </Impact>
      <Impact at={T.s9.line2} y={1370} size={50}>
        É QUEM PAGA UM POUCO, TODO MÊS, PRA SEMPRE.
      </Impact>
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
  const clicked = f >= T.s10.click;
  const press = f >= T.s10.click && f < T.s10.click + 6 ? 0.9 : 1;
  const item = (x: number, s: number, icon: React.ReactNode, txt: React.ReactNode) => (
    <div style={{ position: 'absolute', inset: 0, opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
      {icon}
      <div style={{ position: 'absolute', left: x - 130, width: 260, top: 700, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 21, lineHeight: 1.3, letterSpacing: 3, color: '#fff' }}>{txt}</div>
    </div>
  );
  return (
    <SceneFrame start={T.scenes.s10[0]} duration={dur('s10')}>
      <Title at={T.s10.text} size={48}>QUEM ACUMULA USA O CARTÃO DIFERENTE.</Title>
      {item(
        270,
        s1,
        <>
          <Icon x={270} y={612} scale={0.36} gold>
            <CardFront />
          </Icon>
          <div style={{ position: 'absolute', left: 270 - 60, top: 538, width: 120, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 22, letterSpacing: 1, color: GOLD, background: '#050505', border: `2px solid ${GOLD}`, borderRadius: 8, padding: '2px 0' }}>R$ 1.500</div>
        </>,
        <>LIMITE QUE<br />ELE ESCOLHEU</>,
      )}
      {item(
        540,
        s2,
        <>
          <div style={{ position: 'absolute', left: 540 - 105, top: 588, width: 210, height: 58, boxSizing: 'border-box', transform: `scale(${press})`, border: '3px solid #fff', borderRadius: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 18, letterSpacing: 2, color: clicked ? '#050505' : '#fff', background: clicked ? '#fff' : 'transparent', boxShadow: clicked ? '0 0 16px rgba(255,255,255,0.6)' : 'none' }}>
            PAGAR TOTAL
          </div>
          {f >= i2 ? (
            <Icon x={interpolate(f, [i2, T.s10.click], [640, 580], { ...clamp, easing: inOut })} y={interpolate(f, [i2, T.s10.click], [690, 622], { ...clamp, easing: inOut })} scale={0.8 * press}>
              <Cursor />
            </Icon>
          ) : null}
        </>,
        <>FATURA SEMPRE<br />INTEIRA</>,
      )}
      {item(
        810,
        s3,
        <Icon x={810} y={620} scale={0.9}>
          <Wallet />
        </Icon>,
        <>SÓ GASTA O QUE<br />JÁ TEM</>,
      )}
      <div style={{ position: 'absolute', inset: 0, opacity: other, transform: `translateY(${(1 - other) * 30}px)` }}>
        <Person x={540} glow={0.6} glowColor={GOLD} />
      </div>
      <Impact at={T.s10.bold} y={1400} size={54}>
        FERRAMENTA. NÃO SALÁRIO.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 11 — GUARDA ESSA REGRA =====================
export const Scene11: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fall = spring({ frame: f - T.s11.noteFall, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
  const tSince = Math.max(0, f - T.s11.noteFall);
  const sw = 6 * Math.exp(-tSince / 18) * Math.sin(tSince * 0.3) + 0.8 * Math.sin(f * 0.07);
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
  const pulse = f >= T.s12.pill2 + 8 ? 0.5 + 0.5 * Math.sin((f - T.s12.pill2) * 0.25) : 0;
  const pill = (s: number, gold: boolean): React.CSSProperties => ({
    opacity: s,
    transform: `scale(${0.6 + s * 0.4 + (gold ? pulse * 0.04 : 0)})`,
    border: `3px solid ${gold ? GOLD : '#fff'}`,
    borderRadius: 60, padding: '18px 24px', fontFamily: FONT, fontWeight: 800, fontSize: 24, letterSpacing: 3, whiteSpace: 'nowrap',
    color: gold ? '#f3d98f' : '#fff',
    background: gold ? `rgba(217,173,69,${0.1 + pulse * 0.12})` : 'rgba(255,255,255,0.03)',
    boxShadow: gold ? `0 0 ${14 + pulse * 26}px rgba(217,173,69,${0.35 + pulse * 0.35})` : '0 0 10px rgba(255,255,255,0.25)',
  });
  return (
    <SceneFrame start={T.scenes.s12[0]} duration={dur('s12')}>
      <Title at={T.s12.text} size={140} bold>E VOCÊ?</Title>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 690, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <div style={pill(p1, false)}>VIVE NO LIMITE</div>
        <div style={{ opacity: ou, fontFamily: FONT, fontWeight: 600, fontSize: 24, letterSpacing: 4, color: 'rgba(255,255,255,0.7)' }}>OU</div>
        <div style={pill(p2, true)}>VIVE DO SALÁRIO</div>
      </div>
      <Person x={540} glow={0.45} label="VOCÊ" />
    </SceneFrame>
  );
};
