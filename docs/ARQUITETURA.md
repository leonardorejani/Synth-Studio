# Arquitetura do Synth Studio

Mergulho técnico na implementação do sintetizador e sequenciador. Este documento descreve o código real em `src/` — toda afirmação aqui é verificável nos arquivos citados.

## 1. Visão geral

O Synth Studio é um sintetizador polifônico subtrativo com sequenciador de passos, construído com:

- **React 18** — toda a interface (componentes funcionais com hooks).
- **zustand** — usado exclusivamente para o tema (cor de destaque), com persistência em `localStorage` (`src/themeStore.ts`).
- **Web Audio API pura** — zero dependências de áudio. Todo o som (vozes, filtro, delay, bateria) é gerado por nós nativos do navegador.

A separação central do projeto:

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| Engine de áudio | `src/synth/engine.ts` | Classe `SynthEngine`: AudioContext, grafo de nós, vozes, drums, sequenciador. Sem React. |
| Orquestração | `src/synth/index.tsx` | Componente `SynthApp`: estado da UI, teclado físico, sincronização estado ↔ engine. |
| UI | `Keyboard.tsx`, `Sequencer.tsx`, `Visualizer.tsx`, `controls.tsx` | Componentes apresentacionais. |
| Shell | `src/App.tsx` | Cabeçalho, seletor de tema, monta o `SynthApp`. |

A engine é imperativa e independente do React; a UI conversa com ela por chamadas de método (`noteOn`, `setPattern`, `updateParams`...) e recebe de volta um único callback (`onStep`).

## 2. O grafo de áudio

Construído uma única vez em `SynthEngine.buildGraph()` (`engine.ts`), na primeira interação do usuário:

```
  Voz (até 16 simultâneas)
  ┌──────────────────────────────────────────┐
  │ osc1 ──► g1 (1 − osc2Mix) ──┐            │
  │                             ├──► env ────┼───► voiceBus (0.5)
  │ osc2 ──► g2 (osc2Mix) ──────┘   (ADSR)   │         │
  └──────────────────────────────────────────┘         ▼
                                              filter (lowpass, cutoff/Q)
                                                  │           │
                                                  │           ▼
                                                  │     delaySend (delayMix)
                                                  │           │
                                                  │           ▼
                                                  │     ┌── delay ◄─────────────┐
                                                  │     │ (delayTime)           │
                                                  │     │     └──► delayFeedback┘
                                                  │     │          (delayFeedback)
                                                  │     │
  kick / snare / hat ──► drumBus (0.9) ───┐       │     │
                                          ▼       ▼     ▼
                                       master (masterVolume)
                                          │
                                          ▼
                                       analyser (fftSize 2048)
                                          │
                                          ▼
                                       limiter (DynamicsCompressor)
                                          │
                                          ▼
                                       ctx.destination
```

Pontos relevantes:

- **`voiceBus` (ganho 0,5)** soma todas as vozes antes do filtro — o filtro e o delay são compartilhados, não por voz.
- O **delay é paralelo**: o sinal seco vai de `filter` direto a `master`; em paralela, `filter → delaySend → delay → master`. O nó `delaySend` controla quanto sinal entra no efeito ("Envio").
- O **loop de realimentação** é `delay → delayFeedback → delay`. O ganho de feedback é limitado a 0,85 pela UI, evitando auto-oscilação infinita.
- A **bateria tem barramento próprio** (`drumBus`, ganho 0,9) e não passa pelo filtro nem pelo delay — só as vozes do sintetizador são processadas.
- O **limiter** é um `DynamicsCompressorNode` agressivo (threshold −6 dB, ratio 8:1, attack 3 ms) usado como proteção contra clipping no final da cadeia.
- O **analyser fica antes do limiter** (`master → analyser → limiter → destination`): o visualizador mostra o sinal sem a compressão de segurança.

### Ativação do contexto

`ensureContext()` cria o `AudioContext` sob demanda e dá `resume()` se estiver suspenso. Navegadores exigem gesto do usuário para iniciar áudio; por isso o componente raiz chama `activateAudio` em `onPointerDownCapture` e antes de qualquer `noteOn`/`startSequencer`. Se a Web Audio API não existir ou a criação falhar, o método retorna `false` e a UI mostra a mensagem de erro.

### Mudança de parâmetros sem cliques

`updateParams()` nunca atribui valores diretamente nos `AudioParam`s do grafo; usa `setTargetAtTime` com constantes de tempo curtas (20 ms para filtro/ganhos, 50 ms para `delayTime`):

```ts
this.filter.frequency.setTargetAtTime(p.cutoff, now, 0.02)
this.delay.delayTime.setTargetAtTime(p.delayTime, now, 0.05)
```

