# Manual de controles do Synth Studio

Guia de uso: teclado, parâmetros do sintetizador, sequenciador e receitas de sound design.

## 1. Primeiros passos

Por política dos navegadores, o áudio só inicia após um gesto seu. Ao abrir o app, uma faixa no topo avisa: **clique em qualquer lugar ou toque uma tecla** para ativar o som. Depois disso, tudo responde em tempo real.

O sintetizador é polifônico (até 16 vozes simultâneas) — toque acordes à vontade.

## 2. Teclado

### Teclado físico (computador)

O mapeamento usa a **posição física** das teclas, então funciona igual em qualquer layout (ABNT, US, etc.). A fileira do meio são as teclas brancas; a fileira de cima, as pretas:

| Tecla | Nota | | Tecla | Nota |
|---|---|---|---|---|
| A | C4 (dó) | | K | C5 (dó) |
| W | C#4 | | O | C#5 |
| S | D4 (ré) | | L | D5 (ré) |
| E | D#4 | | P | D#5 |
| D | E4 (mi) | | Ç (ponto e vírgula) | E5 (mi) |
| F | F4 (fá) | | | |
| T | F#4 | | | |
| G | G4 (sol) | | | |
| Y | G#4 | | | |
| H | A4 (lá) | | | |
| U | A#4 | | | |
| J | B4 (si) | | | |

Outras teclas:

| Tecla | Ação |
|---|---|
| Espaço | Tocar / parar o sequenciador |

Observações:

- Segurar a tecla sustenta a nota (fase de sustentação do envelope); soltar dispara a liberação.
- O autorepeat do teclado é ignorado — a nota não retriga sozinha.
- Se a janela perder o foco, todas as notas seguradas são soltas automaticamente.
- O teclado físico só responde quando o app está em foco (clique nele se as teclas não soarem).

### Teclado na tela

O teclado visual cobre **duas oitavas (C4 a B5)** — mais agudo que o alcance do teclado físico. As dicas de tecla (A, W, S...) aparecem impressas nas teclas correspondentes.

- Clique/toque em uma tecla para tocar.
- **Glissando**: mantenha pressionado e arraste sobre as teclas para deslizar entre notas.

## 3. Parâmetros do sintetizador

Os controles ficam na coluna esquerda, agrupados em cartões. Todas as mudanças são aplicadas suavemente, sem estalos, mesmo com som tocando.

### Osciladores

Cada nota soa com dois osciladores misturados.

| Controle | Faixa | Efeito sonoro |
|---|---|---|
| Osc 1 / Osc 2 (forma de onda) | Sen, Quad, Serra, Tri | Sen: pura, flauta. Tri: doce, poucos harmônicos. Quad: oca, "videogame". Serra: brilhante e rica, base clássica de synth. |
| Detune Osc 2 | −100 a +100 ct | Desafina o Osc 2 em cents (100 ct = 1 semitom). Valores pequenos (5–25 ct) criam batimento e espessura tipo chorus; 0 deixa os dois em uníssono exato. |
| Mix Osc 1 / 2 | 0–100% | Balanço entre os osciladores: 0% = só Osc 1, 100% = só Osc 2, 50% = mistura igual. |

### Envelope (ADSR)

Molda o volume da nota ao longo do tempo.

| Controle | Faixa | Efeito sonoro |
|---|---|---|
| Ataque | 0–2 s | Tempo até o volume máximo. Curto = percussivo; longo = a nota "nasce" gradualmente (pads). |
| Decaimento | 0–2 s | Tempo da queda do pico até o nível de sustentação. |
| Sustentação | 0–100% | Nível mantido enquanto a tecla está pressionada (é nível, não tempo). 0% transforma a nota em um pulso que morre sozinho. |
| Liberação | 0–3 s | Tempo de fade após soltar a tecla. Curto = nota seca; longo = cauda que continua soando. |

### Filtro lowpass

Corta os agudos acima da frequência de corte — o coração do timbre subtrativo.

| Controle | Faixa | Efeito sonoro |
|---|---|---|
| Corte | 100 Hz – 12 kHz (escala logarítmica) | Fechado (baixo): som abafado, escuro. Aberto (alto): som brilhante, presente. O slider responde de forma musical em todo o curso. |
| Ressonância | 0,1 – 20 | Realce na região do corte. Moderada (2–6) dá caráter; alta (10+) assobia e pode "gritar" — use com o corte mais fechado e volume moderado. |

### Delay

Eco com repetições que se apagam gradualmente. Afeta só o sintetizador (a bateria do sequenciador é seca).

| Controle | Faixa | Efeito sonoro |
|---|---|---|
| Tempo | 0–800 ms | Intervalo entre as repetições. Curto (<80 ms) engrossa; médio/longo cria ecos rítmicos audíveis. |
| Realimentação | 0–85% | Quantas vezes o eco se repete. Baixa = um eco; alta = cauda longa de repetições. |
| Envio | 0–100% | Quanto do som entra no delay (mistura seco/efeito). 0% desliga o efeito. |

### Saída

| Controle | Faixa | Efeito sonoro |
|---|---|---|
| Volume master | 0–100% | Volume geral. Um limitador no final da cadeia protege contra distorção em picos. |

