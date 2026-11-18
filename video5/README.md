# Vídeo 5 — "Você tem 4 dívidas e R$ 300 sobrando. Qual você paga primeiro?"

Vídeo vertical 1080x1920, 30fps, 63s (sem voz), feito em Remotion. Tema: método bola de neve para sair das dívidas.
Trilha e efeitos 100% sintetizados (90 BPM, Ré menor, tique-taque de tensão até a resposta, piano de alívio depois).

Contas do exemplo (sem juros): mínimos R$ 60 + 90 + 240 + 280 = R$ 670 + R$ 300 extra = R$ 970/mês.
Bola de neve: LOJA quita no mês 1, CELULAR no mês 2, CARTÃO no mês 5, EMPRÉSTIMO no mês 7 (bola: R$ 360 → 450 → 690).
Atacando a maior: 3.000 − 280 − 300 = R$ 2.420 restantes após 1 mês.
Fontes: Gal & McShane (2012), Journal of Marketing Research (Kellogg/Northwestern, ~6.000 pessoas); rotativo acima de 400% a.a. (BC, 2026).

- `src/timeline.json` — tempos (em frames), efeitos e legendas; vídeo e áudio leem daqui.
- `scripts/gen-audio.mjs` — gera `public/audio.wav` (-14 LUFS). Se existir `public/narracao.mp3`, mixa a voz com ducking.
- `narracao.txt` — texto para gravar no ElevenLabs.

```bash
npm install && npm run audio && npm run render   # out/video5.mp4
```
