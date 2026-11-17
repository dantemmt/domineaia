import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, spring, random } from 'remotion';
import T from './timeline.json';
import {
  W, H, GROUND, TEXT_Y, GOLD, BLUE, FONT, GLOW, GOLD_GLOW,
  clamp, ease, useSpring, brl, Title, Person, Counter, Glitch, SceneFrame,
} from './ui';
import { Icon, Lamp, Calendar, Phone, Brain, Cheers, ShoeBox, Moto, Cart, House, Vault, CoinStack, Coin, Note } from './icons';

const dur = (k: keyof typeof T.scenes) => T.scenes[k][1] - T.scenes[k][0];
const PERSON_CY = GROUND - 150; // centro aproximado do corpo

// --------- Feixe de luz da lâmpada ---------
const Beam: React.FC<{ x: number; top: number; intensity: number }> = ({ x, top, intensity }) => (
  <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, opacity: intensity }}>
    <defs>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.5} />
        <stop offset="1" stopColor="#fff" stopOpacity={0.02} />
      </linearGradient>
      <radialGradient id="pool" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
        <stop offset="1" stopColor="#fff" stopOpacity={0} />
      </radialGradient>
    </defs>
    <path d={`M ${x - 40} ${top} L ${x + 40} ${top} L ${x + 230} ${GROUND} L ${x - 230} ${GROUND} Z`} fill="url(#beam)" style={{ filter: 'blur(14px)' }} />
    <ellipse cx={x} cy={GROUND} rx={260} ry={30} fill="url(#pool)" />
  </svg>
);

const BulbGlow: React.FC<{ x: number; y: number; on: number }> = ({ x, y, on }) => (
  <div
    style={{
      position: 'absolute',
      left: x - 220,
      top: y - 220,
      width: 440,
      height: 440,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0) 70%)',
      opacity: on,
    }}
  />
);

const LAMP_X = 540;
const LAMP_Y = 290;

// ===================== CENA 1 — GANCHO =====================
export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const on = T.s1.lampOn.some(([a, b]) => f >= a && f < b) ? 1 : 0;
  const hook = useSpring(T.s1.hookText, { damping: 12, stiffness: 160 });
  return (
    <SceneFrame start={T.scenes.s1[0]} duration={dur('s1')}>
      <Beam x={LAMP_X} top={LAMP_Y + 40} intensity={on * 0.7} />
      <BulbGlow x={LAMP_X} y={LAMP_Y + 10} on={on} />
      <Icon x={LAMP_X} y={LAMP_Y}>
        <Lamp on={on} cordTop={-LAMP_Y - 20} />
      </Icon>
      <Person x={540} glow={0.35 + on * 0.35} label="VOCÊ" />
      <Icon x={860} y={GROUND}>
        <Calendar day={5} />
      </Icon>
      <div
        style={{
          position: 'absolute',
          left: 50,
          width: 980,
          top: 1440,
          transform: `translateY(-50%) scale(${interpolate(hook, [0, 1], [1.25, 1])})`,
          opacity: interpolate(hook, [0, 0.3], [0, 1], clamp),
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 82,
          lineHeight: 1.1,
          letterSpacing: 3,
          color: '#fff',
          textShadow: '0 0 22px rgba(255,255,255,0.45)',
        }}
      >
        NUNCA COMEMORE O DIA DO PAGAMENTO
      </div>
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
        <Title at={T.s2.text} size={60} bold>
          EU SEI. PARECE EXAGERO.
        </Title>
      </Glitch>
      <Person x={540} glow={0.35} label="VOCÊ" />
    </SceneFrame>
  );
};

