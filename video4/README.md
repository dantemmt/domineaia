# Vídeo 4 — "Por que o banco aumenta seu limite sem você pedir?"

Narração em `public/narracao.mp3` (voz Drew, ElevenLabs); timeline reajustada para acompanhar a voz (71s), legendas seguem a fala.

Vídeo vertical 1080x1920, 30fps, 63s, feito em Remotion. Trilha e efeitos 100% sintetizados (88 BPM, Sol menor, bip frio de maquininha, corte seco na cena 4, coração e baixo subindo meio tom por mês nas cenas 6–7).

- `src/timeline.json` — tempos (em frames) de cenas, eventos e legendas; vídeo e áudio leem daqui.
- `scripts/gen-audio.mjs` — gera `public/audio.wav` (-14 LUFS). Se existir `public/narracao.mp3`, mixa a voz e abaixa a música para -24 dB enquanto ela fala.
- `src/scenes.tsx`, `src/icons4.tsx` — cenas e ícones SVG do vídeo 4.

```bash
npm install
npm run audio
npm run render     # out/video4.mp4
```
