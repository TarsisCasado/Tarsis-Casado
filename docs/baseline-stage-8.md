# Baseline — Stage 8 (andaime de compatibilidade `window`)

Estado **antes** de adicionar a *Window Compatibility Layer* ao final de
`js/app.js`. Alteração puramente **aditiva**: nenhuma função existente é movida,
renomeada, encapsulada ou removida; nenhum uso interno é substituído. O modelo de
carregamento continua **script clássico** (sem `type="module"`).

Data: 2026-07-04.

## Identidade / contadores

| Métrica | Valor |
|---|---|
| SHA-256 `js/app.js` (antes) | `894018f97f2eaa4c472fa899a547fb1b974a10f5e510bdd255ae58694464f5da` |
| `BUILD_TAG` | `2026-07-03c · inclusão manual salva no banco (Sheets) + sincronizar` |
| Abas (`data-tab`) | 14 |
| Funções nomeadas | 269 |

## Handlers inline no `index.html`

| Handler | Ocorrências |
|---|---|
| `onclick` | 130 |
| `onchange` | 20 |
| `oninput` | 18 |
| `onkeydown` | 3 |
| `ondragover` | 3 |
| `ondrop` | 3 |
| `ondragleave` | 3 |

## Funções críticas (devem continuar globais)

`doLogin`, `switchTab`, `renderDashboard`, `applyFilters`, `renderAnalytics`,
`crossJoin`, `sendAIMessage`, `exportPDF`.

## Objetos/constantes globais reais

| Global | Tipo | Obs. |
|---|---|---|
| `STATE` | `const` obj | núcleo (não reatribuído) |
| `SESSION` | `let` obj | reatribuído em `doLogin`/`doLogout` |
| `API_URL` | `let` string | reatribuído em `saveApiUrl`/`resetApiUrlToDefault` |
| `CHARTS` | `const` obj | instâncias Chart.js |
| `MS_STATE` / `MS_OPTIONS` | `const` obj | multi-select analytics |
| `AI_HISTORY` | `const` array | histórico IA |
| `CAMPOS` | `const` obj | mapa de campos |
| `compradoresList` | `let` array | CRUD comprador |
| `AN_SORT` | `const` obj | ordenação analytics |
| `BUILD_TAG`, `DEFAULT_API_URL`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`, `PROMPT_COPILOTO_CARMAIS`, `LOCAL_KEYS`, `DATA_CACHE_KEY`, `IMPORT_MODE`, `ABAS_USUARIO`, `usuariosListCache`, `historicoData` | consts/lets | ver plano |

## 81 funções dependentes de `window` (handlers inline HTML + innerHTML JS)

Todas confirmadas como funções **reais** definidas em `js/app.js`. Regeneráveis
pelo grep documentado em `docs/modularization-plan.md` §3.

```
applyFilters clearAIChat clearAnalyticsFilters clearAvaliacoesInput
clearCompradorFilters clearCompradosInput clearFilters closeModal
copyAlertScript doLogin doLogout editComprador editUsuario excluirComprador
excluirInclusaoManual exportAnalyticsImage exportAnalyticsPDF exportExcel
exportJPEG exportPDF exportarDiagnostico filterMsItems filterMsOptions
filtrarPorMarca handleDrag handleDrop hardReloadApp importFromGoogleSheets
incluirOrfaoManualmente limparInclusaoManual loadAvaliacoes loadComprados
loadDataFromSheets loadEquipes loadHistorico onImLojaChange onImVendedorChange
onMsCbChange onPerfilChange openModalNovoComprador openModalNovoUsuario
perguntaRapidaIA populateCompradorFilterOptions rastrearPlacas removeDrag
renderAnalytics renderCompradorVis renderDetailCompradosTable renderDetailTable
renderHistorico resetApiUrlToDefault salvarComprador salvarConfigAlertas
salvarInclusaoManual salvarPlacaOrfao salvarUsuario saveApiUrl saveGeminiKey
saveGeminiKeyQuiet saveGeminiModel sendAIMessage setDedupAvaliacoes
sincronizarInclusoesManuais sortAnalyticsTable sortDetail switchTab
syncLojasAllCheckbox testConnection toggleAllLojas toggleAnSection
toggleComprador toggleMsDropdown toggleMsOpt toggleMultiSelect toggleTheme
toggleUsuario triggerAvaliacoesImport triggerCompradosImport updateBuyerField
updateRecordVendorLoja viewFilteredInDetail
```

## O que a camada vai adicionar (aditivo, no fim do arquivo)

1. `window.CarmaisHandlers` — objeto explícito com as **81** funções acima
   (referências às funções globais já existentes; documenta a dependência de
   `window`).
2. `window.CarmaisApp` — namespaces lógicos (`version`, `state`, `session`,
   `config`, `api`, `auth`, `pipeline`, `dashboard`, `charts`, `filters`,
   `analytics`, `tables`, `comprador`, `exports`, `ia`, `users`, `history`,
   `alerts`, `uploads`, `theme`, `utils`). `state`/`session`/`config` via
   **getter** (refletem o valor vivo, já que `SESSION`/`API_URL` são
   reatribuídos).

Nenhuma função existente muda; nenhum uso interno passa a usar `CarmaisApp`.

## Resultado esperado

- `node --check` limpo; `window.CarmaisApp` e `window.CarmaisHandlers` existem;
  81 funções acessíveis em `window`; 14 abas; `index.html`/CSS intactos.