// ===================== CENA 3 — O SALÁRIO CAI =====================
export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phone = useSpring(T.s3.phone, { damping: 14 });
  const notif = useSpring(T.s3.notif, { damping: 16, stiffness: 140 });
  const counterIn = useSpring(T.s3.counterStart - 6);
  const prog = interpolate(f, [T.s3.counterStart, T.s3.counterEnd], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2.2) });
  const value = prog * 2800;
  const glow = interpolate(f, [T.s3.counterStart, T.s3.shimmer + 10], [0.35, 1.45], clamp);
  const shimmer = spring({ frame: f - T.s3.shimmer, fps, config: { damping: 10 } });
  const PX = 800, PY = 900;
  return (
    <SceneFrame start={T.scenes.s3[0]} duration={dur('s3')}>
      <Title at={T.s3.text} size={58}>DIA 5. O SALÁRIO CAI.</Title>
      <Counter value={value} x={400} size={108} y={690} opacity={counterIn} scale={1 + (f >= T.s3.shimmer ? 0.06 * (1 - shimmer) : 0)} />
      {/* brilhos do cintilante */}
      {f >= T.s3.shimmer
        ? new Array(14).fill(0).map((_, i) => {
            const life = (f - T.s3.shimmer - i * 1.2) / 24;
            if (life < 0 || life > 1) return null;
            const ang = random(`sh${i}`) * Math.PI * 2;
            const r = 160 + life * 140;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 540 + Math.cos(ang) * r * 1.6 - 4,
                  top: 700 + Math.sin(ang) * r * 0.5 - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: GOLD,
                  boxShadow: `0 0 12px ${GOLD}`,
                  opacity: 1 - life,
                }}
              />
            );
          })
        : null}
      <Person x={400} glow={glow} label="VOCÊ" />
      <div style={{ opacity: phone, transform: `translateY(${(1 - phone) * 60}px)`, position: 'absolute', inset: 0 }}>
        <Icon x={PX} y={PY}>
          <Phone />
        </Icon>
        <div style={{ position: 'absolute', left: PX - 105, top: PY - 175, width: 210, height: 360, overflow: 'hidden', borderRadius: 18 }}>
          <div
            style={{
              position: 'absolute',
              left: 6,
              width: 198,
              top: interpolate(notif, [0, 1], [-120, 12]),
              opacity: notif,
              border: '2px solid rgba(255,255,255,0.9)',
              borderRadius: 16,
              padding: '12px 8px',
              background: 'rgba(255,255,255,0.06)',
              textAlign: 'center',
              fontFamily: FONT,
              filter: GLOW,
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2, color: '#fff' }}>PIX RECEBIDO</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 1, color: GOLD, marginTop: 4 }}>+R$ 2.800</div>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

// batidas do coração (mesma lógica do script de áudio)
const heartBeats = (() => {
  const out: number[] = [];
  const a = T.s4.heartStart / 30, b = T.s4.heartEnd / 30;
  let t = a, gap = 0.9;
  while (t < b - 0.2) {
    out.push(t * 30);
    t += gap;
    gap = Math.max(0.38, gap * 0.9);
  }
  return out;
})();

// ===================== CENA 4 — DOPAMINA =====================
export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const brainIn = useSpring(T.s4.brain, { damping: 13 });
  // pulso: último batimento
  const last = heartBeats.filter((b) => b <= f).pop() ?? -100;
  const beat = Math.exp(-(f - last) / 4);
  const BX = 540, BY = 700;
  return (
    <SceneFrame start={T.scenes.s4[0]} duration={dur('s4')}>
      <Title at={T.s4.text} size={54}>SEU CÉREBRO LIBERA DOPAMINA.</Title>
      <Person x={540} glow={1.25 + beat * 0.3} label="VOCÊ" />
      <div style={{ position: 'absolute', inset: 0, opacity: brainIn }}>
        <Icon x={BX} y={BY} scale={(0.6 + brainIn * 0.55) * (1 + beat * 0.08)}>
          <Brain />
          {new Array(10).fill(0).map((_, i) => {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const phase = ((f + i * 3) % 18) / 18;
            const r0 = 104 + phase * 24 + beat * 10;
            const len = 18 + beat * 12;
            return (
              <line
                key={i}
                x1={Math.cos(a) * r0}
                y1={Math.sin(a) * r0 * 0.85}
                x2={Math.cos(a) * (r0 + len)}
                y2={Math.sin(a) * (r0 + len) * 0.85}
                stroke="#fff"
                strokeWidth={3}
                strokeLinecap="round"
                opacity={1 - phase * 0.7}
              />
            );
          })}
        </Icon>
      </div>
      <Title at={T.s4.text2} y={1420} size={66} bold>
        A SENSAÇÃO: AGORA EU POSSO.
      </Title>
    </SceneFrame>
  );
};

