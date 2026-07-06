# Plano Técnico de Modularização — `js/app.js`

Documento de **planejamento** (Sprint 5 do `ROADMAP.md`). Descreve como quebrar
`js/app.js` em módulos **sem perder compatibilidade** com os handlers inline do
HTML nem com o estado global.

> **Histórico do documento:** a versão original (Stage 7) foi escrita antes de
> qualquer extração, com `js/app.js` monolítico (4432 linhas, 269 funções). As
> seções 1–7 abaixo são esse plano inicial — preservadas para referência
> histórica. A **seção 8 (Stage 14 — replanejamento)** substitui a sequência de
> extração original com base no **estado real do código após 5 extrações**.
> **Para decidir o próximo passo, use a seção 8, não as seções 1–7.**

---

## 0. Restrição arquitetural que domina todo o plano

O HTML usa **handlers inline** (`onclick="doLogin()"`) e o JS gera **mais
handlers dentro de strings `innerHTML`** (`onclick="editComprador(${idx})"`).
Handlers inline são avaliados no **escopo global** — só enxergam funções que
sejam propriedades de `window`.

Hoje isso "funciona de graça" porque `js/app.js` é um **script clássico**: toda
`function foo(){}` no topo vira `window.foo` automaticamente.

**Um ES Module tem escopo próprio**: `function foo(){}` num `.js` com
`import/export` **não** vira `window.foo`. Portanto, ao modularizar, toda função
referenciada por handler inline precisa ser **reexposta explicitamente** em
`window`, ou os botões/inputs param de responder silenciosamente (sem erro de
parse — falha só no clique).

Igualmente, `STATE`, `SESSION`, `API_URL`, `CHARTS` etc. são **globais
compartilhados** por dezenas de funções e precisam permanecer **singletons
únicos** entre os módulos.

> **Consequência:** a modularização é de **médio-alto risco** e o critério nº 1
> de aceite é sempre "os handlers inline continuam disparando".

---

## 1. Domínios lógicos atuais (na ordem do arquivo)

O próprio autor já separou o arquivo por comentários `// ==== NOME ====`. Os
domínios e suas faixas de linha aproximadas:

