# ASMR Cuts — gerador de vídeos "1 Corte vs 1.000 Cortes"

Vídeos verticais (1080×1920, 30 fps) **sem fala**, prontos para Reels/TikTok/Shorts.
Um objeto 3D flutua sobre uma tábua e é cortado em etapas (1 → 10 → 100 → 1.000 cortes),
com linhas de corte brilhando, facas passando, pedaços caindo, cubinhos formando um montinho,
contador `n / 100` e efeitos sonoros ASMR **100% sintetizados** (sem samples, sem direitos autorais),
mais uma trilha ambiente suave opcional.

## Como gerar

```bash
cd asmr-cuts
npm install          # só na primeira vez (three.js + fonte)
node render.mjs --theme abacate
# saída: out/abacate-1-10-100-1000.mp4
```

Gerar todos os temas de uma vez:

```bash
./make-all.sh
```

## Opções

| opção | exemplo | o que faz |
|---|---|---|
| `--theme` | `melancia` | objeto cortado (veja a lista abaixo) |
| `--stages` | `1,10,100,1000` | etapas de cortes (1 = metades, 2–30 = pedaços, 31+ = cubinhos/purê) |
| `--lang` | `en` | textos em inglês ("1 Cut vs 1,000 Cuts") |
| `--seed` | `3` | muda a aleatoriedade (cortes/pedaços diferentes, mesmo tema) |
| `--target` | `"10.000 Cortes"` | texto roxo da capa (padrão = última etapa) |
| `--outro` | `"Qual você escolhe?"` | pergunta final (gera comentários) |
| `--no-music` | | só efeitos sonoros, sem trilha |
| `--stills` | `2,8,15` | só salva imagens desses segundos (prévia rápida) |
| `--out` | `out/x.mp4` | caminho do arquivo |

## Temas prontos

`abacate`, `melancia`, `laranja`, `limao`, `kiwi`, `tomate`, `ovo`, `sabao`, `queijo`

Para criar um tema novo, copie um bloco em `web/themes.js` e troque cores/formato:
- `shape.scale` (tamanho em x, y, z), `shape.exp` (`[2,2]` = oval, `[5,5]` = barra/caixa, `[2,8]` = cilindro), `shape.taper` (afinar topo)
- `skin` = casca (`speckle`, `stripes`, `dimple`, `blush`, `fuzzy`, `swirl`, `plain`)
- `layers` = camadas de dentro (casca → miolo), `core` = caroço/gema
- `cap.pattern` = desenho do corte (`plain`, `segments` gomos, `seeds` sementes, `seedring` anel do kiwi, `swirl` mármore, `holes` furos de queijo)

## Ideias de títulos/variações

- `--stages 1,10,100,1000,10000` → "1 Corte vs 10.000 Cortes"
- `--stages 1,5,50,500` → variação de série
- Mesmo tema com `--seed` diferente = vídeo novo sem repetir
- Série "Qual fruta é mais satisfatória de cortar?" (um vídeo por tema)
- Versão em inglês (`--lang en`) para alcançar público gringo