// ===================== CENA 5 — O DINHEIRO SAI =====================
const ICONS: Record<string, React.FC> = { cheers: Cheers, shoes: ShoeBox, moto: Moto, cart: Cart, house: House };

export const counterAtS5 = (f: number) => {
  let v = 2800;
  for (const s of T.s5.spends) {
    v -= s.value * interpolate(f, [s.f, s.f + 8], [0, 1], { ...clamp, easing: ease });
  }
  const left = 2800 - T.s5.spends.reduce((p, s) => p + s.value, 0); // 337
  v -= (left - 1) * interpolate(f, [T.s5.drainStart, T.s5.drainEnd], [0, 1], { ...clamp, easing: ease });
  return v;
};

const Flyer: React.FC<{ s: (typeof T.s5.spends)[number]; idx: number }> = ({ s, idx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < s.f) return null;
  const Ico = ICONS[s.icon];
  const isMoto = s.icon === 'moto';
  const p = spring({ frame: f - s.f, fps, config: { damping: 16, stiffness: 110 } });
  const sx = 540, sy = PERSON_CY - 40;
  let x: number, y: number, op: number, scale: number;
  if (isMoto) {
    // atravessa rápido para a direita e sai da tela
    const t = (f - s.f) / 34;
    if (t > 1) return null;
    const k = Math.min(1, t);
    const m = idx - 2; // 0..3
    x = sx + 60 + k * 760;
    y = GROUND - 56 + m * 0;
    op = interpolate(t, [0, 0.1, 0.8, 1], [0, 1, 1, 0]);
    scale = interpolate(t, [0, 0.25], [0.4, 0.95], clamp);
  } else {
    const order = ['cheers', 'shoes', 'cart', 'house'].indexOf(s.icon);
    const left = order % 2 === 0;
    const tx = left ? 215 : 865;
    const ty = 905;
    const life = { cheers: 62, shoes: 75, cart: 58, house: 999 }[s.icon as 'cheers'] ?? 60;
    const out = interpolate(f, [s.f + life, s.f + life + 10], [0, 1], clamp);
    if (out >= 1) return null;
    x = interpolate(p, [0, 1], [sx, tx]);
    y = interpolate(p, [0, 1], [sy, ty]) - Math.sin(p * Math.PI) * 140 - out * 60;
    op = Math.min(1, p * 3) * (1 - out);
    scale = (0.3 + p * 0.75) * (s.icon === 'house' ? 1.12 : 1);
  }
  return (
    <>
      <Icon x={x} y={y} scale={scale} opacity={op}>
        <Ico />
      </Icon>
      <div
        style={{
          position: 'absolute',
          left: x - 200,
          width: 400,
          top: y + 82 * scale,
          opacity: op,
          textAlign: 'center',
          fontFamily: FONT,
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 800, color: GOLD, letterSpacing: 2, textShadow: '0 0 16px rgba(217,173,69,0.5)' }}>{s.label}</div>
        {s.note ? <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: 3, marginTop: 4, opacity: 0.85 }}>{s.note}</div> : null}
      </div>
    </>
  );
};

export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const v = counterAtS5(f);
  const lastHit = T.s5.spends.filter((s) => s.f <= f).pop();
  const hit = lastHit ? Math.exp(-(f - lastHit.f) / 5) : 0;
  const glow = interpolate(v, [1, 2800], [0.15, 1.3]);
  return (
    <SceneFrame start={T.scenes.s5[0]} duration={dur('s5')} transition="glitch">
      <Title at={T.s5.text} size={60} bold>E AÍ COMEÇA.</Title>
      <Counter value={v} y={700} scale={1 - hit * 0.06} />
      <Person x={540} glow={glow} label="VOCÊ" />
      {T.s5.spends.map((s, i) => (
        <Flyer key={i} s={s} idx={i} />
      ))}
    </SceneFrame>
  );
};

// ===================== CENA 6 — DIA 20 =====================
const flipFrames = new Array(15).fill(0).map((_, k) => {
  const p = k / 14;
  return T.s6.flipStart + (T.s6.flipEnd - T.s6.flipStart) * (1 - Math.pow(1 - p, 1.6));
});

