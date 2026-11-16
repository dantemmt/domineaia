# Instruções do dono do projeto

## Regra principal: economia máxima de créditos
- Gastar o MÍNIMO possível de créditos (Claude e ElevenLabs), sempre mantendo a qualidade.
- Respostas curtas e diretas. Sem relatórios longos, sem revisões/testes repetidos além do essencial.
- Reaproveitar código/cenários existentes em vez de recriar do zero.
- ElevenLabs: gerar UMA versão só (generations_count = 1), todas as falas num único texto, e recortar por frase depois (ffmpeg silencedetect).
- Se o ElevenLabs estiver ocupado, não ficar tentando em loop: agendar nova tentativa e avisar em uma linha.

## Série "Stickman Zumbi" (vídeos)
- Arquivos: `stickman_zumbi_parte2.html` … `stickman_zumbi_parte5.html` (parte 5 = final). Ep 1 é o vídeo original do usuário.
- Padrão: canvas 1280x720, mundo realista + personagens palito, legendas, mensagem discreta 18–26s ("quer aprender a fazer vídeos como esse? link na bio"), som sintetizado com Web Audio, ~92s.
- Voz da narração: ElevenLabs "Eric - Professional Brazilian Narrator" (voice_id `JcJSwKJ3l1HpINgnIA4X`, modelo `eleven_multilingual_v2`). Usar sempre essa voz.
- Novo episódio: copiar o HTML do episódio anterior, trocar só cenas (funções de cena), CUES, schedule de áudio e narração embutida (NSEG + NARR_MP3).
- O usuário quer sempre o MP4 final para baixar e salvar nas Fotos (renderizar quadros com Playwright + áudio via OfflineAudioContext + ffmpeg). Não commitar MP4 no repositório.

## Mixagem de áudio (regra fixa)
- Voz SEMPRE bem mais alta que tudo (é o som principal, o ouvinte precisa entender cada palavra).
- Efeitos e trilha audíveis, mas baixos: no HTML, `bed = gn(.45)` para sfx/mus/hb e narração `gn(1.6)`.

## Retenção (regra fixa para todo vídeo)
- Gancho nos primeiros 3s, curiosidade e perguntas diretas ao espectador ao longo do vídeo.
- Uma promessa no começo/meio ("fica até o final...") que só é entregue no final. Não entregar tudo no início.
- Terminar com pergunta para comentários. Texto grande na tela nos pontos-chave.

## Estilo de personagens (a partir do vídeo do Pelé)
- Padrão: personagens estilo "Fama em Miniatura" (chibi: cabeça grande, olhos grandes com brilho, bochechas rosadas, contorno escuro) — `drawChibi`, `STYLE = 'chibi'` em `stickman_pele.html`. Cenários continuam os mesmos.
- Vídeos sempre em duas versões: em pé 9:16 (TikTok/Reels, com frase-gancho no topo) e normal 16:9.