Isso suaviza a transição e elimina o "zipper noise" ao arrastar sliders.

## 3. Sistema de vozes

### Polifonia e roubo de voz

As vozes ativas ficam em `voices: Voice[]`. O limite é `MAX_VOICES = 16`. Antes de criar uma voz, `stealOldestIfNeeded()` verifica o limite e, se atingido, encontra a voz mais antiga (menor `startedAt`) e a encerra com um fade rápido de 20 ms (`exponentialRampToValueAtTime` até 0,0001) — rápido o bastante para liberar a voz, suave o bastante para não estalar.

### Estrutura de uma voz

Cada nota dispara **dois osciladores** independentes:

- `osc1` e `osc2` na mesma frequência (`midiToFreq`, afinação padrão A4 = 440 Hz);
- `osc2` recebe `detune` em cents (−100 a +100), o que cria batimento/espessura;
- a mistura é feita por dois ganhos: `g1 = 1 − osc2Mix` e `g2 = osc2Mix`;
- ambos convergem em `env`, um `GainNode` que implementa o envelope.

### Envelope ADSR

O envelope é aplicado no ganho de `env`, partindo de 0:

```ts
env.gain.setValueAtTime(0, time)
env.gain.linearRampToValueAtTime(VOICE_PEAK, time + attack)          // A
env.gain.setTargetAtTime(sustainLevel, time + attack, decay / 3)     // D → S
```

- **Ataque**: rampa linear até `VOICE_PEAK = 0.4` (headroom para polifonia). Mínimo de 3 ms para evitar clique.
- **Decaimento/Sustentação**: `setTargetAtTime` faz uma aproximação exponencial assintótica até `sustain × VOICE_PEAK`. A constante de tempo é `decay / 3` — após ~3 constantes de tempo (ou seja, ~`decay` segundos) o valor está a ~95% do alvo, o que faz o slider de decaimento corresponder à percepção.
- **Liberação** (em `releaseVoice`, chamada por `noteOff`):

```ts
g.cancelScheduledValues(now)
g.setValueAtTime(Math.max(g.value, 0.0001), now)
g.exponentialRampToValueAtTime(0.0001, now + release)
```

  O `cancelScheduledValues` interrompe ataque/decaimento ainda em curso; o `setValueAtTime` ancora o valor atual (necessário porque rampa exponencial não parte de — nem chega a — zero, daí o piso 0,0001). Os osciladores são parados em `now + release + 0.1`.

### Notas agendadas (sequenciador)

Quando `startVoice` recebe `gateDur` (caso da trilha de baixo), o release é programado de forma determinística no futuro, sem depender de `noteOff`:

```ts
env.gain.setTargetAtTime(0.0001, offTime, release / 4)
osc1.stop(offTime + release + 0.15)
```

A voz já nasce marcada como `released`, então não é afetada por `releaseAll`/`noteOff`.

### Cleanup de nós

O encerramento usa `osc1.onended`: quando o oscilador para (por `stop()` agendado), a voz é removida do array e todos os nós (`osc1`, `osc2`, `g1`, `g2`, `env`) são desconectados dentro de `try/catch`. Não há vazamento: cada nota cria 5 nós e todos são desconectados ao fim do release.

## 4. Filtro e delay

### Filtro lowpass com mapeamento logarítmico

O filtro é um `BiquadFilterNode` tipo `lowpass` com `frequency` (corte) e `Q` (ressonância) expostos na UI. A percepção de altura é logarítmica, então o slider de corte não controla Hz diretamente — em `index.tsx` o valor normalizado `v ∈ [0,1]` é convertido por:

```ts
// 100 Hz × 120^v  →  100 Hz a 12 kHz
const CUTOFF_RATIO = 120
const CUTOFF_MIN = 100
normToCutoff(v) = CUTOFF_MIN * Math.pow(CUTOFF_RATIO, v)
cutoffToNorm(f) = Math.log(f / CUTOFF_MIN) / Math.log(CUTOFF_RATIO)
```

Assim, metade do curso do slider fica em ~1,1 kHz, e a região grave (onde o ouvido discrimina mais) ocupa a mesma área útil que a aguda. A engine armazena e aplica sempre o valor em Hz.

### Delay com feedback

`DelayNode` com buffer máximo de 1 s (`ctx.createDelay(1)`), tempo de 0 a 0,8 s pela UI. O eco repetido vem do loop `delay → delayFeedback (GainNode) → delay`: cada volta multiplica o sinal pelo ganho de feedback, gerando uma série geométrica de repetições decrescentes. Com feedback máximo de 0,85, o decaimento é longo mas sempre converge.

## 5. Percussão sintetizada (sem samples)

Os três timbres de bateria são gerados em tempo real (`engine.ts`):

### Bumbo (`playKick`) — queda de pitch

