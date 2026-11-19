import React from 'react';
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import T from './timeline.json';
import { W, H, GROUND, GOLD, BLUE, FONT, GLOW, GOLD_GLOW, clamp, useSpring, Title, Person, Glitch, SceneFrame } from './ui';
import { Icon, Note, Brain } from './icons';

const dur = (k: keyof typeof T.scenes) => T.scenes[k][1] - T.scenes[k][0];
const cubic = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);
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

// ---------- Nota de dinheiro (suja ou limpa) ----------
const Bill: React.FC<{ clean: boolean }> = ({ clean }) => (
  <g>
    <rect x={-44} y={-24} width={88} height={48} rx={5} fill="rgba(5,5,5,0.9)" stroke={clean ? GOLD : 'rgba(255,255,255,0.55)'} strokeWidth={3} />
    <circle r={12} fill="none" stroke={clean ? GOLD : 'rgba(255,255,255,0.55)'} strokeWidth={2.5} />
    {clean ? null : (
      <>
        <circle cx={-24} cy={-8} r={7} fill="rgba(255,255,255,0.35)" />
        <circle cx={22} cy={10} r={9} fill="rgba(255,255,255,0.28)" />
        <circle cx={30} cy={-12} r={4} fill="rgba(255,255,255,0.3)" />
      </>
    )}
  </g>
);

// ---------- Rede de contas (mesma geometria nas cenas 3 e 6) ----------
const CX = 540, CY = 800;
type Node = { x: number; y: number; level: number; parent: number };
const NODES: Node[] = (() => {
  const out: Node[] = [{ x: CX, y: CY, level: 0, parent: -1 }];
  const counts = [5, 15, 30];
  const radii = [170, 290, 400];
  let prevStart = 0, prevCount = 1;
  counts.forEach((n, li) => {
    const start = out.length;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + li * 0.35 + (random(`na${li}${i}`) - 0.5) * 0.25;
      const r = radii[li] * (0.92 + random(`nr${li}${i}`) * 0.16);
      const parent = prevStart + Math.floor((i / n) * prevCount);
      out.push({ x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r * 0.74, level: li + 1, parent });
    }
    prevStart = start;
    prevCount = n;
  });
  return out;
})();
const Network: React.FC<{ f: number; splits: number[]; youLabel?: boolean; dim?: number }> = ({ f, splits, youLabel = true, dim = 1 }) => (
  <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
    {NODES.map((n, i) => {
      if (n.level === 0) return null;
      const st = splits[n.level - 1] + (i % 7);
      const k = interpolate(f, [st, st + 12], [0, 1], { ...clamp, easing: cubic });
      if (k <= 0) return null;
      const p = NODES[n.parent];
      const x2 = p.x + (n.x - p.x) * k, y2 = p.y + (n.y - p.y) * k;
      // pulso dourado viajando pela linha (o dinheiro passando)
      const pk = interpolate(f, [st, st + 12], [0, 1], clamp);
      const travel = (f - st) % 40;
      const pk2 = travel / 40;
      return (
        <g key={i} opacity={dim}>
          <line x1={p.x} y1={p.y} x2={x2} y2={y2} stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
          {pk < 1 ? <circle cx={p.x + (n.x - p.x) * pk} cy={p.y + (n.y - p.y) * pk} r={6} fill={GOLD} style={{ filter: GOLD_GLOW }} /> : null}
          {pk >= 1 ? <circle cx={p.x + (n.x - p.x) * pk2} cy={p.y + (n.y - p.y) * pk2} r={3} fill={GOLD} opacity={0.6} /> : null}
          <circle cx={x2} cy={y2} r={[0, 15, 10, 7][n.level] * k} fill="#050505" stroke="#fff" strokeWidth={2.5} style={{ filter: GLOW }} />
        </g>
      );
    })}
    <circle cx={CX} cy={CY} r={34} fill="#050505" stroke={BLUE} strokeWidth={4} style={{ filter: `drop-shadow(0 0 12px ${BLUE})` }} />
    {youLabel ? (
      <text x={CX} y={CY + 7} textAnchor="middle" fill="#fff" fontFamily={FONT} fontWeight={800} fontSize={17} letterSpacing={2}>VOCÊ</text>
    ) : null}
  </svg>
);