| # | Domínio | Faixa aprox. | Núcleo |
|---|---|---|---|
| 1 | **Config & Build** | 1–81 | `BUILD_TAG`, `DEFAULT_API_URL`, `API_URL`, `SESSION`, helpers de URL da API |
| 2 | **API** | 82–270 | `callAPI`, `callAPISingle`, `callAPIChunked`, `fetchWithTimeout`, `timeoutParaAcao`, `setCloud`, `testConnection` |
| 3 | **Auth/Login & Permissões** | 271–387 | `doLogin`, `doLogout`, `openDashboard`, `aplicarPermissoesUsuario`, `aplicarAbasUI`, `restringirDadosPorLoja`, `isMaster`, cache local de apoio |
| 4 | **Pipeline de carga** | 465–718 | `loadDataFromSheets`, `normalizeAvFromSheets`, `showDiagnostico`, `exportarDiagnostico` |
| 5 | **Uploads / Import** | 719–943 | `triggerAvaliacoesImport`, `loadAvaliacoes/Equipes/Comprados`, `handleDrag/Drop`, `processFile`, `sendAvaliacoes/Equipes/Comprados`, helpers de leitura de planilha |
| 6 | **Edição de campos (Sheets)** | 944–1103 | `updateBuyerField`, `persistBuyerField`, `updateRecordVendorLoja`, `editVendedorCell`, `editLojaCell` |
| 7 | **STATE** | 1104–1113 | `STATE`, `CHARTS` |
| 8 | **Usuários** | 1114–1263 | `loadUsuarios`, `salvarUsuario`, `renderUsuarios`, `getUserPerms`/`setUserPerms`, `buildAbasCheckboxes`, `buildLojasCheckboxes`, `toggleUsuario`, `onPerfilChange`, `syncLojasAllCheckbox`, `toggleAllLojas` |
| 9 | **Histórico** | 1264–1287 | `loadHistorico`, `renderHistorico` |
| 10 | **Utils (data/número/normalização)** | 1288–1470 | `parseDate`, `fmtDate`, `parseNumBR`, `escHtml`, `normPlaca`, `normChassi`, `dedup*`, `compraKey`, `empresaSimilarity` |
| 11 | **Pipeline de cruzamento** | 1471–1663 | `crossJoin`, `computeOrfaos`, `recomputeComprado` |
| 12 | **Inclusão manual** | 1664–1932 | `salvarInclusaoManual`, `renderInclusaoManual*`, `sincronizarInclusoesManuais`, `excluirInclusaoManual`, canonização de vendedor |
| 13 | **Tabs** | 1933–1972 | `switchTab`, `updateStatusBar` |
| 14 | **Filtros** | 1973–2040 | `populateFilters`, `applyFilters`, `passesFilters`, `clearFilters`, `getDateRange` |
| 15 | **Multi-select (dashboard)** | 2041–2086 | `toggleMultiSelect`, `closeAllMultiSelects`, `filterMsOptions`, `buildMs`, `toggleMsOpt`, `updateMsLabelDash`, `syncVendedoresByEmpresa` |
| 16 | **Dashboard** | 2087–2172 | `renderDashboard`, `setText`, `getPeriodData`, `renderLineChart`, `renderDoughnut`, `renderRanking` (charts junto) |
| 17 | **Tabelas de detalhe** | 2173–2434 | `renderDetailTable`, `renderDetailCompradosTable`, `sortDetail`, `renderCompradosSemAvPanel`, `rastrearPlacas`, `incluirOrfaoManualmente`, `salvarPlacaOrfao` |
| 18 | **Visão Comprador** | 2435–2527 | `renderCompradorVis`, `passesCompradorVisFilters`, `populateCompradorFilterOptions`, `clearCompradorFilters` |
| 19 | **Paginação** | 2528–2541 | `renderPagination` |
| 20 | **Exportações** | 2542–2646 | `exportExcel`, `exportPDF`, `exportJPEG`, `withCleanExport`, `exportSection*` |
| 21 | **Toast** | 2647–2733 | `showToast` |
| 22 | **Smart cache** | 2734–2759 | `saveDataCache`, `loadDataCache`, `restoreDates` |
| 23 | **IA (Copiloto)** | 2760–3368 | `sendAIMessage`, `prepareAIContext`, `montarResumoRelatorioParaIA`, `callGeminiWithFallback`, `saveGeminiKey/Quiet`, `saveGeminiModel`, `perguntaRapidaIA`, `clearAIChat` |
| 24 | **Comprador CRUD** | 3369–3467 | `loadCompradores`, `salvarComprador`, `editComprador`, `excluirComprador`, `toggleComprador`, `openModalNovoComprador` |
| 25 | **Analytics** | 3468–4314 | `renderAnalytics` + ~12 sub-renders, `getAnalyticsData`, multi-select da Análise (`toggleMsDropdown`, `populateMsDropdown`, `onMsCbChange`, `updateMsLabel`, `filterMsItems`, `getMsSelected`, `clearMsSelected`), `sortAnalyticsTable`, `clearAnalyticsFilters`, `filtrarPorMarca`, `viewFilteredInDetail` |
| 26 | **Alertas** | 4315–4416 | `salvarConfigAlertas`, `gerarScriptAlertas`, `copyAlertScript` |
| 27 | **Tema** | (em Config, ~28–80) | `applyTheme`, `toggleTheme`, `getCssVar`, `chartGridColor`, `chartTickColor`, `refreshChartsForTheme` |
| 28 | **INIT** | 4417–fim | listener `DOMContentLoaded` consolidado |

---

## 2. Detalhe por domínio (dependências, chamadores, risco, ordem)

Legenda de risco: 🟢 baixo · 🟡 médio · 🔴 alto.

