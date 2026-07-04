# Baseline de Regressão — Stage 5 (Sprint 4: limpeza de duplicações)

Estado **antes** da limpeza cirúrgica de duplicações/resíduos em `js/app.js`.
Escopo restrito aos 5 pontos autorizados. Nenhuma regra de negócio, fluxo, API,
IA, filtro, dashboard, tabela, CSS ou HTML alterado.

Data: 2026-07-04.

## SHA e contadores gerais

| Métrica | Valor (antes) |
|---|---|
| SHA-256 `js/app.js` | `5280ee6e056b33ea7bcf776175447fb54f04eede5ed9a3325eea49d2251a1f43` |
| Funções nomeadas | **269** |
| Linhas `js/app.js` | 4426 |

## Pontos de duplicação/resíduo (com localização)

### 1. `updateMsLabel` — 2 definições
- **Linha 2079:** `function updateMsLabel(id,def){` — versão do multi-select do
  **Dashboard** (ids `ms-empresa`/`ms-vendedor`/`ms-precificador`; label
  `id+'-label'`; lê `STATE.msSelected[id]`).
- **Linha 3559:** `function updateMsLabel(id) {` — versão do multi-select da
  **Análise Avançada** (ids curtos como `loja`; label `'ms-'+id+'-label'`; lê
  `getMsSelected(id)` → `MS_STATE[id]`).
- **Fato comprovado:** por serem duas *function declarations* no mesmo escopo
  global, a **última (3559) sobrescreve a primeira (2079)** em runtime. A versão
  2079 é **código morto** — nunca executa. Chamadas: 2068, 2075 (dashboard) e
  3529, 3537, 3544, 3556 (analytics) — todas resolvem para a 3559.
- **Ação:** remover a definição morta (linhas 2079–2082). No-op de runtime.

### 2. `DOMContentLoaded` — 2 registros
- **Linha 13:** define `build-tag`.
- **Linha 4421 (INIT):** `loadSavedApiUrl()`, `loadSavedGeminiKey()`,
  registro de `click→closeAllMultiSelects`, `stopPropagation` nos dropdowns.
- **Ação:** consolidar em 1 listener no bloco INIT, preservando a ordem de
  execução (build-tag primeiro, depois init).

### 3. `document.addEventListener('click', closeAllMultiSelects)` — 2 registros
- **Linha 334:** dentro de `openDashboard()` (a cada login).
- **Linha 4424:** dentro do `DOMContentLoaded` de INIT (no load).
- **Linha 3511:** listener `close` **local** de outro dropdown (analytics) — **NÃO
  é o mesmo** e não será tocado.
- **Fato:** `addEventListener` deduplica registros idênticos (mesmo tipo, mesma
  referência de função, mesma fase) → só há **1 listener efetivo**. Antes do
  login não há multi-selects visíveis.
- **Ação:** remover o registro redundante em `openDashboard()` (linha 334); o de
  INIT permanece. No-op observável.

### 4. Resíduo legado `carmais_claude_key`
- **Linhas 2862 e 2875:** `localStorage.removeItem('carmais_claude_key')`.
- **Fato:** a chave **nunca** é lida nem escrita (só `removeItem`). Integração
  Claude foi removida no passado. Sem efeito funcional.
- **Ação:** remover as duas linhas de `removeItem`.

### 5. Alias redundante de prompt
- **Linha 2855:** `const COPILOTO_CARMAIS_PROMPT = PROMPT_COPILOTO_CARMAIS;`
  (+ comentário na 2854).
- **Uso único:** linha 3225 (`text: COPILOTO_CARMAIS_PROMPT`).
- **Ação:** trocar o uso em 3225 por `PROMPT_COPILOTO_CARMAIS` e remover o alias
  (2854–2855). Mesmo valor de string → payload idêntico.

## Contadores específicos (antes)

| Item | Ocorrências |
|---|---|
| `updateMsLabel` (defs) | 2 (linhas 2079, 3559) |
| `DOMContentLoaded` | 2 (linhas 13, 4421) |
| `document.addEventListener('click'` | 3 (334, 3511, 4424) — só 334/4424 são closeAllMultiSelects |
| `closeAllMultiSelects` (def) | 1 (2063); registros: 334, 4424; uso interno: 2060 |
| `carmais_claude_key` | 2 (2862, 2875) |
| alias `COPILOTO_CARMAIS_PROMPT` | 1 def (2855) + 1 uso (3225) |

## Resultado esperado após a Sprint 4

| Métrica | Esperado |
|---|---|
| Funções nomeadas | **268** (−1: remoção da `updateMsLabel` morta) |
| `updateMsLabel` defs | 1 (só a 3559) |
| `DOMContentLoaded` | 1 |
| `closeAllMultiSelects` registros | 1 |
| `carmais_claude_key` | 0 |
| alias `COPILOTO_CARMAIS_PROMPT` | 0 (uso trocado por `PROMPT_COPILOTO_CARMAIS`) |
| Parse (`node --check`) | sem erros |
| Funções críticas globais | mantidas (`doLogin`, `switchTab`, `renderDashboard`, `crossJoin`, `sendAIMessage`, `exportPDF`) |
| `index.html`, CSS, libs CDN, 14 abas, handlers inline | inalterados |
