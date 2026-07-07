# Baseline — Stage 9 (piloto: domínio Histórico → `js/history.js`)

Primeira separação **física** de um domínio para arquivo próprio, mantendo
**script clássico** (sem `type="module"`, sem `import/export`). Extração literal
das funções do Histórico; nenhuma lógica, nome ou chamada interna alterada.

Data: 2026-07-04.

## Identidade / contadores (antes)

| Métrica | Valor |
|---|---|
| SHA-256 `js/app.js` (antes) | `794a001b4a33996d45a1cdbb460db97d7fe8b4b8a0c4005b8f7322ca41d5a193` |
| Funções em `js/app.js` (antes) | 268 |
| Funções esperadas em `js/history.js` | 2 (`loadHistorico`, `renderHistorico`) |
| Funções em `js/app.js` (depois, esperado) | 266 |
| Abas (`data-tab`) | 14 |

## Domínio Histórico (em `js/app.js`, linhas 1263–1285)

| Item | Linha | Tipo |
|---|---|---|
| `let historicoData=[];` | 1266 | variável local do domínio |
| `async function loadHistorico()` | 1267–1271 | função |
| `function renderHistorico()` | 1272–1285 | função |

## Variáveis usadas pelo Histórico

- **`historicoData`** (`let`): usada **somente** dentro do domínio (decl. 1266,
  atribuição em `loadHistorico` 1269, leitura em `renderHistorico` 1274).
  Nenhuma referência fora do domínio → move junto.
- **Dependências externas** (permanecem em `app.js`, chamadas em runtime):
  `showLoading`, `hideLoading`, `callAPI`, `SESSION`, `showToast`, `escHtml`.

## Quem chama as funções do Histórico

| Chamador | Local | Observação |
|---|---|---|
| `switchTab` (`if(name==='historico')loadHistorico();`) | `js/app.js:1946` | permanece em `app.js`; chama o global em runtime |
| `loadHistorico` → `renderHistorico` | interno | ambos no mesmo arquivo após a mudança |
| `oninput="renderHistorico()"` | `index.html:488` | handler inline (busca) |
| `onclick="loadHistorico()"` | `index.html:489` | handler inline (botão Atualizar) |
| `window.CarmaisHandlers` | `js/app.js` (compat) | referência `loadHistorico` |
| `window.CarmaisApp.history` | `js/app.js` (compat) | `loadHistorico`, `renderHistorico` |

## Funções do Histórico que precisam estar em `window`

- `loadHistorico` e `renderHistorico` — usadas por handlers inline. Em script
  **clássico**, `function` no topo do arquivo vira `window.*` **automaticamente**,
  inclusive a partir de `history.js`. Nenhuma atribuição explícita necessária.

## Handlers inline relacionados ao Histórico (`index.html`)

- `oninput="renderHistorico()"` (linha 488)
- `onclick="loadHistorico()"` (linha 489)

## Ordem de carregamento

`history.js` será incluído **antes** de `app.js`:
```html
<script src="js/history.js"></script>
<script src="js/app.js"></script>
```
- `history.js` **só declara** (`let historicoData=[]` + 2 funções) — nenhuma
  execução de lógica no load.
- As dependências (`callAPI`, `SESSION`, `showLoading`, etc., definidas em
  `app.js`) são acessadas **em runtime** (quando o usuário abre a aba/clica), já
  com `app.js` carregado. ✅
- O compat layer (fim de `app.js`) referencia `loadHistorico`/`renderHistorico`:
  no momento em que executa, `history.js` já os declarou como globais. ✅

## Resultado esperado

- `js/app.js`: 266 funções (−2); bloco Histórico substituído por comentário
  ponteiro.
- `js/history.js`: 2 funções + `historicoData`; SHA do bloco copiado idêntico ao
  original.
- `index.html`: **só** a inclusão de `<script src="js/history.js">` antes de
  `app.js`.
- `window.loadHistorico`/`renderHistorico` acessíveis; `CarmaisApp.history` e
  `CarmaisHandlers` completos; 14 abas; `css` intacto.