| Domínio | Vars/globais usados | Depende de | Quem chama | Risco | Ordem |
|---|---|---|---|---|---|
| **Utils** | — | (nada) | quase todos | 🟢 | **1º** |
| **Config/State** | `STATE`, `SESSION`, `API_URL`, `CHARTS`, `LOCAL_KEYS`, `DATA_CACHE_*`, `MS_STATE`, `MS_OPTIONS`, `AI_HISTORY`, `compradoresList` | Utils | todos | 🔴 (é o núcleo) | **2º** |
| **Tema** | `CHARTS`, localStorage | Utils, Charts | header, INIT, dashboard | 🟢 | 3º |
| **Toast** | — | — | muitos | 🟢 | 3º |
| **API** | `API_URL`, `setCloud` | Config | carga, login, edição, CRUD, uploads | 🟡 | 4º |
| **Auth** | `SESSION`, `API_URL` | API, Config, Utils | login UI, INIT | 🔴 (login/permissões) | tardio |
| **Cache/Smart cache** | `STATE`, `LOCAL_KEYS`, `DATA_CACHE_*` | Utils | carga | 🟡 | 5º |
| **Pipeline carga** | `STATE`, `SESSION` | API, Utils, cache, crossJoin, filtros | login, botão recarregar | 🔴 | tardio |
| **Cruzamento** | `STATE` | Utils | carga | 🔴 (coração do negócio) | tardio |
| **Filtros** | `STATE` | Utils, dashboard/analytics | dashboard, multi-select | 🟡 | médio |
| **Multi-select (dash)** | `STATE.msSelected` | filtros, utils | filtros UI | 🟢 | médio |
| **Dashboard+Charts** | `STATE`, `CHARTS` | Utils, filtros, charts, tema | switchTab, applyFilters | 🟡 | médio |
| **Tabelas detalhe** | `STATE` | Utils, paginação, edição | switchTab | 🟡 | médio |
| **Visão Comprador** | `STATE` | Utils, paginação | switchTab | 🟢 | médio |
| **Analytics** | `STATE`, `AN_SORT`, `MS_STATE`, `MS_OPTIONS` | Utils, filtros, charts, export | switchTab | 🟡 | médio |
| **Comprador CRUD** | `compradoresList` | API, Utils | aba comprador, alertas | 🟢 | médio |
| **Uploads/Import** | `IMPORT_MODE`, `STATE` | API, Utils | abas de input (master) | 🟢 | cedo-médio |
| **Edição campos** | `STATE` | API, Utils | tabelas | 🟡 | médio |
| **Inclusão manual** | `STATE`, `LOCAL_KEYS` | API, Utils, crossJoin | aba (master) | 🟡 | médio |
| **Usuários** | `usuariosListCache`, `SESSION` | API, Utils | aba (master) | 🟢 | cedo-médio |
| **Histórico** | `historicoData` | API, Utils | aba (master) | 🟢 | **cedo (piloto)** |
| **IA** | `AI_HISTORY`, `STATE`, `PROMPT_*`, `GEMINI_*` | Utils, filtros | aba IA | 🟡 | médio |
| **Exportações** | `STATE`, libs CDN | Utils, tema | dashboard/analytics | 🟡 | médio |
| **Alertas** | `compradoresList` | Utils | aba (master) | 🟢 | cedo |
| **Diagnóstico** | `STATE` | Utils | carga | 🟢 | médio |

---

## 3. Funções que DEVEM permanecer em `window` (81)

Conjunto derivado mecanicamente de **todos** os handlers inline — no `index.html`
**e** dentro de strings `innerHTML` do `js/app.js`. Reproduzir com:

```bash
{ grep -oE 'on(click|change|input|keydown|dragover|drop|dragleave)="[a-zA-Z0-9_]+\(' index.html \
    | sed -E 's/.*"([a-zA-Z0-9_]+)\($/\1/'
  grep -oE 'on(click|change|input|keydown|dragover|drop|dragleave)=\\?["'"'"']?[a-zA-Z0-9_]+\(' js/app.js \
    | sed -E "s/.*[\"'\\\\]([a-zA-Z0-9_]+)\($/\1/"
} | grep -vE '^if$' | sort -u
```

Lista atual (81):

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

**Observações:**
- `hardReloadApp` também é usado no `index.html` (selo de build) → window.
- `event` global (usado por `toggleMultiSelect`/`toggleMsOpt` como
  `event.stopPropagation()`) não é função nossa; é o `window.event` do Chrome —
  **não** modularizar isso, apenas manter.
- Esta lista **deve ser regenerada** no início da Sprint (o comando acima é a
  fonte de verdade); qualquer novo handler inline entra automaticamente.

---

## 4. Estrutura final de arquivos proposta