export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const done = flipFrames.filter((x) => x <= f).length;
  const lastFlip = flipFrames[done - 1];
  const flipP = lastFlip !== undefined ? (f - lastFlip) / 3 : 1;
  const day = 5 + done;
  const flick = T.s6.lampFlicker.some((a) => f >= a && f < a + 2);
  const on = f >= T.s6.lampOff ? 0 : flick ? 0 : 1;
  const offP = interpolate(f, [T.s6.lampOff, T.s6.lampOff + 18], [0, 1], { ...clamp, easing: ease });
  const glow = interpolate(offP, [0, 1], [0.4, 0.06]) * (flick ? 0.5 : 1);
  return (
    <SceneFrame start={T.scenes.s6[0]} duration={dur('s6')}>
      <Beam x={LAMP_X} top={LAMP_Y + 40} intensity={on ? 0.6 : interpolate(offP, [0, 1], [0.6, 0.22])} />
      <BulbGlow x={LAMP_X} y={LAMP_Y + 10} on={on * 0.8} />
      <Icon x={LAMP_X} y={LAMP_Y}>
        <Lamp on={on} cordTop={-LAMP_Y - 20} />
      </Icon>
      <Title at={T.s6.text} size={84} bold>DIA 20.</Title>
      <Counter value={1} y={700} size={110} opacity={0.9} />
      <Person x={540} glow={glow} label="VOCÊ" />
      <Icon x={860} y={GROUND}>
        <Calendar day={day} flip={flipP < 1 ? flipP : 0} />
      </Icon>
    </SceneFrame>
  );
};

// ===================== CENA 7 — ISSO TEM NOME =====================
export const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [T.s7.boxStart, T.s7.boxEnd], [0, 1], { ...clamp, easing: ease });
  const rev = useSpring(T.s7.reveal, { damping: 11, stiffness: 170 });
  const sub = useSpring(T.s7.sub);
  const bx = 110, by = 700, bw = 860, bh = 210;
  const per = 2 * (bw + bh);
  return (
    <SceneFrame start={T.scenes.s7[0]} duration={dur('s7')} transition="glitch">
      <Title at={T.s7.text} size={76} serif>Isso tem nome.</Title>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
        <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: bx,
          width: bw,
          top: by + bh / 2,
          transform: `translateY(-50%) scale(${interpolate(rev, [0, 1], [1.3, 1])})`,
          opacity: interpolate(rev, [0, 0.3], [0, 1], clamp),
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 76,
          letterSpacing: 3,
          color: '#fff',
          textShadow: '0 0 24px rgba(255,255,255,0.5)',
        }}
      >
        EUFORIA DO SALÁRIO
      </div>
      <div
        style={{
          position: 'absolute',
          left: 110,
          width: 860,
          top: 990,
          opacity: sub,
          transform: `translateY(${(1 - sub) * 16}px)`,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 32,
          lineHeight: 1.4,
          letterSpacing: 3,
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        DINHEIRO QUE ENTRA COM PRESSA,
        <br />
        SAI COM PRESSA.
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 8 — O OUTRO LADO =====================
export const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const other = useSpring(T.s8.other, { damping: 15 });
  const vault = useSpring(T.s8.vault, { damping: 15 });
  const notif = useSpring(T.s8.notif, { damping: 13, stiffness: 150 });
  const fly = interpolate(f, [T.s8.coinsStart, T.s8.coinsEnd], [0, 1], { ...clamp, easing: ease });
  const doorOpen =
    f < T.s8.coinsEnd ? interpolate(f, [T.s8.vault + 10, T.s8.vault + 30], [0, 1], { ...clamp, easing: ease }) : interpolate(f, [T.s8.coinsEnd, T.s8.vaultClose], [1, 0], { ...clamp, easing: ease });
  const dial = interpolate(f, [T.s8.vaultClose, T.s8.vaultClose + 14], [0, 180], { ...clamp, easing: ease });
  const notifOut = interpolate(f, [T.s8.coinsStart, T.s8.coinsStart + 12], [1, 0.25], clamp);
  const OX = 560, VX = 860;
  const NX = OX, NY = 720;
  // trajetória das moedas: da notificação ao cofre
  const cx = interpolate(fly, [0, 1], [NX, VX]);
  const cy = interpolate(fly, [0, 1], [NY + 50, GROUND - 105]) - Math.sin(fly * Math.PI) * 150;
  const cScale = interpolate(fly, [0, 0.85, 1], [1, 0.8, 0.2]);
  const cOp = f < T.s8.coinsStart - 4 ? 0 : interpolate(fly, [0, 0.9, 1], [1, 1, 0]);
  return (
    <SceneFrame start={T.scenes.s8[0]} duration={dur('s8')}>
      <Title at={T.s8.text} size={54}>QUEM ACUMULA FAZ O CONTRÁRIO.</Title>
      <Person x={190} glow={0.1} label="VOCÊ" opacity={0.35} scale={0.85} />
      <div style={{ position: 'absolute', inset: 0, opacity: other, transform: `translateY(${(1 - other) * 30}px)` }}>
        <Person x={OX} glow={0.55} glowColor={GOLD} />
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: vault, transform: `scale(${0.9 + vault * 0.1})`, transformOrigin: `${VX}px ${GROUND}px` }}>
        <Icon x={VX} y={GROUND} gold>
          <Vault doorOpen={doorOpen} dial={dial} />
        </Icon>
      </div>
      {/* notificação */}
      <div
        style={{
          position: 'absolute',
          left: NX - 150,
          width: 300,
          top: NY - 60,
          opacity: notif * notifOut,
          transform: `scale(${0.7 + notif * 0.3})`,
          border: '2px solid rgba(255,255,255,0.9)',
          borderRadius: 18,
          padding: '12px 10px',
          background: 'rgba(5,5,5,0.7)',
          textAlign: 'center',
          fontFamily: FONT,
          filter: GLOW,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: '#fff' }}>PIX RECEBIDO</div>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 2, color: GOLD, marginTop: 4 }}>+R$ 2.800</div>
      </div>
      {/* bloco de moedas com etiqueta PRIMEIRO */}
      {cOp > 0 ? (
        <>
          <Icon x={cx} y={cy + 40} scale={cScale} gold opacity={cOp}>
            <CoinStack count={5} x={-34} />
            <CoinStack count={4} x={34} />
          </Icon>
          <div
            style={{
              position: 'absolute',
              left: cx - 90,
              width: 180,
              top: cy - 70 * cScale - 46,
              opacity: cOp,
              transform: `scale(${Math.max(0.4, cScale)})`,
              textAlign: 'center',
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: 4,
              color: '#050505',
              background: '#fff',
              borderRadius: 30,
              padding: '6px 0',
            }}
          >
            PRIMEIRO
          </div>
        </>
      ) : null}
      <Title at={T.s8.bold} y={1420} size={64} bold>
        ELE SE PAGA PRIMEIRO.
      </Title>
    </SceneFrame>
  );
};

