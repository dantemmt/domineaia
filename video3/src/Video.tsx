import React from 'react';
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import T from './timeline.json';
import { FONT, W, H, clamp } from './ui';
import { Captions } from './captions';
import { FxLayer, useCameraPunch } from './fx';
import { BackgroundFX } from './backgroundfx';
import { Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9, Scene10, Scene11, Scene12 } from './scenes';

const SCENES: [keyof typeof T.scenes, React.FC][] = [
  ['s1', Scene1], ['s2', Scene2], ['s3', Scene3], ['s4', Scene4], ['s5', Scene5], ['s6', Scene6],
  ['s7', Scene7], ['s8', Scene8], ['s9', Scene9], ['s10', Scene10], ['s11', Scene11], ['s12', Scene12],
];

const Background: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: '#050505' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 50%, rgba(70,70,70,0.32) 0%, rgba(30,30,30,0.12) 45%, rgba(5,5,5,0) 75%)' }} />
  </>
);

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.85) 100%)', pointerEvents: 'none' }} />
);

// Granulação de filme animada (5%)
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'screen' }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 97} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter="url(#grain)" />
    </svg>
  );
};

// Pílula do curso (canto inferior esquerdo)
const CoursePill: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = (f: number) => spring({ frame: frame - f, fps, config: { damping: 20, stiffness: 90 } });
  let open = 0;
  for (const [a, b] of T.coursePill) open = Math.max(open, sp(a) - (b < 90000 ? sp(b) : 0));
  open = Math.max(0, Math.min(1, open));
  const intro = interpolate(frame, [4, 16], [0, 1], clamp);
  return (
    <div
      style={{
        position: 'absolute', left: 60, top: 1700, height: 96, display: 'flex', alignItems: 'stretch',
        border: '2px solid rgba(255,255,255,0.9)', borderRadius: 48, overflow: 'hidden',
        background: 'rgba(0,0,0,0.55)', boxShadow: '0 0 14px rgba(255,255,255,0.18)', opacity: intro,
        fontFamily: FONT,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 30px 0 28px' }}>
        <svg width={26} height={28} viewBox="0 0 26 28"><path d="M3 2 L24 14 L3 26 Z" fill="#fff" /></svg>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 3 }}>CÓDIGO VOYREX</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: 15, letterSpacing: 3, marginTop: 4 }}>PSICOLOGIA DO DINHEIRO</div>
        </div>
      </div>
      <div style={{ width: 560 * open, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 560, flexShrink: 0, textAlign: 'center', color: '#000', fontWeight: 800, fontSize: 19, letterSpacing: 2, whiteSpace: 'nowrap', opacity: interpolate(open, [0.5, 1], [0, 1], clamp) }}>
          UMA DAS AULAS DO CURSO · LINK NA BIO ↓
        </div>
      </div>
    </div>
  );
};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [T.s12.fadeStart, T.durationInFrames], [0, 1], clamp);
  const punch = useCameraPunch();
  return (
    <AbsoluteFill style={{ background: '#050505', overflow: 'hidden' }}>
      <Background />
      <BackgroundFX />
      <div style={{ position: 'absolute', inset: 0, ...punch }}>
      {SCENES.map(([k, C]) => {
        const [a, b] = T.scenes[k];
        return frame >= a && frame < b ? <C key={k} /> : null;
      })}
        <FxLayer />
      </div>
      <Vignette />
      <Captions />
      <CoursePill />
      <div style={{ position: 'absolute', right: 60, top: 70, fontFamily: FONT, fontWeight: 500, fontSize: 24, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>
        @codigovoyrex
      </div>
      <Grain />
      <AbsoluteFill style={{ background: '#000', opacity: fade }} />
      <Audio src={staticFile('audio.wav')} />
    </AbsoluteFill>
  );
};
