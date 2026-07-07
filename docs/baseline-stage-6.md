# Baseline & Auditoria — Stage 6 (micro-sprint: multi-selects)

Auditoria dos dois sistemas de multi-select antes de qualquer alteração.
Escopo restrito às funções de multi-select e aos labels. Filtragem **não** será
alterada.

Data: 2026-07-04.

## SHA e contadores (antes)

| Métrica | Valor |
|---|---|
| SHA-256 `js/app.js` | `e67769e265bdc7bd776c408acd0d2a998bb26b773ff783a20792ddf014168c69` |
| Funções nomeadas | 268 |

## Os dois sistemas (paralelos)

### Sistema A — DASHBOARD (`.multi-select`)
- **HTML:** `index.html` linhas 225–249. Três multi-selects, containers
  `id="ms-empresa"`, `id="ms-vendedor"`, `id="ms-precificador"`.
- **IDs derivados:** trigger `.multi-select-trigger`; dropdown `<id>-dd`; opções
  `<id>-opts`; **label `<id>-label`** (ex.: `ms-empresa-label`).
- **Estado:** `STATE.msSelected['ms-empresa'|'ms-vendedor'|'ms-precificador']`
  (arrays).
- **Funções:** `toggleMultiSelect(id)` (abre/fecha), `filterMsOptions(id,search)`
  (busca), `buildMs(id,values,label)` (popula opções + label),
  `toggleMsOpt(id,val,el)` (marca/desmarca → `applyFilters()`),
  `syncVendedoresByEmpresa()` (vendedores dependem da empresa).
- **Dispara filtro:** `toggleMsOpt` → `applyFilters()` (Dashboard).
- **Fecha ao clicar fora:** `closeAllMultiSelects()` (listener global de clique,
  registrado no bloco INIT).

### Sistema B — ANALYTICS (`.ms-wrap`)
- **HTML:** `index.html` linhas 520–526. **Um** multi-select, id lógico
  `empresa`.
- **IDs derivados:** wrapper `ms-empresa-wrap`; botão `ms-empresa-btn`; dropdown
  `ms-empresa-drop`; busca `ms-empresa-search`; lista `ms-empresa-list`;
  **label `ms-empresa-label`** (computado como `'ms-'+id+'-label'`).
- **Estado:** `MS_STATE['empresa']` (Set) + `MS_OPTIONS['empresa']`.
- **Funções:** `toggleMsDropdown(id)` (abre/fecha + listener `close` local),
  `populateMsDropdown(id,options)` (popula), `onMsCbChange`/`toggleMsItem`
  (marca → `renderAnalytics()`), `getMsSelected(id)`, `clearMsSelected(id)`,
  `filterMsItems(id,search)`, `updateMsLabel(id)`.
- **Dispara filtro:** `onMsCbChange` → `renderAnalytics()` (Analytics).
- **Fecha ao clicar fora:** listener local `close` criado em `toggleMsDropdown`
  (auto-removido); **não** usa `closeAllMultiSelects` (separado do Dashboard).

## Função de label (`updateMsLabel`) — estado atual

Após a Sprint 4 existe **uma** definição: `updateMsLabel(id)` (versão Analytics,
`js/app.js:3548`):
```js
function updateMsLabel(id) {
  const sel = getMsSelected(id);
  const label = document.getElementById('ms-'+id+'-label');
  if (!label) return;
  label.textContent = sel.length === 0 ? 'Todas' : sel.length === 1 ? sel[0] : `${sel.length} lojas selecionadas`;
}
```
As chamadas do **Dashboard** (`buildMs`→`updateMsLabel(id,label)`,
`toggleMsOpt`→`updateMsLabel(id,{...}[id])`) usam essa mesma função.

## PROBLEMA REAL ENCONTRADO

### (1) ID duplicado no DOM: `ms-empresa-label`
- `index.html:226` (Dashboard): `<span id="ms-empresa-label">Todas</span>`
- `index.html:521` (Analytics): `<span id="ms-empresa-label">Todas</span>`

HTML inválido (id repetido). `getElementById('ms-empresa-label')` retorna o
**primeiro** em ordem de documento → **linha 226 (Dashboard)**.

### (2) Label do Analytics escreve no elemento errado
`updateMsLabel('empresa')` → `getElementById('ms-empresa-label')` → devolve o
span do **Dashboard** (226). Resultado: ao mexer no filtro de loja da Analytics,
o texto atualizado aparece no **rótulo do Dashboard**, e o rótulo real da
Analytics (521) nunca muda. **Contaminação cruzada.**

### (3) Labels do Dashboard nunca atualizam
As chamadas do Dashboard passam ids já prefixados (`ms-empresa`), mas a função
ativa faz `'ms-'+id+'-label'` → `ms-ms-empresa-label` → inexistente → no-op. Os
três rótulos do Dashboard (`ms-empresa`/`ms-vendedor`/`ms-precificador`) ficam
presos no texto estático.

> **Importante:** a **filtragem funciona** nos dois sistemas — o bug é apenas de
> exibição do rótulo. Esse comportamento é anterior à Sprint 4 (as duas versões
> de `updateMsLabel` já se anulavam por *hoisting* desde sempre).

## CORREÇÃO PROPOSTA (menor alteração possível)

Objetivo: cada rótulo passa a atualizar o **seu próprio** elemento, sem tocar em
nenhuma lógica de filtro.

1. **Analytics (JS):** trocar o alvo de `updateMsLabel` de `'ms-'+id+'-label'`
   para `'ms-'+id+'-anlabel'` (1 linha).
2. **Analytics (HTML, linha 521):** renomear o span de `id="ms-empresa-label"`
   para `id="ms-empresa-anlabel"` — elimina o id duplicado (justificativa
   permitida pelo escopo). Os demais ids do Analytics (`-wrap/-btn/-drop/-list/
   -search`) permanecem.
3. **Dashboard (JS):** adicionar `updateMsLabelDash(id,def)` que atualiza o
   elemento correto `id+'-label'` com o texto original do Dashboard
   (vazio→def; 1→`sel[0].substring(0,20)`; +→`N selecionados`).
4. **Dashboard (JS):** apontar as duas chamadas (`buildMs`, `toggleMsOpt`) para
   `updateMsLabelDash`.

Após (1)+(2), o único `ms-empresa-label` restante é o do Dashboard (226), então
`updateMsLabelDash` o atualiza corretamente; e a Analytics passa a atualizar seu
próprio `ms-empresa-anlabel` (521).

### Arquivos e linhas afetadas
- `js/app.js`: `updateMsLabel` (target), novo `updateMsLabelDash`, 2 chamadas em
  `buildMs`/`toggleMsOpt`.
- `index.html`: 1 atributo `id` na linha 521 (justificado — id duplicado).
- `css/styles.css`: **nenhuma** alteração (o CSS mira classes, não esses ids).

## Contadores esperados após a correção

| Métrica | Esperado |
|---|---|
| Funções nomeadas | 269 (+1: `updateMsLabelDash`) |
| id `ms-empresa-label` no DOM | 1 (só Dashboard, linha 226) |
| id `ms-empresa-anlabel` no DOM | 1 (Analytics, linha 521) |
| Parse `node --check` | sem erros |
| Filtros Dashboard/Analytics | inalterados |
| Fechar dropdown ao clicar fora | inalterado |
| 14 abas | presentes |