// ===================== CENA 9 — COMPARAÇÃO =====================
export const Scene9: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const split = interpolate(f, [T.s9.split, T.s9.split + 14], [0, 1], { ...clamp, easing: ease });
  const L = useSpring(T.s9.left, { damping: 12, stiffness: 160 });
  const R = useSpring(T.s9.right, { damping: 12, stiffness: 160 });
  const grow = interpolate(f, [T.s9.growStart, T.s9.growEnd], [0, 7], clamp);
  const sideText = (txt: React.ReactNode, x: number, s: number) => (
    <div
      style={{
        position: 'absolute',
        left: x - 230,
        width: 460,
        top: 650,
        opacity: s,
        transform: `scale(${0.8 + s * 0.2})`,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 34,
        lineHeight: 1.35,
        letterSpacing: 3,
        color: '#fff',
        textShadow: '0 0 12px rgba(255,255,255,0.3)',
      }}
    >
      {txt}
    </div>
  );
  return (
    <SceneFrame start={T.scenes.s9[0]} duration={dur('s9')} transition="glitch">
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
        <line x1={540} x2={540} y1={560} y2={560 + 980 * split} stroke="#fff" strokeOpacity={0.6} strokeWidth={3} strokeDasharray="16 14" />
      </svg>
      {sideText(<>GASTA →<br />GUARDA O QUE<br />SOBRA</>, 270, L)}
      {sideText(<>GUARDA →<br />GASTA O QUE<br />SOBRA</>, 810, R)}
      <div style={{ position: 'absolute', inset: 0, opacity: L }}>
        <Person x={270} glow={0.12} label="VOCÊ" scale={0.82} />
        <div style={{ position: 'absolute', left: 70, width: 400, top: 1250, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 72, color: GOLD, letterSpacing: 2, textShadow: '0 0 16px rgba(217,173,69,0.5)' }}>
          {brl(1)}
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: R }}>
        <Person x={810} glow={0.6} glowColor={GOLD} scale={0.82} />
        <Icon x={760} y={1450} scale={0.62} gold>
          <Vault />
        </Icon>
        <Icon x={905} y={1450} gold>
          <CoinStack count={Math.floor(grow) + 1} />
        </Icon>
      </div>
      <Title at={T.s9.final} size={58} bold y={TEXT_Y}>
        MESMO SALÁRIO.
        <br />
        OUTRO RESULTADO.
      </Title>
    </SceneFrame>
  );
};