// ===================== CENA 1 — A PERGUNTA =====================
export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const ph = useSpring(T.s1.phone, { damping: 14 });
  const nt = useSpring(T.s1.notif, { damping: 13, stiffness: 150 });
  const PX = 540, PY = 760, PW = 300, PH = 380;
  return (
    <SceneFrame start={T.scenes.s1[0]} duration={dur('s1')}>
      <Impact at={T.s1.question} y={380} size={48}>
        TE OFERECERAM <Gold>R$ 500</Gold> SÓ PRA PASSAR UM PIX PELA SUA CONTA. VOCÊ ACEITARIA?
      </Impact>
      <div style={{ position: 'absolute', inset: 0, opacity: ph, transform: `translateY(${(1 - ph) * 50}px)` }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
          <rect x={PX - PW / 2} y={PY - PH / 2} width={PW} height={PH} rx={36} fill="rgba(5,5,5,0.92)" stroke="#fff" strokeWidth={3} />
          <line x1={PX - 26} x2={PX + 26} y1={PY - PH / 2 + 22} y2={PY - PH / 2 + 22} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', left: PX - PW / 2 + 14, top: PY - PH / 2 + 46, width: PW - 28, height: PH - 70, overflow: 'hidden', borderRadius: 18 }}>
          <div style={{ position: 'absolute', left: 4, right: 4, top: interpolate(nt, [0, 1], [-160, 10]), opacity: nt, border: '2px solid #fff', borderRadius: 14, padding: '12px 10px', fontFamily: FONT, textAlign: 'left', background: 'rgba(255,255,255,0.06)', filter: GLOW }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.7)' }}>MENSAGEM · AGORA</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1, color: '#fff', marginTop: 6, lineHeight: 1.35 }}>
              ME EMPRESTA SUA CONTA? TE DOU <Gold>R$ 500</Gold>
            </div>
          </div>
        </div>
      </div>
      <Person x={830} glow={0.4} label="VOCÊ" scale={0.75} />
    </SceneFrame>
  );
};

// ===================== CENA 2 — DINHEIRO FÁCIL =====================
export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const g = f >= T.s2.glitch && f < T.s2.glitch + 6;
  return (
    <SceneFrame start={T.scenes.s2[0]} duration={dur('s2')} transition="glitch">
      <Glitch active={g} seed="s2" strength={40}>
        <Title at={T.s2.text} size={60} bold>PARECE DINHEIRO FÁCIL.</Title>
      </Glitch>
      {new Array(22).fill(0).map((_, i) => {
        const st = T.s2.rain + random(`r${i}`) * 50;
        if (f < st) return null;
        const t = f - st;
        const x = 150 + random(`rx${i}`) * 780;
        const y = 480 + t * (7 + random(`rv${i}`) * 5);
        if (y > GROUND - 10) return null;
        return (
          <Icon key={i} x={x + Math.sin(t * 0.2 + i) * 14} y={y} rotate={t * (4 + i % 5)} scale={0.6} gold>
            <circle r={20} fill="#050505" stroke={GOLD} strokeWidth={3} />
            <text y={7} textAnchor="middle" fill={GOLD} fontFamily={FONT} fontWeight={900} fontSize={18}>$</text>
          </Icon>
        );
      })}
      <Person x={540} glow={0.9 + 0.3 * Math.sin(f * 0.3)} label="VOCÊ" />
    </SceneFrame>
  );
};

// ===================== CENA 3 — O DINHEIRO SE ESPALHA =====================
export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const blk = useSpring(T.s3.block, { damping: 12 });
  const into = interpolate(f, [T.s3.block, T.s3.splits[0]], [0, 1], { ...clamp, easing: inOut });
  return (
    <SceneFrame start={T.scenes.s3[0]} duration={dur('s3')} ground={false}>
      <Title at={T.s3.text} size={46}>O DINHEIRO ENTRA NA SUA CONTA... E SAI EM SEGUNDOS.</Title>
      <Network f={f} splits={T.s3.splits} />
      {f < T.s3.splits[0] + 4 ? (
        <div style={{ position: 'absolute', left: CX - 110, top: interpolate(into, [0, 1], [540, CY - 30]), width: 220, opacity: blk * (1 - Math.max(0, into - 0.85) * 6), transform: `scale(${1 - into * 0.6})`, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 48, color: GOLD, textShadow: '0 0 20px rgba(217,173,69,0.7)' }}>
          R$ 5.000
        </div>
      ) : null}
      <Impact at={T.s3.bold} y={1400} size={48}>
        PRA 5, 15, 30 CONTAS DIFERENTES.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 4 — ISSO TEM NOME =====================
export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [T.s4.boxStart, T.s4.boxEnd], [0, 1], { ...clamp, easing: cubic });
  const rev = useSpring(T.s4.reveal, { damping: 11, stiffness: 170 });
  const bx = 150, by = 600, bw = 780, bh = 230, per = 2 * (bw + bh);
  return (
    <SceneFrame start={T.scenes.s4[0]} duration={dur('s4')} transition="glitch">
      <Title at={T.s4.label} size={74} serif>Isso tem nome.</Title>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
        <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} />
      </svg>
      <div style={{ position: 'absolute', left: bx, width: bw, top: by + bh / 2, transform: `translateY(-50%) scale(${interpolate(rev, [0, 1], [1.4, 1])})`, opacity: interpolate(rev, [0, 0.3], [0, 1], clamp), textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 70, lineHeight: 1.08, letterSpacing: 3, color: '#fff', textShadow: '0 0 28px rgba(255,255,255,0.6)' }}>
        LAVAGEM
        <br />
        DE DINHEIRO
      </div>
    </SceneFrame>
  );
};

