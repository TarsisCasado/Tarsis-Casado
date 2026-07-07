# ARCHITECTURE.md — Dashboard Seminovos Carmais

Documentação técnica completa da arquitetura **atual** do sistema. Descreve o
código como ele está hoje em `index.html`, sem propor mudanças. Para o plano de
evolução, ver `ROADMAP.md` e `TODO.md`.

---

## 1. Diagrama textual da arquitetura

```
┌───────────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR (index.html)                         │
│                                                                         │
│  ┌──────────┐   ┌───────────────┐   ┌──────────────────────────────┐   │
│  │  VIEW    │   │   LÓGICA (JS)  │   │        ESTADO GLOBAL         │   │
│  │  HTML +  │◄──┤  funções       │◄──┤  SESSION  (usuário/perms)    │   │
│  │  CSS     │──►│  procedurais   │──►│  STATE    (dados + UI)       │   │
│  │  (14     │   │  + handlers    │   │  CHARTS   (instâncias)       │   │
│  │  abas)   │   │  inline        │   │  AI_HISTORY, MS_STATE, ...   │   │
│  └──────────┘   └───────┬───────┘   └──────────────────────────────┘   │
│                         │                                               │
│         ┌───────────────┼────────────────────┐                         │
│         ▼               ▼                    ▼                          │
│   localStorage    fetch (GET)          fetch (POST)                     │
│   (cache/config)   callAPI*             Gemini                          │
└─────────┼───────────────┼────────────────────┼────────────────────────┘
          │               │                    │
          │               ▼                    ▼
          │     ┌───────────────────┐   ┌──────────────────┐
          │     │ Google Apps Script│   │  Google Gemini   │
          │     │   Web App doGet   │   │       API        │
          │     └─────────┬─────────┘   └──────────────────┘
          │               ▼
          │     ┌───────────────────┐
          │     │   Google Sheets   │  (AVALIACOES, COMPRADOS,
          │     │   (banco de dados)│   EQUIPES, COMPRADOR,
          │     └───────────────────┘   USUARIOS, HISTORICO)
          ▼
   (persiste tema, chave IA, URL API, cache de dados 30 min)
```

**Camadas (conceituais — hoje entrelaçadas no mesmo arquivo):**

- **View:** HTML das 14 abas + CSS (design system por variáveis, temas).
- **Controlador:** funções globais + `onclick/onchange` inline no HTML.
- **Modelo:** objeto global `STATE` (em memória) + Google Sheets (persistência).
- **Serviços:** `callAPI*` (Apps Script), Gemini, `localStorage` (cache/config).

Classificação: **monólito procedural single-file com estado global compartilhado**.

---

## 2. Fluxo completo dos dados

```
Google Sheets (linhas brutas)
  │  callAPI({action:'getAvaliacoes'|'getComprados'|'getEquipes'|'getComprador'})
  ▼
Resposta JSON {ok,data}
  │  normalizeAvFromSheets / getAnyField  (mapeia colunas PT variadas → objeto padrão)
  │  parseDate / parseNumBR / normPlaca / normChassi
  ▼
STATE.avaliacoes / STATE.comprados / STATE.equipes / STATE.comprador
  │  dedupAvaliacoesPorId, dedupeCompradosByPlaca (remoção de duplicatas)
  │  restringirDadosPorLoja (aplica permissão do usuário)
  ▼
crossJoin()  ── cruzamento avaliação ↔ compra ↔ equipe ↔ comprador
  │  computeOrfaos (comprado sem avaliação)
  │  inclusões manuais → registros sintéticos de compra
  ▼
saveDataCache (localStorage, TTL 30 min)
  │  applyCompradorSheetData (mescla dados da aba COMPRADOR)
  ▼
applyFilters() → passesFilters() → dedupAvExibicao()
  ▼
STATE.filtered
  │
  ├─► renderDashboard  (KPIs, gráficos, rankings)
  ├─► renderDetailTable / renderDetailCompradosTable / renderCompradorVis
  ├─► renderAnalytics  (12 sub-seções)
  ├─► prepareAIContext → Gemini
  └─► exportExcel / exportPDF / exportJPEG
           │  edição inline na tabela
           ▼
      updateBuyerField / updateRecordVendorLoja / persistBuyerField
           │  callAPI({action:'updateField'|'updateBuyerManual'|...})
           ▼
      Google Sheets (grava de volta)
```