// ===================== CENA 10 — GUARDA ESSA REGRA =====================
export const Scene10: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fall = spring({ frame: f - T.s10.noteFall, fps, config: { damping: 14, stiffness: 90, mass: 1 } });
  const tSince = Math.max(0, f - T.s10.noteFall);
  const swing = 7 * Math.exp(-tSince / 22) * Math.sin(tSince * 0.28) + 0.8 * Math.sin(f * 0.07);
  const txt = T.s10.typeText;
  let shown = 0;
  for (let i = 0; i < txt.length; i++) if (T.s10.typeStart + Math.round(i * T.s10.framesPerChar) <= f) shown = i + 1;
  const lines = txt.slice(0, shown).split('\n');
  const typing = shown < txt.length;
  const cursorOn = typing || Math.floor(f / 8) % 2 === 0;
  const PINX = 540, PINY = 560, NW = 880, NH = 460;
  return (
    <SceneFrame start={T.scenes.s10[0]} duration={dur('s10')}>
      <Title at={T.s10.text} size={58} bold>GUARDA ESSA REGRA.</Title>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${(1 - fall) * -1100}px) rotate(${swing}deg)`,
          transformOrigin: `${PINX}px ${PINY}px`,
        }}
      >
        <Icon x={PINX} y={PINY}>
          <Note w={NW} h={NH} />
        </Icon>
        <div
          style={{
            position: 'absolute',
            left: PINX - NW / 2 + 60,
            width: NW - 120,
            top: PINY + 80,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 46,
            lineHeight: 1.38,
            letterSpacing: 3,
            color: '#fff',
            textShadow: '0 0 12px rgba(255,255,255,0.3)',
            whiteSpace: 'pre',
          }}
        >
          {lines.map((l, i) => (
            <div key={i} style={{ marginTop: i === 2 ? 34 : 0, minHeight: 63 }}>
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
  const pill = (txt: string, s: number, gold: boolean): React.CSSProperties => ({
    opacity: s,
    transform: `scale(${0.6 + s * 0.4 + (gold ? pulse * 0.04 : 0)})`,
    border: `3px solid ${gold ? GOLD : '#fff'}`,
    borderRadius: 60,
    padding: '20px 26px',
    fontFamily: FONT,
    fontWeight: 800,
    fontSize: 26,
    letterSpacing: 3,
    whiteSpace: 'nowrap',
    color: gold ? '#f3d98f' : '#fff',
    background: gold ? `rgba(217,173,69,${0.1 + pulse * 0.12})` : 'rgba(255,255,255,0.03)',
    boxShadow: gold ? `0 0 ${14 + pulse * 26}px rgba(217,173,69,${0.35 + pulse * 0.35})` : '0 0 10px rgba(255,255,255,0.25)',
  });
  return (
    <SceneFrame start={T.scenes.s11[0]} duration={dur('s11')}>
      <Title at={T.s11.text} size={140} bold>E VOCÊ?</Title>
      <div style={{ position: 'absolute', left: 0, width: W, top: 690, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22 }}>
        <div style={pill('a', p1, false)}>COMEMORA O SALÁRIO</div>
        <div style={{ opacity: ou, fontFamily: FONT, fontWeight: 600, fontSize: 26, letterSpacing: 4, color: 'rgba(255,255,255,0.7)' }}>OU</div>
        <div style={pill('b', p2, true)}>SE PAGA PRIMEIRO</div>
      </div>
      <Person x={540} glow={0.45} label="VOCÊ" />
    </SceneFrame>
  );
};