// ===================== CENA 5 — A MÁQUINA DE LAVAR DINHEIRO =====================
export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const m = useSpring(T.s5.machine, { damping: 13 });
  // velocidade do tambor sobe e desce (rotação acumulada)
  let rot = 0;
  for (let k = T.s5.spinStart; k < Math.min(f, T.s5.spinEnd); k++) {
    const p = (k - T.s5.spinStart) / (T.s5.spinEnd - T.s5.spinStart);
    rot += 4 + 30 * Math.sin(p * Math.PI);
  }
  const shake = f > T.s5.spinStart && f < T.s5.spinEnd ? Math.sin(f * 2.1) * 3 * Math.sin(((f - T.s5.spinStart) / (T.s5.spinEnd - T.s5.spinStart)) * Math.PI) : 0;
  const MX = 540, MY = GROUND - 250, DR = 135;
  const stepIdx = T.s5.steps.filter((s) => f >= s).length;
  const stepTxt = ['', '1 · ENTRA SUJO', '2 · EMBARALHA', '3 · SAI "LIMPO"'][stepIdx];
  const stepS = spring({ frame: f - (T.s5.steps[stepIdx - 1] ?? 0), fps: 30, config: { damping: 12, stiffness: 170 } });
  return (
    <SceneFrame start={T.scenes.s5[0]} duration={dur('s5')}>
      <Title at={T.s5.text} size={44}>O CRIME PRECISA QUE O DINHEIRO PAREÇA LIMPO.</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: m, transform: `translate(${shake}px, ${(1 - m) * 60}px)` }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
          <rect x={MX - 220} y={MY - 250} width={440} height={500} rx={26} fill="rgba(5,5,5,0.92)" stroke="#fff" strokeWidth={3} />
          <line x1={MX - 220} x2={MX + 220} y1={MY - 170} y2={MY - 170} stroke="#fff" strokeWidth={2} strokeOpacity={0.6} />
          <circle cx={MX - 160} cy={MY - 210} r={12} fill="none" stroke="#fff" strokeWidth={2.5} />
          <circle cx={MX - 120} cy={MY - 210} r={8} fill="none" stroke="#fff" strokeWidth={2} />
          <rect x={MX + 40} y={MY - 222} width={140} height={24} rx={6} fill="none" stroke="#fff" strokeWidth={2} />
          <circle cx={MX} cy={MY + 30} r={DR + 22} fill="none" stroke="#fff" strokeWidth={4} />
          <circle cx={MX} cy={MY + 30} r={DR} fill="rgba(255,255,255,0.05)" stroke="#fff" strokeWidth={2} strokeOpacity={0.6} />
          {/* redemoinho girando */}
          <g transform={`translate(${MX} ${MY + 30}) rotate(${rot})`}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d={`M 0 0 C ${DR * 0.3} ${-DR * 0.2} ${DR * 0.6} ${-DR * 0.1} ${DR * 0.85} ${DR * 0.25}`} {...S} strokeWidth={2.5} strokeOpacity={0.55} transform={`rotate(${i * 60})`} />
            ))}
            {new Array(14).fill(0).map((_, i) => (
              <circle key={i} cx={Math.cos(i * 0.9) * DR * (0.3 + (i % 5) * 0.12)} cy={Math.sin(i * 0.9) * DR * (0.3 + (i % 5) * 0.12)} r={3 + (i % 3)} fill={i % 3 === 0 ? GOLD : '#fff'} opacity={0.7} />
            ))}
          </g>
        </svg>
      </div>
      {/* notas sujas entrando */}
      {new Array(7).fill(0).map((_, i) => {
        const st = T.s5.inStart + i * 10;
        const k = interpolate(f, [st, st + 22], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
        if (k <= 0 || k >= 1) return null;
        return (
          <Icon key={`in${i}`} x={interpolate(k, [0, 1], [150 + (i % 3) * 30, MX])} y={interpolate(k, [0, 1], [560, MY + 30]) - Math.sin(k * Math.PI) * 80} rotate={k * 300} scale={1 - k * 0.5}>
            <Bill clean={false} />
          </Icon>
        );
      })}
      {/* notas limpas saindo */}
      {new Array(7).fill(0).map((_, i) => {
        const st = T.s5.outStart + i * 17;
        const k = interpolate(f, [st, st + 26], [0, 1], { ...clamp, easing: cubic });
        if (k <= 0 || k >= 1) return null;
        return (
          <Icon key={`out${i}`} x={interpolate(k, [0, 1], [MX, 880 - (i % 3) * 30])} y={interpolate(k, [0, 1], [MY + 30, 600 + (i % 2) * 40]) - Math.sin(k * Math.PI) * 120} rotate={-k * 360} scale={0.5 + k * 0.6} gold opacity={k > 0.85 ? (1 - k) * 6 : 1}>
            <Bill clean />
          </Icon>
        );
      })}
      {stepIdx > 0 ? (
        <div style={{ position: 'absolute', left: 540 - 200, top: GROUND + 40, width: 400, transform: `scale(${0.7 + stepS * 0.3})`, opacity: stepS, border: '3px solid #fff', borderRadius: 34, padding: '12px 0', textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 28, letterSpacing: 4, color: '#fff', background: 'rgba(5,5,5,0.9)', boxShadow: '0 0 16px rgba(255,255,255,0.35)' }}>
          {stepTxt}
        </div>
      ) : null}
    </SceneFrame>
  );
};