Um oscilador senoidal cuja frequência despenca exponencialmente — a clássica "queda de pitch" do kick analógico:

```ts
osc.frequency.setValueAtTime(150, time)
osc.frequency.exponentialRampToValueAtTime(40, time + 0.12)   // 150 → 40 Hz
gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35)    // decai em 350 ms
```

O transiente de 150 Hz dá o "click" de ataque; o corpo se assenta em 40 Hz.

### Ruído branco compartilhado

`getNoiseBuffer()` gera (uma única vez, com cache) um `AudioBuffer` mono de 0,5 s preenchido com `Math.random() * 2 − 1`. Caixa e chimbal reaproveitam esse buffer via `AudioBufferSourceNode` — fontes são descartáveis, o buffer não.

### Caixa e chimbal (`playNoiseHit`)

O mesmo helper parametrizado: ruído → filtro biquad → envelope de ganho exponencial → `drumBus`.

| Som | Filtro | Frequência | Pico | Decaimento |
|---|---|---|---|---|
| Caixa (`playSnare`) | bandpass (Q 0,9) | 1 800 Hz | 0,7 | 180 ms |
| Chimbal (`playHat`) | highpass (Q 0,7) | 7 500 Hz | 0,4 | 50 ms |

O bandpass em 1,8 kHz isola a região "crocante" da caixa; o highpass em 7,5 kHz com decaimento de 50 ms produz o "tss" curto do chimbal fechado. Como no kick, cada hit conecta seus nós, agenda `stop()` e se desconecta em `onended`.

## 6. Sequenciador: agendamento lookahead

O sequenciador tem 4 trilhas × 16 passos (semicolcheias). Trilhas 0–2 disparam bumbo/caixa/chimbal; a trilha 3 dispara uma voz do sintetizador em `BASS_MIDI = 36` (C2), com gate de 85% do passo — ou seja, o baixo usa o timbre atual do sintetizador.

### Por que `setInterval` ingênuo não funciona

A abordagem óbvia — `setInterval(tocarPasso, 60000 / bpm / 4)` — falha por dois motivos:

1. **Jitter**: callbacks de timer do JavaScript rodam na thread principal e atrasam dezenas de milissegundos sob carga (render do React, GC, etc.). O ouvido percebe desvios de poucos ms no groove.
2. **Throttling**: navegadores reduzem timers de abas em segundo plano para ≥1 s, destruindo o tempo por completo.

O relógio confiável é o do **AudioContext** (`ctx.currentTime`), que avança com precisão de amostra na thread de áudio — mas ele não dispara callbacks; só permite *agendar* eventos no futuro.

### A solução (padrão Chris Wilson, "A Tale of Two Clocks")

Combina os dois relógios: um timer impreciso serve apenas de **despertador**, e o agendamento real usa o relógio de áudio.

```ts
// startSequencer(): acorda a cada 25 ms
this.timer = window.setInterval(() => this.scheduler(), LOOKAHEAD_MS)

// scheduler(): agenda tudo que cai na janela dos próximos 120 ms
while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
  this.scheduleStep(this.currentStep, this.nextNoteTime)
  this.nextNoteTime += 60 / this.bpm / 4        // duração de uma semicolcheia
  this.currentStep = (this.currentStep + 1) % NUM_STEPS
}
```

- `LOOKAHEAD_MS = 25`: frequência do despertador.
- `SCHEDULE_AHEAD_S = 0.12`: janela de antecedência. Como 120 ms ≫ 25 ms, mesmo que o timer atrase alguns ciclos, os eventos já estão agendados com timestamps exatos (`osc.start(time)`, rampas com `time`). O timer pode tremer; o áudio, não.
- `nextNoteTime` acumula a partir do relógio de áudio, então não há deriva: mudanças de BPM afetam apenas os passos ainda não agendados.

### Sincronização do passo atual com a UI

Os passos são agendados *antes* de soarem; destacar a célula no momento do agendamento mostraria a UI adiantada em até 120 ms. `scheduleStep` resolve com um `setTimeout` casado com o horário audível:

```ts
const delayMs = Math.max(0, (time - ctx.currentTime) * 1000)
const handle = window.setTimeout(() => {
  this.stepTimeouts.delete(handle)
  if (this.onStep) this.onStep(step)
}, delayMs)
this.stepTimeouts.add(handle)
```

A precisão de timer basta para feedback visual (o olho tolera o que o ouvido não tolera). Os handles ficam em `stepTimeouts` para que `stopSequencer()` cancele callbacks pendentes; ao parar, `onStep(-1)` limpa o destaque na UI.

## 7. Visualizador

`Visualizer.tsx` é um osciloscópio: lê o domínio do tempo do `AnalyserNode` (fftSize 2048) e desenha num `<canvas>`.

