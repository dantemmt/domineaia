import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import T from './timeline.json';
import { W, H, GROUND, GOLD, FONT, GLOW, clamp, useSpring, brl, Title, Person, SceneFrame } from './ui';
import { Icon, Note, Brain } from './icons';

const dur = (k: keyof typeof T.scenes) => T.scenes[k][1] - T.scenes[k][0];
const cubic = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);

const Impact: React.FC<{ at: number; y: number; size: number; children: React.ReactNode }> = ({ at, y, size, children }) => {
  const s = useSpring(at, { damping: 12, stiffness: 160 });
  return (
    <div style={{ position: 'absolute', left: 120, width: 840, top: y, transform: `translateY(-50%) scale(${interpolate(s, [0, 1], [1.2, 1])})`, opacity: interpolate(s, [0, 0.3], [0, 1], clamp), textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.12, letterSpacing: 3, color: '#fff', textShadow: '0 0 22px rgba(255,255,255,0.45)' }}>
      {children}
    </div>
  );
};
const Gold: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: GOLD, textShadow: '0 0 16px rgba(217,173,69,0.5)' }}>{children}</span>;
const Small: React.FC<{ at: number; y: number; children: React.ReactNode; size?: number }> = ({ at, y, children, size = 22 }) => {
  const s = useSpring(at);
  return (
    <div style={{ position: 'absolute', left: 120, width: 840, top: y, opacity: s * 0.8, transform: `translateY(${(1 - s) * 10}px)`, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.45, letterSpacing: 3, color: '#fff' }}>
      {children}
    </div>
  );
};

// ---------- Cartão de dívida ----------
type Debt = { name: string; value: string };
const DEBTS: Debt[] = [
  { name: 'LOJA', value: 'R$ 180' },
  { name: 'CELULAR', value: 'R$ 450' },
  { name: 'CARTÃO', value: 'R$ 2.400' },
  { name: 'EMPRÉSTIMO', value: 'R$ 3.000' },
];
const DebtCard: React.FC<{ x: number; y: number; d: Debt; s?: number; op?: number; glow?: number; fill?: number; paid?: number; w?: number; h?: number }> = ({ x, y, d, s = 1, op = 1, glow = 0, fill = 0, paid = 0, w = 180, h = 124 }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, boxSizing: 'border-box', transform: `scale(${s})`, opacity: op, border: `3px solid ${glow > 0 ? `rgba(255,255,255,${0.7 + glow * 0.3})` : 'rgba(255,255,255,0.85)'}`, borderRadius: 16, background: 'rgba(5,5,5,0.9)', overflow: 'hidden', fontFamily: FONT, textAlign: 'center', boxShadow: `0 0 ${8 + glow * 30}px rgba(255,255,255,${0.2 + glow * 0.5})` }}>
    <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: `${fill * 100}%`, background: 'rgba(217,173,69,0.22)' }} />
    <div style={{ position: 'relative', marginTop: h * 0.18, fontSize: h * 0.15, fontWeight: 700, letterSpacing: 2, color: '#fff' }}>{d.name}</div>
    <div style={{ position: 'relative', marginTop: 4, fontSize: h * 0.26, fontWeight: 900, letterSpacing: 1, color: GOLD }}>{d.value}</div>
    {paid > 0 ? (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, paid * 1.5) }}>
        <div style={{ transform: `rotate(-12deg) scale(${interpolate(paid, [0, 1], [2.2, 1])})`, border: '4px solid #fff', borderRadius: 10, padding: '4px 12px', fontSize: h * 0.17, fontWeight: 900, letterSpacing: 4, color: '#fff', background: 'rgba(5,5,5,0.85)', boxShadow: '0 0 18px rgba(255,255,255,0.7)' }}>QUITADA ✓</div>
      </div>
    ) : null}
  </div>
);
const ROW_X = [240, 440, 640, 840];