// ===================== CENA 6 — VOCÊ É O LARANJA =====================
export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const z = interpolate(f, [T.s6.zoom, T.s6.zoom + 30], [1, 1.9], { ...clamp, easing: inOut });
  const lj = useSpring(T.s6.laranja, { damping: 9, stiffness: 160 });
  const bounce = f > T.s6.laranja ? Math.abs(Math.sin((f - T.s6.laranja) * 0.18)) * 14 : 0;
  return (
    <SceneFrame start={T.scenes.s6[0]} duration={dur('s6')} ground={false}>
      <Title at={T.s6.text} size={44}>QUEM EMPRESTA A CONTA VIRA O "LARANJA".</Title>
      <div style={{ position: 'absolute', inset: 0, clipPath: 'inset(500px 0 330px 0)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 500px, #000 600px, #000 1480px, transparent 1590px)' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: `${CX}px ${CY}px` }}>
          <Network f={9999} splits={[0, 0, 0]} youLabel={false} dim={0.55} />
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: interpolate(f, [T.s6.zoom + 20, T.s6.zoom + 32], [0, 1], clamp) }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
          <circle cx={CX} cy={CY} r={130} fill="rgba(5,5,5,0.92)" stroke={BLUE} strokeWidth={4} style={{ filter: `drop-shadow(0 0 16px ${BLUE})` }} />
        </svg>
        <Person x={CX} ground={CY + 95} scale={0.5} glow={0.5} />
        <div style={{ position: 'absolute', left: CX - 150, width: 300, top: CY + 150, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 18, letterSpacing: 3, color: '#fff', whiteSpace: 'nowrap' }}>SEU NOME · SEU CPF</div>
      </div>
      {/* laranja (fruta de linha) quicando sobre a conta */}
      <div style={{ position: 'absolute', inset: 0, opacity: lj }}>
        <Icon x={CX} y={CY - 200 - bounce} scale={0.6 + lj * 0.6} rotate={Math.sin(f * 0.1) * 8}>
          <circle r={46} {...S} />
          <path d="M 0 -46 C -4 -60 6 -70 16 -72 M 2 -50 C 18 -66 40 -60 44 -50 C 30 -44 14 -46 2 -50 Z" {...S} />
          {[[-16, -10], [12, -18], [20, 12], [-10, 20], [0, 0]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.5} fill="#fff" />
          ))}
        </Icon>
        <div style={{ position: 'absolute', left: CX + 70, top: CY - 230 - bounce, fontFamily: FONT, fontWeight: 900, fontSize: 34, letterSpacing: 5, color: '#fff', textShadow: '0 0 16px rgba(255,255,255,0.6)' }}>LARANJA</div>
      </div>
      <Impact at={T.s6.bold} y={1400} size={48}>
        O NOME QUE APARECE É O SEU.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 7 — AS CONSEQUÊNCIAS =====================
