# Baseline — Stage 12 (domínio Comprador → `js/comprador.js`)

Quarta separação física, **script clássico**. Move as 11 funções do escopo +
`compradoresList`. Duas regiões (Visão Comprador + CRUD). Atenção especial à
integração com `js/alerts.js` via `compradoresList`.

Data: 2026-07-04.

## Identidade / contadores (antes)

| Métrica | Valor |
|---|---|
| SHA-256 `js/app.js` (antes) | `5d7ded9dfb4ddd0a590c49655c876ff42dea1c11d6d3091a4ab434aa2f855a13` |
| Matches `^function ` em `js/app.js` (antes) | 249 |
| Funções de Comprador a mover | 11 |
| Matches `^function ` esperados em `js/comprador.js` | 11 |
| Matches `^function ` esperados em `js/app.js` (depois) | 238 |
| Abas (`data-tab`) | 14 |

## Funções do domínio Comprador que SERÃO movidas (escopo)

**Visão Comprador** (faixas 2360–2372, 2374–2392, 2394–2422):
`populateCompradorFilterOptions`, `passesCompradorVisFilters`,
`clearCompradorFilters`, `renderCompradorVis`.

**CRUD** (faixa contígua 3268–3362): `compradoresList` (let), `loadCompradores`,
`renderCompradores`, `openModalNovoComprador`, `editComprador`, `salvarComprador`,
`toggleComprador`, `excluirComprador`.

## Funções relacionadas que PERMANECEM em `js/app.js` (fora do escopo)

| Fica em app.js | Motivo |
|---|---|
| `ensureCompradorFilterPanel` (…–2359) | monta o painel de filtros; **não** está no escopo; chama `populateCompradorFilterOptions` em runtime |
| `cvVal` (2373) | helper de leitura de input; usado por várias funções |
| `getCompradorVisData` (2393) | helper; chama `passesCompradorVisFilters` em runtime |
| `fmtBRL` (3367), `AN_SORT` (3369) | utilitário/analytics, após a região CRUD |

## Variável `compradoresList` (integração com Alertas)

- `let compradoresList = []` — **reatribuída** em `loadCompradores` (3273/3277/
  3280) e **mutada** (push/splice/index) em salvar/toggle/excluir.
- **Lida por `js/alerts.js`** (`gerarScriptAlertas`, linha 20:
  `compradoresList.filter(...)`).
- `js/alerts.js` carrega **antes** de `js/comprador.js`, mas só acessa
  `compradoresList` em **runtime** (ao gerar o script). Em script **clássico**, o
  `let` global fica no **escopo léxico global compartilhado** e pode ser
  **reatribuído** — todos os scripts veem o valor atual. ✅ (Diferente de ESM,
  onde a importação seria somente-leitura.)

## Quem chama as funções de Comprador

| Chamador | Local | Runtime? |
|---|---|---|
| `switchTab` → `renderCompradorVis`, `loadCompradores` | app.js:1841/1842 | ✅ |
| aba Alertas → `loadCompradores().then(gerarScriptAlertas)` | app.js:1852 | ✅ |
| `applyFilters`/recarga → `renderCompradorVis` | app.js:1028/1929 | ✅ |
| `ensureCompradorFilterPanel` (fica) → `populateCompradorFilterOptions` | app.js:2358 | ✅ |
| `getCompradorVisData` (fica) → `passesCompradorVisFilters` | app.js:2393 | ✅ |
| handlers inline (painel gerado + `onclick="openModalNovoComprador()"`) | app.js/innerHTML + index.html:426 | ✅ |
| compat layer (`CarmaisApp.comprador`, `CarmaisHandlers`) | app.js | ✅ |

## Funções que precisam estar em `window`

Handlers inline/innerHTML: `renderCompradorVis`, `populateCompradorFilterOptions`,
`clearCompradorFilters`, `openModalNovoComprador`, `editComprador`,
`toggleComprador`, `excluirComprador`. Em script clássico, `function` no topo de
`comprador.js` já vira `window.*` automaticamente.

## Handlers inline relacionados (`index.html`)

- `onclick="openModalNovoComprador()"` (index.html:426)
- Demais (`renderCompradorVis`, `clearCompradorFilters`, `populateCompradorFilterOptions`,
  `editComprador`, `toggleComprador`, `excluirComprador`) são gerados via
  `innerHTML` (painel de filtros e tabela de compradores).

## Ordem de carregamento

`comprador.js` **antes** de `app.js` e **depois** de `alerts.js`:
```html
<script src="js/history.js"></script>
<script src="js/alerts.js"></script>
<script src="js/users.js"></script>
<script src="js/comprador.js"></script>
<script src="js/app.js"></script>
```
Só declara; dependências (`STATE`, `callAPI`, `SESSION`, `showToast`, `escHtml`,
`fillDL`, `cvVal`, `getCompradorVisData`, `ensureCompradorFilterPanel`,
`inRange`, `getCompraDate`, `fmtDate`, `setText`, `saveJsonLocal`,
`loadJsonLocal`, `closeModal`, `normHdrEmpresa`) acessadas em runtime.

## Resultado esperado

- `js/app.js`: 249 → 238 matches `^function `; funções do escopo removidas;
  helpers permanecem; 2 pointer comments.
- `js/comprador.js`: 11 funções + `compradoresList`; código idêntico ao original.
- `index.html`: só a inclusão de `<script src="js/comprador.js">`.
- `window.*` das funções acessível; `compradoresList` acessível a `alerts.js`;
  `CarmaisApp.comprador`/`CarmaisHandlers` completos; **Alertas funcionam**; 14
  abas; `css` intacto.