// ===================== CENA 1 — A PERGUNTA =====================
export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SceneFrame start={T.scenes.s1[0]} duration={dur('s1')}>
      <Impact at={T.s1.question} y={400} size={52}>
        VOCÊ TEM 4 DÍVIDAS E <Gold>R$&nbsp;300</Gold> SOBRANDO. QUAL VOCÊ PAGA PRIMEIRO?
      </Impact>
      {DEBTS.map((d, i) => {
        const s = spring({ frame: f - T.s1.cards[i], fps, config: { damping: 11, stiffness: 180 } });
        const bob = Math.sin(f * 0.12 + i) * 6;
        return <DebtCard key={i} x={ROW_X[i]} y={690 + bob + (1 - s) * 40} d={d} s={0.6 + s * 0.4} op={s} />;
      })}
      <Person x={540} glow={0.4} label="VOCÊ" />
      <div style={{ position: 'absolute', left: 600, top: 790, fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', opacity: interpolate(f, [T.s1.question, T.s1.question + 8], [0, 0.9], clamp), transform: `scale(${1 + 0.1 * Math.sin(f * 0.3)})`, textShadow: '0 0 16px rgba(255,255,255,0.6)' }}>?</div>
    </SceneFrame>
  );
};

// ===================== CENA 2 — A MAIORIA =====================
export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const spot = interpolate(f, [T.s2.spot, T.s2.spot + 10], [0, 1], { ...clamp, easing: cubic });
  return (
    <SceneFrame start={T.scenes.s2[0]} duration={dur('s2')} transition="glitch">
      <Title at={T.s2.text} size={52} bold>QUASE TODO MUNDO ESCOLHE A MAIOR.</Title>
      {DEBTS.map((d, i) => (
        <DebtCard key={i} x={ROW_X[i]} y={690} d={d} op={i === 3 ? 1 : 1 - spot * 0.7} s={i === 3 ? 1 + spot * 0.12 : 1} glow={i === 3 ? spot : 0} />
      ))}
      <div style={{ position: 'absolute', left: 840 - 140, top: 560, width: 280, height: 260, opacity: spot, background: 'radial-gradient(ellipse, rgba(255,255,255,0.14), rgba(255,255,255,0) 70%)' }} />
      <Person x={540} glow={0.35} label="VOCÊ" />
    </SceneFrame>
  );
};