```
js/
  app.js         ← BOOTSTRAP: importa tudo, expõe as 81 funções em window, roda INIT
  config.js      ← BUILD_TAG, DEFAULT_API_URL, API_URL (via getter/setter), constantes
  state.js       ← STATE, CHARTS, SESSION, MS_STATE, MS_OPTIONS, AI_HISTORY, caches em memória
  utils.js       ← datas, números, escHtml, normPlaca/Chassi, dedup*, similaridade
  api.js         ← callAPI*, fetchWithTimeout, setCloud, testConnection
  auth.js        ← doLogin, doLogout, openDashboard, permissões
  cache.js       ← LOCAL_KEYS, smart cache, placa overrides, manual cache
  loaddata.js    ← loadDataFromSheets, normalizeAvFromSheets, diagnóstico
  crossjoin.js   ← crossJoin, computeOrfaos, recomputeComprado, canon vendedor
  filters.js     ← populateFilters, applyFilters, passesFilters, multi-select dashboard
  dashboard.js   ← renderDashboard, setText, getPeriodData
  charts.js      ← renderLineChart, renderDoughnut, renderRanking, cores por tema
  tables.js      ← renderDetailTable, renderDetailCompradosTable, órfãos, paginação
  comprador.js   ← Visão Comprador + Comprador CRUD
  analytics.js   ← renderAnalytics + sub-renders + multi-select analytics
  ia.js          ← Copiloto (contexto, Gemini, chave/modelo)
  exports.js     ← exportExcel/PDF/JPEG, withCleanExport, seções
  users.js       ← usuários + permissões UI
  history.js     ← histórico
  alerts.js      ← config + gerador de script de alertas
  uploads.js     ← import/upload + edição de campos + inclusão manual
  theme.js       ← applyTheme, toggleTheme, cores de chart por tema
  ui.js          ← showToast, closeModal, switchTab, updateStatusBar
```

> Granularidade é ajustável — o importante é a **fronteira**: cada módulo importa
> `state.js`/`config.js`/`utils.js` e exporta suas funções; `app.js` costura tudo
> e faz a exposição em `window`.

No `index.html`, o único ponto de entrada muda de
`<script src="js/app.js"></script>` para
`<script type="module" src="js/app.js"></script>` (1 atributo).

---

## 5. Estratégia de compatibilidade

### 5.1 Exposição em `window` (handlers inline)
- `app.js` (bootstrap) importa as 81 funções e faz **uma** atribuição central:
  ```js
  import * as auth from './auth.js';
  import * as filters from './filters.js';
  // ...
  Object.assign(window, {
    doLogin: auth.doLogin, doLogout: auth.doLogout,
    applyFilters: filters.applyFilters, /* ...as 81... */
  });
  ```
- **Alternativa** por módulo: cada módulo faz `window.doLogin = doLogin;` ao
  final. Menos central, mas dispersa. **Recomendado: exposição central em
  `app.js`** (um único lugar auditável; a lista bate com o grep da §3).

### 5.2 Preservar o `STATE` global (e demais singletons)
- `STATE`, `CHARTS`, `MS_STATE`, `MS_OPTIONS`, `AI_HISTORY` são **objetos
  `const`**: exportá-los de `state.js` e importar nos demais **mantém a mesma
  referência** (mutar propriedades funciona entre módulos). ✅ Simples.
- **Cuidado com `let` reatribuídos** — não podem ser reatribuídos de fora do
  módulo dono (ESM *live bindings* são somente-leitura na importação):
  - `API_URL` (reatribuído por `saveApiUrl`/`resetApiUrlToDefault`): mover a
    reatribuição para `config.js` via **setter** `setApiUrl(v)` + getter
    `getApiUrl()`; ou encapsular em `CFG = { apiUrl }` (objeto mutável). Ajustar
    ~12 referências.
  - `SESSION` (reatribuído por `doLogin = user` e `doLogout = {}`): idem — manter
    `SESSION` como objeto e **substituir propriedades** (`Object.assign(SESSION,
    user)` / limpar chaves) em vez de reatribuir a variável; ou setter em
    `state.js`. ~79 referências (a maioria só lê — só as 2 reatribuições mudam).
  - `saveTimer`, `usuariosListCache`, `historicoData`, `compradoresList`: `let`
    reatribuídos localmente no seu domínio → ficam **dentro** do módulo dono, sem
    exportar reatribuição. 🟢