const STAMPS = ['CONTA BLOQUEADA', 'INVESTIGAÇÃO', 'PROCESSO'];
export const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const cuffs = spring({ frame: f - T.s7.cuffs, fps: 30, config: { damping: 10, stiffness: 200 } });
  return (
    <SceneFrame start={T.scenes.s7[0]} duration={dur('s7')} transition="glitch">
      {STAMPS.map((s, i) => {
        const st = T.s7.stamps[i];
        const k = spring({ frame: f - st, fps: 30, config: { damping: 11, stiffness: 220 } });
        if (f < st) return null;
        return (
          <div key={s} style={{ position: 'absolute', left: 540 - 300, top: 540 + i * 100, width: 600, textAlign: 'center', transform: `rotate(${[-6, 4, -3][i]}deg) scale(${interpolate(k, [0, 1], [2.4, 1])})`, opacity: Math.min(1, k * 2), border: '5px solid #fff', borderRadius: 12, padding: '10px 0', fontFamily: FONT, fontWeight: 900, fontSize: 46, letterSpacing: 6, color: '#fff', background: 'rgba(5,5,5,0.88)', boxShadow: '0 0 22px rgba(255,255,255,0.5)' }}>
            {s}
          </div>
        );
      })}
      {f >= T.s7.cuffs ? (
        <Icon x={540} y={GROUND - 120} scale={0.9 + cuffs * 0.1}>
          <g transform={`translate(${-70 + (1 - cuffs) * -60} 0) rotate(${(1 - cuffs) * -30})`}>
            <circle r={50} {...S} strokeWidth={6} />
            <circle r={36} {...S} strokeWidth={2} strokeOpacity={0.5} />
          </g>
          <g transform={`translate(${70 + (1 - cuffs) * 60} 0) rotate(${(1 - cuffs) * 30})`}>
            <circle r={50} {...S} strokeWidth={6} />
            <circle r={36} {...S} strokeWidth={2} strokeOpacity={0.5} />
          </g>
          <path d="M -20 0 L -8 0 M 8 0 L 20 0 M -8 -6 L 8 6 M -8 6 L 8 -6" {...S} strokeWidth={5} />
        </Icon>
      ) : null}
      <Small at={T.s7.law1} y={1180} size={21}>
        LEI 15.397/2026 · CEDER A CONTA PRA DINHEIRO
        <br />
        DO CRIME: 1 A 5 ANOS
      </Small>
      <Small at={T.s7.law2} y={1262} size={21}>
        SE FOR LAVAGEM (LEI 9.613/98): 3 A 10 ANOS DE RECLUSÃO
      </Small>
      <Impact at={T.s7.bold} y={1410} size={50}>
        OS <Gold>R$ 500</Gold> SOMEM. O PROCESSO FICA.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 8 — A BALANÇA DO CÉREBRO =====================
export const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const sc = useSpring(T.s8.scale, { damping: 14 });
  const money = useSpring(T.s8.money, { damping: 11 });
  const rev = spring({ frame: f - T.s8.reveal, fps: 30, config: { damping: 8, stiffness: 120 } });
  const tilt = f < T.s8.reveal ? -14 * money : -14 + 30 * rev; // primeiro pesa o dinheiro, depois o risco
  const PX = 540, PY = 640, ARM = 270;
  const rad = (tilt * Math.PI) / 180;
  const lx = PX - Math.cos(rad) * ARM, ly = PY - Math.sin(rad) * ARM;
  const rx = PX + Math.cos(rad) * ARM, ry = PY + Math.sin(rad) * ARM;
  const pan = (x: number, y: number, content: React.ReactNode, w = 230) => (
    <>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
        <line x1={x} y1={y} x2={x - 90} y2={y + 150} {...S} strokeWidth={2} />
        <line x1={x} y1={y} x2={x + 90} y2={y + 150} {...S} strokeWidth={2} />
        <path d={`M ${x - 115} ${y + 150} Q ${x} ${y + 210} ${x + 115} ${y + 150} Z`} {...S} fill="rgba(5,5,5,0.9)" />
      </svg>
      <div style={{ position: 'absolute', left: x - w / 2, width: w, top: y + 70, textAlign: 'center', fontFamily: FONT }}>{content}</div>
    </>
  );
  return (
    <SceneFrame start={T.scenes.s8[0]} duration={dur('s8')}>
      <Title at={T.s8.text} size={46}>POR QUE TANTA GENTE CAI?</Title>
      <div style={{ position: 'absolute', inset: 0, opacity: sc }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: GLOW }}>
          <line x1={PX} y1={PY} x2={PX} y2={GROUND} {...S} />
          <path d={`M ${PX - 70} ${GROUND} L ${PX + 70} ${GROUND}`} {...S} strokeWidth={5} />
          <line x1={lx} y1={ly} x2={rx} y2={ry} {...S} strokeWidth={5} />
          <circle cx={PX} cy={PY} r={12} {...S} fill="#050505" />
        </svg>
        <Icon x={PX} y={PY - 90} scale={0.55}>
          <Brain />
        </Icon>
        {pan(lx, ly, <div style={{ fontSize: 40, fontWeight: 900, color: GOLD, opacity: money, transform: `scale(${0.6 + money * 0.4})`, textShadow: '0 0 20px rgba(217,173,69,0.7)' }}>R$ 500</div>)}
        {pan(rx, ry, (
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: 2, lineHeight: 1.35, color: '#fff', opacity: 0.25 + rev * 0.75, filter: `blur(${(1 - Math.min(1, rev)) * 3}px)` }}>
            NOME SUJO
            <br />
            PROCESSO
            <br />
            PRISÃO
          </div>
        ))}
      </div>
      <Impact at={T.s8.bold} y={1400} size={44}>
        O CÉREBRO VÊ OS <Gold>R$ 500</Gold> AGORA. E NÃO ENXERGA O PREÇO DEPOIS.
      </Impact>
    </SceneFrame>
  );
};