Um registro de avaliação, ao longo da vida, ganha campos derivados:
`__rowId` (identificador único), `tipo`/`empresaEquipe` (da aba EQUIPES),
`melhorado`/`valorMelhorado`/`compradorNome` (da aba COMPRADOR),
`compraInput`/`empresaCompraInput`/`dataCompraInput`/`comprado` (do cruzamento),
`pctFipe` (recomputeComprado).

---

## 3. Estrutura do STATE

`STATE` é o objeto central em memória (declarado por volta da linha 2472):

```js
const STATE = {
  avaliacoes: [],   // base de avaliações (já normalizada + cruzada)
  equipes:    [],   // vendedores → {nome, tipo, empresa}
  comprador:  [],   // dados complementares por placa (aba COMPRADOR)
  comprados:  [],   // base de compras (já deduplicada)
  filtered:   [],   // subconjunto de avaliacoes que passa nos filtros atuais
  detailSort:  { col:'dataAv', asc:false },   // ordenação da tabela de detalhe
  detailPage: 1, detailPageSize: 50,          // paginação detalhe avaliados
  detailCompradosPage: 1,                     // paginação detalhe comprados
  msSelected: { 'ms-empresa':[], 'ms-vendedor':[], 'ms-precificador':[] }
};
```

Propriedades **injetadas em runtime** (prefixo `_` = uso interno):

| Propriedade | Origem | Uso |
|---|---|---|
| `STATE._contagem` | `crossJoin` | diagnóstico de totais (bruto/único) |
| `STATE._avDuplicados` | `crossJoin` | nº de avaliações duplicadas |
| `STATE._compradosSemAv` | `crossJoin`/`computeOrfaos` | comprados órfãos |
| `STATE._snapCompradosRaw` / `_snapCompradosDedup` | `loadDataFromSheets` | snapshot p/ rastreador de placas |
| `STATE._filtersInitialized` | `loadDataFromSheets` | evita reinicializar filtros |

**Outros globais relevantes:**

| Global | Papel |
|---|---|
| `SESSION` | usuário logado: `{usuario, nome, perfil, lojas, abas, lojasPermitidas, abasPermitidas}` |
| `CHARTS` | mapa `id → instância Chart.js` (para `destroy()` antes de recriar) |
| `AI_HISTORY` | histórico do chat de IA (enviado ao Gemini) |
| `MS_STATE` / `MS_OPTIONS` | estado dos multi-selects da Análise Avançada |
| `AN_SORT` | ordenação das tabelas de analytics |
| `compradoresList` / `usuariosListCache` / `historicoData` | caches por aba |
| `API_URL` | endpoint do Apps Script em uso |
| `GEMINI_MODEL` / `GEMINI_FALLBACK_MODELS` | modelos de IA |

---

## 4. Dependências (cadeias críticas)

- **`crossJoin`** depende de `aplicarVendCanon` → `buildVendCanonMap` → `normVend`;
  `dedupeCompradosByPlaca`; `compraKey`; `empresaSimilarity`; `diffDays`;
  `recomputeComprado`; `computeOrfaos`; `isInclusaoManual`. **Escreve**
  `STATE.avaliacoes`, `STATE.comprados`, `STATE._compradosSemAv`, `STATE._contagem`.
- **`STATE.avaliacoes`** é consumida por: `applyFilters`, `renderDashboard`,
  `renderDetailTable`, `getAnalyticsData`, `prepareAIContext`, `getPeriodData`.
- **`applyFilters`** depende de `getDateRange`, `passesFilters`, `dedupAvExibicao`;
  escreve `STATE.filtered`; dispara os renders.
- **`loadDataFromSheets`** orquestra: `callAPI` → `normalizeAvFromSheets` →
  `dedupAvaliacoesPorId` → `restringirDadosPorLoja` → `crossJoin` →
  `applyCompradorSheetData` → `populateFilters` → `applyFilters` → `saveDataCache`.
