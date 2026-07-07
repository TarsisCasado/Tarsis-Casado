# Baseline — Stage 10 (domínio Alertas → `js/alerts.js`)

Segunda separação física de domínio, mantendo **script clássico** (sem
`type="module"`/`import`/`export`). Extração literal das 3 funções de Alertas.

Data: 2026-07-04.

## Identidade / contadores (antes)

| Métrica | Valor |
|---|---|
| SHA-256 `js/app.js` (antes) | `0a417764efc343bdae3e87824674d3f09ff808d9b9653bccdb097d8d156b8020` |
| Matches `^function ` em `js/app.js` (antes) | 266 |
| Funções **reais** de Alertas a mover | 3 |
| Matches `^function ` esperados em `js/alerts.js` | 6 (3 reais + 3 **dentro do template**) |
| Matches `^function ` esperados em `js/app.js` (depois) | 260 |
| Abas (`data-tab`) | 14 |

> ⚠️ **Nota de contagem:** `gerarScriptAlertas` gera, dentro de uma *template
> string*, um código Apps Script com `function checkNewAvaliacoes`,
> `getCompradoresPorLoja` e `enviarAlerta` no início de linha. O `grep` conta
> essas 3 como se fossem funções, mas são **texto** (não são funções reais de
> `app.js`). Por isso a seção soma 6 matches para 3 funções reais.

## Domínio Alertas (em `js/app.js`, linhas 4299–4398)

| Função (real) | Linha | Papel |
|---|---|---|
| `salvarConfigAlertas()` | 4301 | lê config do form, salva em localStorage, chama `gerarScriptAlertas`, toast |
| `gerarScriptAlertas(config)` | 4308–4392 | monta a *string* do script Apps Script (usa `compradoresList`), preenche preview, seta `window._alertScript` |
| `copyAlertScript()` | 4394–4398 | copia `window._alertScript` para o clipboard |

## Variáveis usadas por Alertas

- **`window._alertScript`** — propriedade de `window` (set em `gerarScriptAlertas`,
  lida em `copyAlertScript`) → funciona entre arquivos naturalmente.
- **`localStorage['carmais_alert_config']`** — escrita em `salvarConfigAlertas`
  (4303); **lida** em `switchTab` (`js/app.js:1935`) ao abrir a aba. A leitura
  permanece em `app.js` e não depende das funções movidas.
- **Dependências externas** (permanecem em `app.js`, acessadas em runtime):
  `compradoresList` (global do domínio Comprador), `showToast`, DOM,
  `navigator.clipboard`.

## Quem chama as funções de Alertas

| Chamador | Local | Observação |
|---|---|---|
| `switchTab` → `gerarScriptAlertas(...)` | `js/app.js:1939` | permanece em `app.js`; chama o global em runtime |
| `salvarConfigAlertas` → `gerarScriptAlertas` | interno | ambos em `alerts.js` após a mudança |
| `onclick="salvarConfigAlertas()"` | `index.html:858, 877` | handlers inline |
| `onclick="copyAlertScript()"` | `index.html:876` | handler inline |
| `window.CarmaisHandlers` | compat (`app.js`) | `salvarConfigAlertas`, `copyAlertScript` |
| `window.CarmaisApp.alerts` | compat (`app.js`) | as 3 |

## Funções de Alertas que precisam estar em `window`

- `salvarConfigAlertas`, `copyAlertScript` (handlers inline) e `gerarScriptAlertas`
  (chamada por `switchTab` + compat). Em script **clássico**, `function` no topo
  de `alerts.js` já vira `window.*` automaticamente.

## Handlers inline relacionados a Alertas (`index.html`)

- `onclick="salvarConfigAlertas()"` (linhas 858 e 877)
- `onclick="copyAlertScript()"` (linha 876)

## Ordem de carregamento

`alerts.js` incluído **antes** de `app.js`:
```html
<script src="js/history.js"></script>
<script src="js/alerts.js"></script>
<script src="js/app.js"></script>
```
- `alerts.js` **só declara** (sem execução no load).
- `compradoresList`, `showToast`, DOM acessados em runtime (com `app.js` já
  carregado). ✅
- Compat layer (fim de `app.js`) referencia as 3 → já declaradas por `alerts.js`
  quando executa. ✅

## Resultado esperado

- `js/app.js`: matches `^function ` 266 → 260; seção Alertas vira comentário
  ponteiro.
- `js/alerts.js`: 3 funções reais (6 matches por causa do template); código
  idêntico ao original.
- `index.html`: só a inclusão de `<script src="js/alerts.js">` antes de `app.js`.
- `window.salvarConfigAlertas`/`gerarScriptAlertas`/`copyAlertScript` acessíveis;
  `CarmaisApp.alerts` e `CarmaisHandlers` completos; 14 abas; `css` intacto.