// ===================== CENA 3 — PAGA E NADA MUDA =====================
export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const bar = useSpring(T.s3.bar, { damping: 16 });
  const fly = interpolate(f, [T.s3.coin, T.s3.coinLand], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const shrink = interpolate(f, [T.s3.coinLand, T.s3.shrinkEnd], [0, 1], { ...clamp, easing: cubic });
  const left = 3000 - 580 * shrink;
  const month = useSpring(T.s3.month, { damping: 13 });
  const X0 = 160, BW = 760;
  const tired = interpolate(f, [T.s3.month, T.s3.bold + 20], [0, 0.35], clamp);
  return (
    <SceneFrame start={T.scenes.s3[0]} duration={dur('s3')}>
      <Title at={T.s3.text} size={46}>VOCÊ PAGA, PAGA... E A BARRA MAL SE MEXE.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: bar }}>
        <div style={{ position: 'absolute', left: X0, top: 560, fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: '#fff' }}>
          EMPRÉSTIMO <Gold>R$ 3.000</Gold>
        </div>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
          <rect x={X0} y={605} width={BW} height={70} rx={12} fill="none" stroke="#fff" strokeWidth={3} />
          <rect x={X0 + 6} y={611} width={(BW - 12) * (left / 3000) * bar} height={58} rx={8} fill="rgba(255,255,255,0.22)" />
        </svg>
        <div style={{ position: 'absolute', left: X0, width: BW, top: 700, textAlign: 'right', fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 2, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          FALTAM <Gold>{brl(Math.round(left / 10) * 10)}</Gold>
        </div>
      </div>
      {f >= T.s3.coin && f < T.s3.coinLand + 4 ? (
        <Icon x={interpolate(fly, [0, 1], [540, 820])} y={interpolate(fly, [0, 1], [880, 640]) - Math.sin(fly * Math.PI) * 120} gold scale={1 - fly * 0.3}>
          <circle r={40} fill="#050505" stroke={GOLD} strokeWidth={3} />
          <text y={9} textAnchor="middle" fill={GOLD} fontFamily={FONT} fontWeight={900} fontSize={22}>R$ 300</text>
        </Icon>
      ) : null}
      <div style={{ position: 'absolute', left: 540 - 130, top: 770, width: 260, opacity: month, transform: `scale(${0.7 + month * 0.3})`, border: '3px solid #fff', borderRadius: 30, padding: '8px 0', textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 24, letterSpacing: 4, color: '#fff', background: 'rgba(5,5,5,0.9)' }}>
        1 MÊS DEPOIS
      </div>
      <Person x={540} glow={0.35 - tired * 0.6} label="VOCÊ" squash={tired} />
      <Impact at={T.s3.bold} y={1400} size={52}>
        SEM VITÓRIA, A MAIORIA DESISTE.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 4 — A RESPOSTA =====================
export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const lbl = useSpring(T.s4.answerLabel);
  const g = interpolate(f, [T.s4.glow, T.s4.glow + 10], [0, 1], { ...clamp, easing: cubic });
  const pulse = f > T.s4.glow ? 1 + 0.05 * Math.sin((f - T.s4.glow) * 0.3) : 1;
  return (
    <SceneFrame start={T.scenes.s4[0]} duration={dur('s4')} transition="glitch">
      <div style={{ position: 'absolute', left: 120, width: 840, top: 330, opacity: lbl * 0.85, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 28, letterSpacing: 8, color: '#fff' }}>A RESPOSTA:</div>
      <Impact at={T.s4.answer} y={470} size={110}>
        A MENOR.
      </Impact>
      {DEBTS.map((d, i) => (
        <DebtCard key={i} x={ROW_X[i]} y={690} d={d} op={i === 0 ? 1 : 1 - g * 0.75} s={i === 0 ? (1 + g * 0.18) * pulse : 1} glow={i === 0 ? g : 0} />
      ))}
      <Person x={540} glow={0.4 + g * 0.3} label="VOCÊ" />
    </SceneFrame>
  );
};

// ===================== CENA 5 — A PRIMEIRA VITÓRIA =====================
export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const card = useSpring(T.s5.card, { damping: 14 });
  const fill = interpolate(f, [T.s5.pourStart, T.s5.pourEnd], [0, 1], { ...clamp, easing: inOut });
  const paid = spring({ frame: f - T.s5.stamp, fps: 30, config: { damping: 10, stiffness: 180 } });
  const away = interpolate(f, [T.s5.brain - 8, T.s5.brain + 4], [0, 1], { ...clamp, easing: cubic });
  const brain = useSpring(T.s5.brain, { damping: 11 });
  const pulse = f > T.s5.brain ? 1 + 0.06 * Math.abs(Math.sin((f - T.s5.brain) * 0.25)) : 1;
  return (
    <SceneFrame start={T.scenes.s5[0]} duration={dur('s5')}>
      <Title at={T.s5.text} size={50}>EM 1 MÊS, UMA DÍVIDA A MENOS.</Title>
      <DebtCard x={540} y={720 - away * 60} d={DEBTS[0]} w={300} h={200} s={(0.7 + card * 0.3) * (1 - away * 0.4)} op={card * (1 - away)} fill={fill} paid={f >= T.s5.stamp ? paid : 0} />
      {/* moedas caindo dentro do cartão */}
      {new Array(8).fill(0).map((_, i) => {
        const st = T.s5.pourStart + i * 5;
        const k = interpolate(f, [st, st + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
        if (k <= 0 || k >= 1) return null;
        return (
          <Icon key={i} x={480 + (i % 4) * 40} y={interpolate(k, [0, 1], [480, 740])} gold scale={0.5}>
            <circle r={22} fill="#050505" stroke={GOLD} strokeWidth={3} />
          </Icon>
        );
      })}
      <div style={{ position: 'absolute', inset: 0, opacity: brain }}>
        <Icon x={540} y={700} scale={1.1 * pulse}>
          <Brain />
          {new Array(10).fill(0).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const ph = ((f + i * 3) % 18) / 18;
            const r0 = 104 + ph * 26;
            return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0 * 0.85} x2={Math.cos(a) * (r0 + 20)} y2={Math.sin(a) * (r0 + 20) * 0.85} stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={1 - ph * 0.7} />;
          })}
        </Icon>
        <div style={{ position: 'absolute', left: 120, width: 840, top: 850, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 34, letterSpacing: 4, color: '#fff', textShadow: '0 0 16px rgba(255,255,255,0.6)', transform: `scale(${brain})` }}>+1 VITÓRIA</div>
      </div>
      <Person x={540} glow={0.35 + brain * 0.7} label="VOCÊ" opacity={1 - brain * 0.85} />
      <Impact at={T.s5.bold} y={1400} size={48}>
        SEU CÉREBRO SENTE QUE ESTÁ GANHANDO.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 6 — A BOLA DE NEVE =====================
const TARGETS = [
  { x: 330, d: DEBTS[1], month: 'MÊS 2' },
  { x: 580, d: DEBTS[2], month: 'MÊS 5' },
  { x: 830, d: DEBTS[3], month: 'MÊS 7' },
];
const BALL_VAL = ['R$ 360', 'R$ 450', 'R$ 690', 'LIVRE!'];
export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const [h1, h2, h3] = T.s6.hits;
  const hitsDone = T.s6.hits.filter((h) => f >= h).length;
  const r = [48, 56, 66, 78][hitsDone];
  const rS = spring({ frame: f - (T.s6.hits[hitsDone - 1] ?? -100), fps: 30, config: { damping: 9, stiffness: 200 } });
  const rr = hitsDone > 0 ? [48, 56, 66, 78][hitsDone - 1] + (r - [48, 56, 66, 78][hitsDone - 1]) * rS : r;
  const x = interpolate(f, [T.s6.rollStart, h1, h2, h3, T.s6.rollEnd], [140, TARGETS[0].x - 90, TARGETS[1].x - 100, TARGETS[2].x - 110, 900], { ...clamp, easing: inOut });
  const rot = (x / rr) * (180 / Math.PI);
  const bob = Math.abs(Math.sin(x * 0.03)) * 4;
  return (
    <SceneFrame start={T.scenes.s6[0]} duration={dur('s6')}>
      <Title at={T.s6.text} size={44}>O QUE IA PRA DÍVIDA QUE ACABOU, VAI PRA PRÓXIMA.</Title>
      {/* rastro da bola */}
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <line x1={120} x2={x} y1={GROUND - 6} y2={GROUND - 6} stroke="#fff" strokeWidth={4} strokeOpacity={0.25} strokeDasharray="2 10" strokeLinecap="round" />
      </svg>
      {TARGETS.map((tg, i) => {
        const hit = T.s6.hits[i];
        const k = f >= hit ? interpolate(f, [hit, hit + 14], [0, 1], { ...clamp, easing: cubic }) : 0;
        return (
          <React.Fragment key={i}>
            <div style={{ position: 'absolute', left: tg.x - 60, top: GROUND - 190, width: 120, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 20, letterSpacing: 3, color: '#fff', opacity: 0.85 * (1 - k) }}>{tg.month}</div>
            <div style={{ opacity: 1 - k, transform: `translateY(${-k * 30}px) rotate(${k * (i % 2 ? 14 : -14)}deg)`, transformOrigin: `${tg.x}px ${GROUND}px`, position: 'absolute', inset: 0 }}>
              <DebtCard x={tg.x} y={GROUND - 66} d={tg.d} w={170} h={118} />
            </div>
            {k > 0 && k < 1 ? (
              <div style={{ position: 'absolute', left: tg.x - 70, top: GROUND - 120, width: 140, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: '#fff', opacity: Math.sin(k * Math.PI), transform: `translateY(${-k * 80}px)`, textShadow: '0 0 14px #fff' }}>✓</div>
            ) : null}
          </React.Fragment>
        );
      })}
      {f >= T.s6.rollStart - 6 ? (
        <>
          <Icon x={x} y={GROUND - rr - bob} rotate={rot}>
            <circle r={rr} fill="rgba(255,255,255,0.12)" stroke="#fff" strokeWidth={3} />
            <path d={`M ${-rr * 0.6} ${-rr * 0.2} C ${-rr * 0.2} ${-rr * 0.7} ${rr * 0.4} ${-rr * 0.5} ${rr * 0.5} 0 M ${-rr * 0.3} ${rr * 0.5} C 0 ${rr * 0.2} ${rr * 0.3} ${rr * 0.4} ${rr * 0.2} ${rr * 0.7}`} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
          </Icon>
          <div style={{ position: 'absolute', left: x - 110, top: GROUND - rr * 2 - 70 - bob, width: 220, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 34, letterSpacing: 2, color: hitsDone === 3 ? '#fff' : GOLD, textShadow: '0 0 16px rgba(217,173,69,0.6)', transform: `scale(${1 + (rS < 1 && hitsDone > 0 ? (1 - rS) * 0.3 : 0)})` }}>
            {BALL_VAL[hitsDone]}
          </div>
        </>
      ) : null}
      <Impact at={T.s6.bold} y={1400} size={58}>
        4 DÍVIDAS. 7 MESES.
      </Impact>
      <Small at={T.s6.note} y={1480} size={19}>
        EXEMPLO SEM JUROS · <Gold>R$ 970</Gold> POR MÊS PARA AS DÍVIDAS
      </Small>
    </SceneFrame>
  );
};