- **`callAPI`** decide entre `callAPIChunked` (rows > 12) → `callAPISingle` →
  `fetchWithTimeout`; todas atualizam o badge via `setCloud`.

> ⚠️ Alto acoplamento a `STATE`: mudar sua forma impacta ~40 funções. Qualquer
> refatoração deve preservar a estrutura exata do `STATE` (ver `CLAUDE.md`).

---

## 5. Pipeline de carregamento

Função-chave: **`loadDataFromSheets(forceRefresh)`**.

1. **Cache primeiro** (`loadDataCache`): se houver cache válido (`carmais_data_cache_v1`,
   TTL 30 min) e não for `forceRefresh`, restaura `STATE`, roda `crossJoin`,
   `applyFilters`, mostra "Cache rápido" e **retorna** (carga instantânea).
2. **Busca remota:** `Promise.all` de `getAvaliacoes`, `getComprados`,
   `getEquipes`, `getComprador` (cada `.catch` registra erro em `diag`).
3. **Normalização:** `normalizeAvFromSheets` + `dedupAvaliacoesPorId` para
   avaliações; mapeamento de campos para comprador e comprados;
   `splitPlacaChassi` (a coluna "placa" pode conter o VIN); aplicação de
   `placaOverrides` (placas digitadas manualmente para órfãos).
4. **Restrição por loja** (`restringirDadosPorLoja`) e **cruzamento** (`crossJoin`).
5. **Cache** (`saveDataCache`), **filtros** (`populateFilters` + `applyFilters`)
   e **diagnóstico** (`showDiagnostico`).

**Ações (`action`) do Apps Script conhecidas pelo front-end:**

`login`, `logout`, `getAvaliacoes`, `getComprados`, `getEquipes`, `getComprador`,
`getUsuarios`, `getCompradores`, `getHistorico`, `importAvaliacoes`,
`replaceAvaliacoes`, `importComprados`, `replaceComprados`, `importEquipes`,
`importFromSheet`, `clearAvaliacoes`, `clearComprados`, `updateField`,
`updateBuyerManual`, `createUsuario`, `updateUsuario`, `createComprador`,
`updateComprador`, `deleteComprador`.

Contrato de resposta: `{ ok:true, data }` ou `{ ok:false, error }`.

---

## 6. Pipeline de filtros

Funções: **`applyFilters` → `passesFilters` → `dedupAvExibicao`**.

- Filtros do Dashboard: **Data Inicial/Final**, **Lojas/Empresas** (multi-select),
  **Vendedores** (multi-select), **Precificador** (multi-select).
- `getDateRange()` lê os inputs de data; `inRange(d, ini, fim)` testa cada registro.
- `passesFilters(r)` combina data + multi-selects (`STATE.msSelected`).
- `applyFilters()` grava `STATE.filtered` e chama os renders (dashboard, tabela,
  analytics conforme aba ativa).
- A **Análise Avançada** e a **Visão Comprador** têm filtros próprios
  (`getAnalyticsData`, `passesCompradorVisFilters`) com multi-selects independentes
  (`MS_STATE`/`MS_OPTIONS` e `cvVal`).
- **Dedup por período:** `dedupAvExibicao` aplica (opcionalmente) a regra "uma
  avaliação por loja" apenas na exibição, para não descartar reavaliações
  legítimas de meses diferentes.

---

## 7. Pipeline de renderização

- **Dashboard (`renderDashboard`):** calcula KPIs (avaliados, comprados,
  captação %, média % FIPE, melhorados), cards comparativos, cards de objetivo,
  séries diárias e rankings. Usa:
  - `renderLineChart(id, labels, data, label, color)` — Chart.js linha.
  - `renderDoughnut(id, labels, data, colors)` — Chart.js doughnut.
  - `renderRanking(id, entries, color, mode)` — ranking em HTML (`innerHTML`),
    `mode` = `'number'` ou `'percent'`.
- **Tabelas:** `renderDetailTable` (avaliados), `renderDetailCompradosTable`
  (comprados), `renderCompradorVis` (visão comprador). Ordenação por
  `sortDetail`/`STATE.detailSort`; paginação por `renderPagination`.