- Opcional (reduz risco): também pendurar `window.STATE = STATE` e
  `window.SESSION = SESSION` para paridade de depuração com hoje.

### 5.3 Preservar ordem de inicialização e `DOMContentLoaded`
- O `DOMContentLoaded` **consolidado** (build-tag → `loadSavedApiUrl` →
  `loadSavedGeminiKey` → listener de clique → stopPropagation) fica **só no
  `app.js`**, executado depois das exposições em `window`.
- ES Modules são `defer` por natureza (executam após o parse do HTML) e
  **na ordem de importação**. Como `app.js` importa todos os módulos antes de
  registrar o `DOMContentLoaded`, todas as funções já existem quando o evento
  dispara. ✅
- Constantes com efeito colateral de leitura de `localStorage` no load
  (`API_URL`, `GEMINI_MODEL`) permanecem inicializadas em `config.js`/`ia.js` no
  momento do import — mesma semântica de hoje.

### 5.4 Evitar quebra dos handlers inline
- Regra de aceite por micro-sprint: após mover um domínio, **re-rodar o grep da
  §3** e garantir que toda função da lista continua em `window` (o smoke test faz
  isso: `typeof window.fn === 'function'`).
- Nunca renomear função exposta sem atualizar o HTML/innerHTML correspondente.

---

## 6. Micro-sprints (uma por domínio, com risco/aceite/rollback)

Cada micro-sprint = **mover um domínio para seu arquivo**, importar em `app.js`,
expor em `window` o que for handler, validar. Sempre `type="module"` já ativo
desde a Sprint 5.0.

| Sprint | Escopo | Risco | Critério de aceite | Rollback |
|---|---|---|---|---|
| **5.0 — Andaime** | Criar `state.js`, `config.js`, `utils.js` (mover só constantes/utils puros); trocar `app.js` para `type="module"`; expor as 81 em `window`; **manter o resto ainda em `app.js`** | 🔴 (é a virada de script→module) | Smoke: 81 funções em window; parse OK; login/dashboard/filtros/abas OK | Reverter para `<script src>` clássico e restaurar `app.js` monolítico (1 commit) |
| **5.1 — Histórico** (piloto) | Mover domínio Histórico | 🟢 | Aba Histórico carrega/renderiza; `loadHistorico`/`renderHistorico` em window | Reverter 1 arquivo + import |
| **5.2 — Alertas** | Mover Alertas | 🟢 | Gera/copía script; `salvarConfigAlertas`/`copyAlertScript` OK | idem |
| **5.3 — Usuários** | Mover Usuários | 🟢 | CRUD + permissões UI; checkboxes | idem |
| **5.4 — Toast/UI/Tema** | `showToast`, `closeModal`, `switchTab`, `updateStatusBar`, tema | 🟡 | Trocar abas, toasts, tema claro/escuro | idem |
| **5.5 — Utils/Charts/Paginação** | Consolidar helpers restantes + charts | 🟡 | Gráficos renderizam; sem `Chart` undefined | idem |
| **5.6 — Comprador (Visão + CRUD)** | Mover domínio comprador | 🟢 | Aba Visão Comprador + CRUD | idem |
| **5.7 — Exportações** | Mover exports | 🟡 | PDF/Excel/JPEG geram | idem |
| **5.8 — IA** | Mover Copiloto | 🟡 | Pergunta simples responde; chave/modelo | idem |
| **5.9 — Uploads/Edição/Inclusão manual** | Mover import + edição + manual | 🟡 | Import Sheets/arquivo; edição inline; inclusão manual | idem |
| **5.10 — Filtros + Multi-select dashboard** | Mover filtros | 🟡 | Filtros do dashboard; rótulos; dropdown | idem |
| **5.11 — Dashboard** | Mover dashboard | 🟡 | KPIs/gráficos/rankings | idem |
| **5.12 — Tabelas detalhe + órfãos** | Mover tabelas | 🟡 | Detalhe avaliados/comprados; rastrear placas | idem |
| **5.13 — Analytics** | Mover Análise Avançada + multi-select analytics | 🟡 | 12 seções + filtros analytics | idem |
| **5.14 — API** | Mover camada API | 🟡 | Toda leitura/escrita ao Apps Script | idem |
| **5.15 — Cache + Carga + CrossJoin + Auth** | Mover o **núcleo** por último | 🔴 | Login → carga → cruzamento → dashboard; diagnóstico com contagens **idênticas ao baseline** | Reverter; núcleo é o mais sensível |