// ===================== CENA 7 — ISSO TEM NOME =====================
export const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [T.s7.boxStart, T.s7.boxEnd], [0, 1], { ...clamp, easing: cubic });
  const rev = useSpring(T.s7.reveal, { damping: 11, stiffness: 170 });
  const bx = 150, by = 600, bw = 780, bh = 230, per = 2 * (bw + bh);
  return (
    <SceneFrame start={T.scenes.s7[0]} duration={dur('s7')} transition="glitch">
      <Title at={T.s7.text} size={74} serif>Isso tem nome.</Title>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
        <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} />
      </svg>
      <div style={{ position: 'absolute', left: bx, width: bw, top: by + bh / 2, transform: `translateY(-50%) scale(${interpolate(rev, [0, 1], [1.3, 1])})`, opacity: interpolate(rev, [0, 0.3], [0, 1], clamp), textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 66, lineHeight: 1.1, letterSpacing: 3, color: '#fff', textShadow: '0 0 24px rgba(255,255,255,0.5)' }}>
        MÉTODO
        <br />
        BOLA DE NEVE
      </div>
      <Small at={T.s7.study} y={900} size={24}>
        ESTUDO DA KELLOGG (NORTHWESTERN) COM 6.000 PESSOAS:
        <br />
        QUEM QUITAVA AS MENORES PRIMEIRO
        <br />
        TINHA MAIS CHANCE DE ZERAR TUDO.
      </Small>
    </SceneFrame>
  );
};

