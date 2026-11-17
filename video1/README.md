# Vídeo 1 — "Nunca comemore o dia do pagamento"

Vídeo vertical 1080x1920, 30fps, 63s, feito em Remotion. Narração em `public/voz.mp3` (ElevenLabs); trilha e efeitos 100% sintetizados. A timeline foi reajustada para acompanhar a voz (77s), e as legendas seguem as frases da narração.

- `src/timeline.json` — todos os tempos (em frames) das cenas e eventos; vídeo e áudio leem daqui, então ficam sincronizados.
- `scripts/gen-audio.mjs` — gera `public/audio.wav` (música 90 BPM em Lá menor + efeitos, reverb, -14 LUFS, limiter).
- `src/scenes.tsx`, `src/icons.tsx`, `src/ui.tsx`, `src/Video.tsx` — cenas, ícones SVG e elementos fixos.

```bash
npm install
npm run audio      # gera public/audio.wav
npm run render     # gera out/video1.mp4
```

Em ambientes sem download de Chrome, adicione `--browser-executable=<caminho do chrome-headless-shell>` ao render.