> O **núcleo** (Config/State, API, Auth, Carga, CrossJoin) é movido por
> **último**, quando o andaime e os módulos-folha já provaram o mecanismo de
> `window`/`import`. Alternativamente, Config/State entram na 5.0 (andaime) porque
> todos dependem deles.

---

## 7. Primeiro módulo a migrar (menor risco)

**Ordem recomendada de arranque:**

1. **Sprint 5.0 (andaime)** — obrigatória primeiro: é a única que muda o
   `index.html` (`type="module"`) e estabelece `state.js`/`config.js`/`utils.js`
   + a exposição central em `window`. É 🔴 por ser a virada de paradigma, mas sem
   ela nada mais roda como módulo.
2. **Sprint 5.1 (Histórico) = primeiro DOMÍNIO real a migrar.** Escolhido por ser
   o de **menor acoplamento**: 2 funções (`loadHistorico`, `renderHistorico`), 1
   global local (`historicoData`), depende apenas de `api.js` + `utils.js`, é
   aba **master** (superfície pequena), e nenhuma outra função depende dele. É o
   **piloto** ideal para validar o fluxo de migração de ponta a ponta.

---

## Checklist de validação (por micro-sprint)

- [ ] `node --check` (ou parse do bundler) sem erros em todos os `.js` movidos.
- [ ] Smoke headless: as **81 funções** da §3 continuam `typeof === 'function'`
      em `window` (regenerar a lista pelo grep antes).
- [ ] `PAGE_ERRORS: []` no carregamento.
- [ ] 14 abas presentes; troca de aba funciona.
- [ ] Funções críticas: `doLogin`, `switchTab`, `renderDashboard`, `applyFilters`,
      `renderAnalytics`, `crossJoin`, `sendAIMessage`, `exportPDF` globais.
- [ ] `STATE`/`SESSION` singletons (mutação propaga entre módulos).
- [ ] Diagnóstico com **contagens idênticas ao baseline** (avaliações/comprados/
      vinculados/órfãos) — prova que carga+crossJoin não mudaram.
- [ ] `index.html` só alterado na 5.0 (`type="module"`); CSS intacto.
- [ ] Teste manual no ambiente publicado (as libs CDN/Apps Script não rodam no
      sandbox): login, filtros, gráficos, exportações, IA.

---

## Riscos principais (resumo)

1. **Handlers inline (🔴):** 81 funções precisam ficar em `window`; esquecer uma
   = botão morto sem erro visível. Mitigação: exposição central + smoke que checa
   a lista inteira.
2. **`let` globais reatribuídos (🟡):** `API_URL` e `SESSION` exigem
   setter/objeto-mutável (ESM não deixa reatribuir binding importado).
3. **Núcleo STATE/crossJoin (🔴):** mover por último, com baseline de contagens.
4. **Ordem de execução (🟡):** módulos são `defer`; garantir que `app.js` exponha
   `window` e registre `DOMContentLoaded` só depois de todos os imports.
5. **Ambiente de teste (🟡):** CDNs/Apps Script bloqueados no sandbox — validação
   funcional final precisa do ambiente publicado.

---

## 8. Replanejamento (Stage 14) — estado real após 5 extrações

> Esta seção **substitui** a sequência de extração das seções 1–7 (que foi
> escrita antes de qualquer código ser movido). Recalculado do zero a partir do
> `js/app.js` atual — sem reaproveitar o plano antigo às cegas. Ainda em
> **scripts clássicos** (sem `type="module"`), conforme decidido no Stage 8.

### 8.1 Progresso atual

| Módulo já extraído | Sprint | Linhas | Funções reais |
|---|---|---|---|
| `js/history.js` | 5.1 | 34 | 2 |
| `js/alerts.js` | 5.2 | 109 | 3 |
| `js/users.js` | 5.3 | 107 | 11 |
| `js/comprador.js` | 5.4 | 174 | 11 |
| `js/exports.js` | 5.5 | 168 | 11 |
| **`js/app.js` (restante)** | — | **4025** | **227** |

**Percentual estimado concluído: ~15%**