- **Analytics (`renderAnalytics`):** orquestra 12 sub-renders — `renderAnInsight`,
  `renderAnObjetivo`, `renderAnFipeCaptacao`, `renderAnPrecificadores`,
  `renderAnTipo`, `renderAnVendedores`, `renderAnModelos`, `renderAnClassificacao`,
  `renderAnTemporal`, `renderAnMarcas`, `renderAnAA` — via `getAnalyticsData`.
- **Padrões:** Chart.js sempre com `CHARTS[id].destroy()` antes de recriar; cores
  e grid adaptados ao tema (`chartGridColor`, `chartTickColor`,
  `refreshChartsForTheme`); todo conteúdo dinâmico em HTML passa por `escHtml`.

---

## 8. Pipeline de exportação

- **Excel:** `exportExcel()` usa SheetJS para gerar `.xlsx` da base filtrada.
- **PDF:** `exportPDF()` → `withCleanExport()` aplica `body.export-clean`
  (esconde filtros/botões via CSS), captura com **html2canvas** e gera com
  **jsPDF**.
- **Imagem/JPEG:** `exportJPEG()` — mesma técnica, saída de imagem.
- **Análise/WhatsApp:** `exportAnalyticsPDF`, `exportAnalyticsImage`,
  `exportSectionImage`, `exportSectionWhatsApp` exportam seções específicas.
- Helpers: `getCurrentBgColor`/`getCurrentCardColor`/`rgbFromCssColor` garantem
  cores corretas conforme o tema durante a captura.

---

## 9. Pipeline da IA

Função: **`sendAIMessage(text)`**.

1. Lê a chave em `localStorage['carmais_gemini_key']` (configurada no login ou na
   aba 🤖 IA).
2. Monta o contexto com **`prepareAIContext()`** (agrega `STATE.filtered`:
   totais, captação por loja/vendedor, top modelos, amostra de até 200 registros)
   e **`montarResumoRelatorioParaIA()`** (resumo estruturado).
3. Anexa o histórico recente (`AI_HISTORY.slice(-6)`) + o `systemInstruction`
   (`COPILOTO_CARMAIS_PROMPT`).
4. Chama **`callGeminiWithFallback(apiKey, payload)`**: percorre
   `GEMINI_FALLBACK_MODELS`, com 2 tentativas por modelo e backoff
   (`isTemporaryGeminiError` distingue erro temporário de permanente).