### Visualizador

O painel acima do sequenciador é um osciloscópio em tempo real: mostra a forma de onda do que está soando (vozes + bateria + delay), na cor do tema. Útil para *ver* o efeito do detune (batimento), do filtro (ondas mais arredondadas) e do envelope.

## 4. Sequenciador

Grade de **4 trilhas × 16 passos** (um compasso em semicolcheias):

| Trilha | Som |
|---|---|
| Bumbo | Grave sintetizado com queda de pitch |
| Caixa | Ruído filtrado, estalo médio |
| Chimbal | Ruído agudo e curto |
| Baixo | Nota C2 tocada pelo **próprio sintetizador** — os controles da coluna esquerda mudam o timbre do baixo |

### Como programar um padrão

1. Clique nas células para ativar/desativar passos (acesas = tocam). O fundo alterna a cada 4 passos para marcar os tempos do compasso.
2. Pressione **Tocar** (ou Espaço). A linha de indicadores e o realce nas células mostram o passo atual.
3. Edite com o som rodando — as mudanças entram no próximo ciclo do passo.

### Transporte e utilitários

| Controle | Função |
|---|---|
| Tocar / Parar | Inicia ou interrompe o loop (atalho: Espaço). |
| BPM | Andamento, de 60 a 180. Pode ser alterado durante a reprodução. |
| Demo | Carrega um groove pronto (bumbo "quatro no chão", caixa no backbeat, chimbal em contratempo, baixo sincopado), ajusta o BPM para 124 e já começa a tocar. |
| Limpar | Apaga todas as células (desabilitado se o padrão já está vazio). |

Dica: o sequenciador roda com agendamento de alta precisão pelo relógio de áudio — o groove se mantém estável mesmo com a interface ocupada.

## 5. Dicas de sound design

Receitas de ponto de partida. Ajuste de ouvido a partir delas.

### Baixo gordo (para a trilha Baixo do sequenciador)

| Parâmetro | Valor |
|---|---|
| Osc 1 / Osc 2 | Serra / Quad |
| Detune | +8 ct · Mix 40% |
| ADSR | Ataque 5 ms · Decaimento 200 ms · Sustentação 70% · Liberação 150 ms |
| Filtro | Corte ~400 Hz · Ressonância 3 |
| Delay | Envio 0% |

Ative alguns passos na trilha Baixo: o corte fechado deixa só o fundamento, e a mistura serra+quadrada dá corpo. Suba a ressonância para 8–12 e abra o corte aos poucos para um baixo "ácido".

### Pad suave

| Parâmetro | Valor |
|---|---|
| Osc 1 / Osc 2 | Tri / Sen |
| Detune | +12 ct · Mix 50% |
| ADSR | Ataque 0,8 s · Decaimento 1 s · Sustentação 80% · Liberação 2,5 s |
| Filtro | Corte ~1,5 kHz · Ressonância 0,5 |
| Delay | Tempo 450 ms · Realimentação 55% · Envio 35% |

Segure acordes de 3–4 notas. O ataque lento e a liberação longa fazem as notas se fundirem; o delay preenche o espaço.

### Pluck percussivo

| Parâmetro | Valor |
|---|---|
| Osc 1 / Osc 2 | Quad / Serra |
| Detune | +5 ct · Mix 30% |
| ADSR | Ataque 0 · Decaimento 130 ms · Sustentação 0% · Liberação 120 ms |
| Filtro | Corte ~3 kHz · Ressonância 6 |
| Delay | Tempo 300 ms · Realimentação 45% · Envio 25% |

Com sustentação em 0%, a nota vira um pulso curto independente de quanto tempo você segura a tecla. O delay transforma toques isolados em arpejos rítmicos.

### Lead encorpado

| Parâmetro | Valor |
|---|---|
| Osc 1 / Osc 2 | Serra / Serra |
| Detune | +20 ct · Mix 50% |
| ADSR | Ataque 10 ms · Decaimento 300 ms · Sustentação 75% · Liberação 400 ms |
| Filtro | Corte ~6 kHz · Ressonância 2 |
| Delay | Tempo 280 ms · Realimentação 40% · Envio 20% |

Duas serras desafinadas em mix igual produzem o batimento largo clássico de lead. Toque melodias na oitava de cima (K em diante) por cima do groove da Demo.

### Sino / pure tone

| Parâmetro | Valor |
|---|---|
| Osc 1 / Osc 2 | Sen / Sen |
| Detune | 0 ct · Mix 0% |
| ADSR | Ataque 0 · Decaimento 1,2 s · Sustentação 0% · Liberação 1 s |
| Filtro | Corte máximo · Ressonância 0,1 |
| Delay | Tempo 500 ms · Realimentação 60% · Envio 40% |

Senoide pura com decaimento longo e bastante eco: cada nota fica suspensa no ar. Bom para texturas lentas sobre BPM baixo.

## 6. Tema

No cabeçalho, os círculos coloridos trocam a cor de destaque do app (teclas pressionadas, células do sequenciador, sliders e o traço do visualizador). A escolha fica salva no navegador.