// ===================== CENA 8 — A EXCEÇÃO =====================
export const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const c = useSpring(T.s8.card, { damping: 12, stiffness: 160 });
  const blink = f > T.s8.card + 10 ? 0.6 + 0.4 * Math.abs(Math.sin((f - T.s8.card) * 0.2)) : 1;
  return (
    <SceneFrame start={T.scenes.s8[0]} duration={dur('s8')}>
      <Title at={T.s8.text} size={56} bold>SÓ UMA EXCEÇÃO:</Title>
      <div style={{ position: 'absolute', left: 190, top: 590, width: 700, height: 330, boxSizing: 'border-box', opacity: c, transform: `scale(${0.8 + c * 0.2})`, border: '3px solid #fff', borderRadius: 22, background: 'rgba(5,5,5,0.9)', textAlign: 'center', fontFamily: FONT, filter: GLOW, paddingTop: 40 }}>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 3, color: '#fff' }}>ROTATIVO DO CARTÃO</div>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 3, color: 'rgba(255,255,255,0.8)', marginTop: 10 }}>E CHEQUE ESPECIAL</div>
        <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: 2, color: GOLD, marginTop: 24, opacity: blink, textShadow: '0 0 24px rgba(217,173,69,0.6)' }}>+400% AO ANO</div>
      </div>
      <Impact at={T.s8.bold} y={1400} size={50}>
        ESSES VOCÊ NEGOCIA ANTES DE TUDO.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 9 — A ESCADA =====================