5. Renderiza a resposta com `formatarRespostaIA` / `renderAICompactCards` /
   `addAIChatMsg`.

Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent`
com header `x-goog-api-key`.

---

## 10. Pipeline dos usuários (permissões)

- **Login:** `doLogin` → `callAPI({action:'login', login, senha})` → `SESSION`.
- **Perfil:** `master` (vê tudo) ou usuário comum (restrito).
- **Aplicação de permissões:** `aplicarPermissoesUsuario` calcula
  `SESSION.lojasPermitidas` e `SESSION.abasPermitidas` (prioriza campos vindos do
  servidor; usa apoio local `getUserPerms` do `localStorage['carmais_user_perms']`).
- **UI:** `aplicarAbasUI` esconde abas não liberadas; `body.is-master` libera as
  abas `master-only` via CSS.
- **Dados:** `restringirDadosPorLoja` filtra `STATE.avaliacoes`/`STATE.comprados`
  pelas lojas permitidas — antes da renderização.
- **CRUD:** `loadUsuarios`, `salvarUsuario` (`createUsuario`/`updateUsuario`),
  `toggleUsuario`, `renderUsuarios`, `buildAbasCheckboxes`, `buildLojasCheckboxes`.

> ⚠️ **Segurança:** a restrição de abas/dados é feita **no cliente**. A
> autoridade final precisa estar no Apps Script (ver `TODO.md` → Segurança).

---

## 11. Pipeline dos alertas

- Aba **🔔 Alertas** (master). `salvarConfigAlertas` lê os campos (primeiro
  disparo em minutos, segundo em horas, canal: email/whatsapp/ambos) e chama
  **`gerarScriptAlertas(config)`**.
- `gerarScriptAlertas` **gera um código Google Apps Script** (string) contendo
  `checkNewAvaliacoes`, `getCompradoresPorLoja` e `enviarAlerta`, embutindo a
  lista de compradores ativos (`compradoresList`).
- Esse código é para o usuário **copiar** (`copyAlertScript`) e colar no Apps
  Script da planilha, configurando um **trigger de tempo**. Envia por
  `GmailApp.sendEmail` e/ou CallMeBot (WhatsApp).

> Importante: os alertas **não** rodam no navegador — o front-end apenas **gera**
> o script. A execução acontece no Apps Script do cliente.

---

## 12. Módulos existentes (mapa lógico dentro de index.html)

| "Módulo" (seção lógica) | Funções principais |
|---|---|
| Infra/API | `callAPI`, `callAPISingle`, `callAPIChunked`, `fetchWithTimeout`, `setCloud`, `testConnection` |
| Autenticação | `doLogin`, `doLogout`, `openDashboard`, `aplicarPermissoesUsuario`, `aplicarAbasUI`, `restringirDadosPorLoja`, `isMaster` |
| Carga | `loadDataFromSheets`, `normalizeAvFromSheets`, `saveDataCache`, `loadDataCache`, `restoreDates`, `showDiagnostico` |
| Cache local | `loadJsonLocal`, `saveJsonLocal`, `saveManualCache`, `loadPlacaOverrides`, `setPlacaOverride` |
| Pipeline de dados | `crossJoin`, `computeOrfaos`, `dedupe*`, `aplicarVendCanon`, `recomputeComprado`, `empresaSimilarity`, `compraKey`, `diffDays` |
| Filtros | `populateFilters`, `applyFilters`, `passesFilters`, `buildMs`, `toggleMultiSelect`, `getDateRange` |
| Dashboard | `renderDashboard`, `renderLineChart`, `renderDoughnut`, `renderRanking` |
| Tabelas | `renderDetailTable`, `renderDetailCompradosTable`, `renderCompradorVis`, `sortDetail`, `renderPagination` |
| Analytics | `renderAnalytics` + 12 sub-renders, `getAnalyticsData`, `sortAnalyticsTable` |
| Inclusão manual | `salvarInclusaoManual`, `renderInclusaoManual`, `sincronizarInclusoesManuais`, `excluirInclusaoManual` |
| Órfãos | `rastrearPlacas`, `renderCompradosSemAvPanel`, `incluirOrfaoManualmente`, `salvarPlacaOrfao` |
| Exportação | `exportExcel`, `exportPDF`, `exportJPEG`, `withCleanExport`, `exportSection*` |
| IA | `sendAIMessage`, `prepareAIContext`, `montarResumoRelatorioParaIA`, `callGeminiWithFallback`, `formatarRespostaIA` |
| Usuários | `loadUsuarios`, `salvarUsuario`, `getUserPerms`, `setUserPerms`, `buildAbasCheckboxes` |
| Histórico | `loadHistorico`, `renderHistorico` |
| Alertas | `salvarConfigAlertas`, `gerarScriptAlertas`, `copyAlertScript` |
| Utilitários | `parseDate`, `parseNumBR`, `normPlaca`, `normChassi`, `escHtml`, `fmtBRL`, `showToast`, `switchTab`, `applyTheme` |

---

## 13. Pontos de atenção arquiteturais conhecidos

Documentados para as próximas sprints (detalhe em `TODO.md`):

- **Duplicação real:** `updateMsLabel` está definida **duas vezes** (assinaturas
  diferentes); dois sistemas paralelos de multi-select (`.multi-select` vs `.ms-*`);
  `DOMContentLoaded` e `document.click→closeAllMultiSelects` registrados mais de uma vez.
- **Performance:** `crossJoin` faz `filter` dentro do loop de comprados (~O(n²));
  agregações recomputadas em vários renders; `getElementById` chamado centenas de vezes.
- **Segurança:** senha trafega em querystring `GET`; permissões só no cliente;
  chave Gemini em `localStorage`; endpoint público.
- **Código morto:** `localStorage.removeItem('carmais_claude_key')` (integração
  Claude removida); alias `COPILOTO_CARMAIS_PROMPT = PROMPT_COPILOTO_CARMAIS`.

Nenhum desses pontos deve ser alterado nesta sprint — apenas registrados.