// ===================== CENA 9 — O OUTRO LADO =====================
export const Scene9: React.FC = () => {
  const other = useSpring(T.s9.other, { damping: 15 });
  const [i1, i2, i3] = T.s9.icons;
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
    <SceneFrame start={T.scenes.s9[0]} duration={dur('s9')}>
      <Title at={T.s9.text} size={48}>QUEM PROTEGE O NOME FAZ DIFERENTE.</Title>
      {item(270, s1, (
        <g>
          <rect x={-60} y={-40} width={120} height={80} rx={10} {...S} />
          <text y={8} textAnchor="middle" fill="#fff" fontFamily={FONT} fontWeight={900} fontSize={22}>CPF</text>
          <line x1={-70} y1={50} x2={70} y2={-50} {...S} strokeWidth={5} />
        </g>
      ), <>NUNCA EMPRESTA<br />CONTA NEM CPF</>)}
      {item(540, s2, (
        <g>
          <circle r={44} fill="#050505" stroke={GOLD} strokeWidth={3} />
          <text y={18} textAnchor="middle" fill={GOLD} fontFamily={FONT} fontWeight={900} fontSize={50}>?</text>
        </g>
      ), <>DESCONFIA DE<br />DINHEIRO FÁCIL</>)}
      {item(810, s3, (
        <g>
          <rect x={-34} y={-56} width={68} height={112} rx={12} {...S} />
          <path d="M -18 -10 L 0 -24 L 18 -10 M -14 -8 L -14 14 M 0 -8 L 0 14 M 14 -8 L 14 14 M -20 18 L 20 18" {...S} strokeWidth={2.5} />
        </g>
      ), <>PIX ESTRANHO?<br />FALA COM O BANCO</>)}
      <div style={{ position: 'absolute', inset: 0, opacity: other, transform: `translateY(${(1 - other) * 30}px)` }}>
        <Person x={540} glow={0.6} glowColor={GOLD} />
      </div>
      <Impact at={T.s9.bold} y={1400} size={56}>
        DINHEIRO FÁCIL TEM DONO.
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
        <div style={{ position: 'absolute', left: PINX - NW / 2 + 50, width: NW - 100, top: PINY + 84, fontFamily: FONT, fontWeight: 700, fontSize: 40, lineHeight: 1.45, letterSpacing: 3, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.3)', whiteSpace: 'pre' }}>
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
        <div style={pill(p1, false)}>ACEITA OS R$ 500</div>
        <div style={{ opacity: ou, fontFamily: FONT, fontWeight: 600, fontSize: 24, letterSpacing: 4, color: 'rgba(255,255,255,0.7)' }}>OU</div>
        <div style={pill(p2, true)}>PROTEGE SEU NOME</div>
      </div>
      <Person x={540} glow={0.45} label="VOCÊ" />
    </SceneFrame>
  );
};