| Métrica | Cálculo | % |
|---|---|---|
| Por domínio (5 de ~20 blocos identificados) | 5/20 | ~25% |
| Por função real (38 extraídas / ~265 no sistema) | 38/265 | ~14% |
| Por linha de conteúdo real (525 movidas / ~4550 totais) | 525/4550 | ~12% |

> A métrica por domínio é otimista: os domínios já extraídos são os **menores**.
> `IA` (620 linhas) + `Analytics` (792 linhas) somam **1412 linhas** — quase 3×
> tudo que já foi extraído (525 linhas).

### 8.2 Mapa completo dos domínios restantes em `js/app.js`

100% das 4025 linhas mapeadas em 21 blocos contíguos (soma verificada, sem
lacunas nem sobreposições):

| Domínio | Linhas | Funções | Refs `STATE` | Acoplamento | Risco | Ordem |
|---|---|---|---|---|---|---|
| Utils (data/número/string/normalização) | 183 | 24 | 0 | Nenhum — usado por todos, não depende de nada | 🟢 | 1 |
| Toast | 15 | 1 | 0 | Só `escHtml` | 🟢 | 2 |
| Cache Local de Apoio | 77 | 11 | 0 | `LOCAL_KEYS` | 🟢 | 3 |
| Smart Cache | 21 | 3 | 0 | `DATA_CACHE_*` | 🟢 | 4 |
| Build/Tema | 51 | 7 | 0 | `BUILD_TAG` | 🟢 | 5 |
| Config API-URL (UI) | 33 | 4 | 0 | `API_URL` (escrita) | 🟡 | 6 |
| API (rede) | 186 | 7 | 0 | `API_URL`; usado por quase todos em runtime | 🟡 | 7 |
| Usuários — resíduo (helpers deixados pela 5.3) | 63 | 6 | 0 | `ABAS_USUARIO`; acoplado a `users.js` | 🟡 | 8 |
| Visão Comprador (resíduo) + Paginação + Import Sheets | 134 | 7 | 1 | Acoplado a `comprador.js` | 🟡 | 9 |
| Import/Upload | 228 | 17 | 0 | `IMPORT_MODE` | 🟡 | 10 |
| Edição de Campos (Sheets) | 157 | 10 | 3 | Grava `STATE.avaliacoes` | 🟠 | 11 |
| Dashboard + Charts | 86 | 7 | 1 | `CHARTS`; via `getPeriodData` | 🟠 | 12 |
| Filtros + Multi-select Dashboard | 114 | 15 | 19 | `STATE.msSelected`/`filtered` | 🟠 | 13 |
| IA / Copiloto | 620 | 27 | 11 | `AI_HISTORY`, `GEMINI_*`, `PROMPT_*`, `CAMPOS` | 🟠 | 14 |
| Analytics | 792 | 31 | 4 | `AN_SORT`, `MS_STATE`, `MS_OPTIONS` | 🟠 | 15 |
| Tabelas de Detalhe + Órfãos | 264 | 9 | 42 | `STATE` pesado | 🔴 | 16 |
| Auth/Login/Permissões | 117 | 8 | ~4 | `SESSION` central, segurança | 🔴 | 17 |
| Carga de Dados/Diagnóstico | 254 | 5 | 36 | `STATE` pesado | 🔴 | 18 |
| CrossJoin + Inclusão Manual | 462 | 26 | 52 | `STATE` — coração do negócio | 🔴 | 19 |
| Tabs/StatusBar (hub dispatcher) | 40 | 2 | — | Chama **todos** os domínios | 🔴 | 20 |
| STATE (decl.) + INIT + Compat Layer | 112 | 0 | — | É o bootstrap/shell final | — | nunca extrair |

*(soma: 183+15+77+21+51+33+186+63+134+228+157+86+114+620+792+264+117+254+462+40+112 = 4025)*

### 8.3 Podem ser extraídos imediatamente (🟢)

**Utils, Toast, Cache Local de Apoio, Smart Cache, Build/Tema** — zero
referências a `STATE`/`SESSION`, nenhuma lógica de negócio. `Utils` é a
prioridade máxima: 24 funções puras (`parseDate`, `escHtml`, `normPlaca`,
`dedup*`, `compraKey`, `empresaSimilarity`…) usadas por praticamente todo o
resto do sistema. Extraí-la primeiro reduz o acoplamento de **todas** as
extrações seguintes (elas passam a depender de `utils.js`, já carregado).