- Loop de desenho com `requestAnimationFrame`; cancelado no cleanup do `useEffect`.
- `ResizeObserver` redimensiona o backing store do canvas respeitando `devicePixelRatio` (traço nítido em telas HiDPI).
- A cada frame: `analyser.getByteTimeDomainData(data)` preenche um `Uint8Array` (valores 0–255, com 128 = silêncio); cada amostra é normalizada para `v ∈ [−1, 1]` e mapeada à altura do canvas com margem de 0,9.
- O traço usa a cor de destaque do tema (via `accentRef`, atualizada sem reiniciar o efeito) com `shadowBlur` para o brilho.
- Antes do áudio ser ativado (`getAnalyser()` retorna `null`), desenha uma linha central neutra.

## 8. Componentes React e fluxo de estado

```
App.tsx ── tema (zustand + localStorage) ── define --accent no <html>
  └── SynthApp (synth/index.tsx)  ◄── dono do estado e da engine
        ├── engine: SynthEngine (useRef, criada uma única vez, dispose no unmount)
        ├── estado: params, pattern, bpm, playing, currentStep, pressed, audioReady
        ├── controls.tsx  → Card / Slider / WaveSelect (coluna esquerda)
        ├── Visualizer    → recebe a engine, lê o analyser
        ├── Sequencer     → apresentacional; callbacks (toggleCell, togglePlay, ...)
        └── Keyboard      → apresentacional; onNoteOn / onNoteOff
```

### Fluxo de estado (unidirecional, com ponte imperativa)

1. **UI → estado**: sliders, células e teclas chamam callbacks que fazem `setState` (`setParam`, `toggleCell`, `handleNoteOn`...).
2. **Estado → engine**: três `useEffect` espelham `params`, `pattern` e `bpm` na engine (`updateParams`, `setPattern`, `setBpm`). A engine nunca lê estado do React.
3. **Engine → estado**: único canal de volta é `engine.onStep`, que alimenta `currentStep` para o destaque do sequenciador.

Eventos imediatos (nota, transporte) chamam a engine diretamente no handler — sem esperar render — e atualizam o estado visual em paralelo (`pressed`, `playing`).

### Teclado físico

O listener de `keydown`/`keyup` fica em `window` (registrado uma vez; os handlers reais ficam em refs `noteOnRef`/`noteOffRef`/`togglePlayRef` para não recriar listeners a cada render). Guardas implementadas:

- **Layout-independente**: usa `e.code` (tecla física), não `e.key`.
- **Foco**: só reage se `document.activeElement` estiver dentro do componente.
- **Repeat**: `e.repeat` e um `Set` de teclas seguradas evitam retrigger do autorepeat.
- **Blur**: ao perder o foco da janela, todas as notas seguradas são liberadas (evita nota presa).
- **Espaço** alterna o transporte do sequenciador.

### Teclado visual (`Keyboard.tsx`)

Duas oitavas (C4–B5), geometria calculada em percentuais (14 teclas brancas; pretas com 62% da largura e 58% da altura, sobrepostas com `z-10`). Suporta **glissando**: `onPointerEnter` com o botão pressionado (`e.buttons & 1`) dispara a nota, e `onPointerLeave`/`onPointerUp` a solta; um `Set` em ref evita disparo duplo por ponteiro.

### Tema (`themeStore.ts`)

Store zustand mínimo: `accent` + `setAccent`, com leitura/gravação em `localStorage` (chave `synthstudio-theme-v1`) protegida por `try/catch`. `App.tsx` aplica a cor na variável CSS `--accent`, consumida por Tailwind (`bg-[var(--accent)]` etc.) em teclas, células, sliders e no visualizador.

## 9. Constantes de referência

| Constante | Valor | Onde | Papel |
|---|---|---|---|
| `MAX_VOICES` | 16 | engine.ts | Limite de polifonia |
| `VOICE_PEAK` | 0,4 | engine.ts | Pico do envelope (headroom) |
| `LOOKAHEAD_MS` | 25 | engine.ts | Intervalo do despertador do scheduler |
| `SCHEDULE_AHEAD_S` | 0,12 | engine.ts | Janela de agendamento antecipado |
| `NUM_STEPS` / `NUM_TRACKS` | 16 / 4 | engine.ts | Dimensões do padrão |
| `BASS_MIDI` | 36 (C2) | engine.ts | Nota da trilha de baixo |
| `CUTOFF_MIN` / `CUTOFF_RATIO` | 100 / 120 | index.tsx | Mapeamento log do corte (100 Hz–12 kHz) |
| `FIRST_MIDI` / `LAST_MIDI` | 60 / 83 | Keyboard.tsx | Extensão do teclado visual (C4–B5) |
