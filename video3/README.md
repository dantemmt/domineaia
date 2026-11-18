# Vídeo 3 — "O supermercado esconde o arroz no fundo"

Vídeo vertical 1080x1920, 30fps, 63s, feito em Remotion. Trilha e efeitos 100% sintetizados (92 BPM, Mi menor, caixinha de música desafinada, tape stop na cena 6).

- `src/timeline.json` — tempos (em frames) de cenas, eventos, nota fiscal e legendas; vídeo e áudio leem daqui.
- `scripts/gen-audio.mjs` — gera `public/audio.wav` (-14 LUFS). Se existir `public/narracao.mp3`, mixa a voz e abaixa a música para -24 dB enquanto ela fala.
- `src/scenes.tsx`, `src/icons3.tsx` — cenas e ícones SVG do vídeo 3.

```bash
npm install
npm run audio
npm run render     # out/video3.mp4
```