### 8.4 Devem permanecer em `app.js` até o final

**CrossJoin + Inclusão Manual** (52 refs `STATE`; vedado alterar sem aprovação
pelo `CLAUDE.md`), **Carga de Dados** (36 refs; orquestra o `crossJoin`),
**Auth/Login** (segurança, `SESSION`), **Tabelas de Detalhe + Órfãos** (42 refs,
ligada ao cruzamento), **Tabs/StatusBar** (dispatcher que chama todos os outros
domínios — mover cedo obrigaria reteste a cada split seguinte) e o bloco
**STATE (declaração) + INIT + Compat Layer**, que por definição é o que resta em
`app.js` quando tudo mais tiver saído — é o "casco" do sistema.

### 8.5 Nova sequência de extração (substitui a sequência antiga)

```
Onda 1 — 🟢 imediata (qualquer ordem entre si):
  utils.js → toast.js → cache-local.js → smart-cache.js → theme.js

Onda 2 — 🟡 segura (depois da Onda 1):
  api-config.js (URL) → api.js
  → fundir resíduo de usuários em js/users.js (já existente)
  → fundir resíduo de comprador + paginação/import-sheets em js/comprador.js
    (ou novo js/misc.js, conforme o tamanho resultante)
  → uploads.js

Onda 3 — 🟠 médio (depois da Onda 2):
  edit-fields.js → dashboard.js → filters.js → ia.js → analytics.js

Onda 4 — 🔴 núcleo, por último, nesta ordem interna:
  tables.js → auth.js → loaddata.js → crossjoin.js
  → (Tabs fica ou vai por último) → app.js final = STATE + Tabs + INIT + Compat
```

**Diferença em relação ao plano original (seções 1–7):** aquele plano listava
Histórico → Alertas → Usuários como piloto (já executado) e não previa a
granularidade real dos **blocos residuais** que cada extração deixa para trás em
`app.js` (helpers que `users.js`/`comprador.js` passaram a chamar em runtime).
Este replanejamento parte do estado real do código e incorpora esses resíduos.

### 8.6 Dependências remanescentes (grafo simplificado)

```
Utils ← (usado por quase tudo; não depende de nada)
API ← Config-URL
Auth ← API, Utils, SESSION
CargaDados ← API, Utils, CrossJoin, Filtros
CrossJoin ← Utils, STATE (núcleo)
Filtros ← STATE, Utils
Dashboard ← Filtros, Charts, Utils
Tabelas ← STATE, Utils, Paginação
IA ← STATE.filtered, Utils, AI_HISTORY/GEMINI_*
Analytics ← STATE, Utils, MS_STATE/MS_OPTIONS/AN_SORT
Exportações (já extraído) ← STATE, Utils, libs CDN
Alertas (já extraído) ← compradoresList (comprador.js)
Usuários (já extraído) ← helpers-resíduo (app.js), SESSION
Comprador (já extraído) ← helpers-resíduo (app.js)
Tabs ← chama TODOS os domínios acima
```

### 8.7 Riscos restantes (atualizados)

1. **Tamanho desproporcional:** IA (620) e Analytics (792) são >3× o tamanho de
   qualquer domínio já extraído — mais superfície para erro por extração.
2. **Resíduos cruzados:** `users.js`/`comprador.js` já dependem de helpers que
   ficaram em `app.js` (`getAllUserPerms`, `parseLista`, `cvVal`,
   `getCompradorVisData` etc.) — ao extrair esses helpers, validar que os dois
   arquivos já extraídos continuam funcionando (regressão cruzada).
3. **`STATE`/`SESSION` como `let`/objeto mutável:** continua válido só em script
   clássico; se um dia migrar para ESM, vira bloqueador (ver seção 5.2).
4. **Núcleo concentra o risco de negócio:** `crossJoin`, `computeOrfaos` e a
   Carga de Dados não podem ser tocados sem baseline de contagens
   (avaliações/comprados/vinculados/órfãos) idêntico ao atual.
5. **Sandbox sem CDN/Apps Script:** todas as validações funcionais de ponta a
   ponta (login real, Sheets, Gemini) continuam pendentes de teste no ambiente
   publicado.
