# Vídeo 2 — "O 'sem juros' é a compra mais cara"

Vídeo vertical 1080x1920, 30fps, 63s, feito em Remotion. Narração em `public/voz.mp3` (ElevenLabs); trilha e efeitos 100% sintetizados (95 BPM, Ré menor). Timeline reajustada para acompanhar a voz (77s); legendas seguem a fala.

- `src/timeline.json` — tempos (em frames) de cenas, eventos e legendas; vídeo e áudio leem daqui.
- `scripts/gen-audio.mjs` — gera `public/audio.wav` (-14 LUFS). Se existir `public/voz.mp3`, mixa a narração com ducking.
- `src/scenes.tsx`, `src/icons2.tsx` — cenas e ícones SVG do vídeo 2.

```bash
npm install
npm run audio
npm run render     # out/video2.mp4
```
