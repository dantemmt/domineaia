import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import T from './timeline.json';
import { FONT } from './ui';

// Legendas rápidas: frases curtas que trocam a cada ~1s, palavra por palavra.
const CAPS = T.captions as [number, string][];
const END = T.s11.fadeStart;
const Y = 1600;

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let idx = -1;
  for (let i = 0; i < CAPS.length; i++) if (CAPS[i][0] <= frame) idx = i;
  if (idx < 0 || frame >= END) return null;
  const [start, text] = CAPS[idx];
  const words = text.split(' ');
  return (
    <div
      style={{
        position: 'absolute', left: 40, width: 1000, top: Y, transform: 'translateY(-50%)',
        display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: 16,
        fontFamily: FONT, fontWeight: 800, fontSize: 46, letterSpacing: 3, color: '#fff',
        textShadow: '0 0 16px rgba(255,255,255,0.4), 0 2px 10px rgba(0,0,0,0.9)',
      }}
    >
      {words.map((w, i) => {
        const s = spring({ frame: frame - start - i * 2, fps, config: { damping: 14, stiffness: 260, mass: 0.5 } });
        return (
          <span key={i} style={{ display: 'inline-block', opacity: Math.min(1, s * 2), transform: `translateY(${(1 - s) * 18}px) scale(${0.7 + s * 0.3})`, filter: `blur(${Math.max(0, 1 - s) * 4}px)` }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};