export const Scene9: React.FC = () => {
  const f = useCurrentFrame();
  const STEP_W = 170, STEP_H = 70, X0 = 180;
  const done = T.s9.steps.filter((s) => f >= s).length;
  const last = T.s9.steps[done - 1];
  const hop = last !== undefined ? spring({ frame: f - last, fps: 30, config: { damping: 12, stiffness: 160 } }) : 0;
  const prevX = done > 1 ? X0 + (done - 2) * STEP_W + STEP_W / 2 : 110;
  const prevY = done > 1 ? GROUND - (done - 1) * STEP_H : GROUND;
  const curX = done > 0 ? X0 + (done - 1) * STEP_W + STEP_W / 2 : 110;
  const curY = done > 0 ? GROUND - done * STEP_H : GROUND;
  const px = interpolate(hop, [0, 1], [prevX, curX]);
  const py = interpolate(hop, [0, 1], [prevY, curY]) - Math.sin(Math.min(1, hop) * Math.PI) * 40;
  const names = ['LOJA', 'CELULAR', 'CARTÃO', 'EMPRÉSTIMO'];
  return (
    <SceneFrame start={T.scenes.s9[0]} duration={dur('s9')}>
      <Title at={T.s9.text} size={44}>QUEM SAI DAS DÍVIDAS NÃO É QUEM GANHA MAIS.</Title>
      {names.map((n, i) => {
        const on = i < done;
        const top = GROUND - (i + 1) * STEP_H;
        return (
          <div key={n} style={{ position: 'absolute', left: X0 + i * STEP_W, top, width: STEP_W, height: GROUND - top, boxSizing: 'border-box', border: `3px solid ${on ? '#fff' : 'rgba(255,255,255,0.35)'}`, borderBottom: 'none', background: on ? 'rgba(255,255,255,0.1)' : 'transparent', boxShadow: on ? '0 0 18px rgba(255,255,255,0.35)' : 'none', fontFamily: FONT, fontWeight: 800, fontSize: 17, letterSpacing: 2, color: on ? '#fff' : 'rgba(255,255,255,0.4)', textAlign: 'center', paddingTop: 20 }}>
            {n} {on ? '✓' : ''}
          </div>
        );
      })}
      <Person x={px} ground={py} glow={0.4 + done * 0.15} glowColor={done === 4 ? GOLD : undefined} scale={0.62} label={done === 4 ? undefined : undefined} />
      <Impact at={T.s9.bold} y={1400} size={48}>
        É QUEM COMEÇA PELA VITÓRIA MAIS PERTO.
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
  const PINX = 540, PINY = 560, NW = 820, NH = 380;
  return (
    <SceneFrame start={T.scenes.s10[0]} duration={dur('s10')}>
      <Title at={T.s10.text} size={58} bold>GUARDA ESSA REGRA.</Title>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - fall) * -1100}px) rotate(${sw}deg)`, transformOrigin: `${PINX}px ${PINY}px` }}>
        <Icon x={PINX} y={PINY}>
          <Note w={NW} h={NH} />
        </Icon>
        <div style={{ position: 'absolute', left: PINX - NW / 2 + 50, width: NW - 100, top: PINY + 84, fontFamily: FONT, fontWeight: 700, fontSize: 42, lineHeight: 1.45, letterSpacing: 3, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.3)', whiteSpace: 'pre' }}>
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
    border: `3px solid ${gold ? GOLD : '#fff'}`, borderRadius: 60, padding: '18px 24px', fontFamily: FONT, fontWeight: 800, fontSize: 24, letterSpacing: 3, whiteSpace: 'nowrap',
    color: gold ? '#f3d98f' : '#fff', background: gold ? `rgba(217,173,69,${0.1 + pulse * 0.12})` : 'rgba(255,255,255,0.03)',
    boxShadow: gold ? `0 0 ${14 + pulse * 26}px rgba(217,173,69,${0.35 + pulse * 0.35})` : '0 0 10px rgba(255,255,255,0.25)',
  });
  return (
    <SceneFrame start={T.scenes.s11[0]} duration={dur('s11')}>
      <Title at={T.s11.text} size={140} bold>E VOCÊ?</Title>
      <div style={{ position: 'absolute', left: 120, width: 840, top: 690, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <div style={pill(p1, false)}>ATACA A MAIOR</div>
        <div style={{ opacity: ou, fontFamily: FONT, fontWeight: 600, fontSize: 24, letterSpacing: 4, color: 'rgba(255,255,255,0.7)' }}>OU</div>
        <div style={pill(p2, true)}>QUITA A MENOR</div>
      </div>
      <Person x={540} glow={0.45} label="VOCÊ" />
    </SceneFrame>
  );
};

