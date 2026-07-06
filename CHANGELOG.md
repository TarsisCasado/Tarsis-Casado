# CHANGELOG

Todas as mudanças relevantes do projeto são registradas aqui.

O formato segue, de maneira simplificada, o
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/). O projeto ainda não
adota versionamento semântico formal (não há `package.json`); usa-se o
`BUILD_TAG` embutido em `index.html` como marcador de build de produção.

---

## [Não lançado]

Seção preparada para futuras alterações. Ao trabalhar, registre aqui antes de
promover para uma versão datada.

### A adicionar
- (vazio)

### A alterar
- (vazio)

### A corrigir
- (vazio)

### A remover
- (vazio)

---

## [1.9.0-split-users] — 2026-07-04

Sprint 5.3 (Stage 11): **separação física** do domínio Usuários para
`js/users.js`, mantendo **script clássico**. Movidas **apenas** as 11 funções do
escopo + `usuariosListCache`; helpers compartilhados permanecem em `app.js`.

### Adicionado
- `js/users.js` — `loadUsuarios`, `getUserPerms`, `setUserPerms`,
  `buildLojasCheckboxes`, `toggleAllLojas`, `syncLojasAllCheckbox`,
  `buildAbasCheckboxes`, `onPerfilChange`, `renderUsuarios`, `salvarUsuario`,
  `toggleUsuario` + `usuariosListCache` (código idêntico ao original). Carregado
  antes de `app.js`; só declara; helpers acessados em runtime.
- `docs/baseline-stage-11.md` — baseline do domínio.

### Alterado
- `js/app.js` — funções do escopo removidas (matches `^function ` 260 → 249);
  **permanecem** `ABAS_USUARIO`, `getAllUserPerms`, `parseLista`, `getAllLojas`,
  `getLojasSelecionadas` (compartilhados) e `openModalNovoUsuario`/`editUsuario`
  (fora do escopo). Pointer comment no lugar. `switchTab`,
  `aplicarPermissoesUsuario` e o compat layer seguem referenciando os globais.
- `index.html` — **uma** linha: `<script src="js/users.js"></script>` antes de
  `app.js`.

### Validação
- `node --check` limpo em `app.js` e `users.js`. Corpo movido **byte-idêntico**
  ao original; contabilidade de linhas fecha exatamente (sem perda/duplicação).
  Smoke headless: 11 funções globais; `renderUsuarios()` executa e preenche a
  tabela (usa `parseLista` de app.js + escreve `usuariosListCache`);
  `buildAbasCheckboxes()` usa `ABAS_USUARIO` de app.js em runtime; splits
  anteriores intactos; 81 handlers; `CarmaisApp.users` completo; 8 críticas
  globais; 14 abas; `PAGE_ERRORS: []`. `css` intacto; `index.html` só a inclusão.

---

## [1.8.0-split-alerts] — 2026-07-04

Sprint 5.2 (Stage 10): **separação física** do domínio Alertas para
`js/alerts.js`, mantendo **script clássico** (sem `type="module"`/`import`).
Extração literal; nenhuma lógica/nome/chamada interna alterada.

### Adicionado
- `js/alerts.js` — `salvarConfigAlertas` + `gerarScriptAlertas` + `copyAlertScript`
  (código idêntico ao original). Carregado **antes** de `js/app.js` (após
  `history.js`); só declara; dependências (`compradoresList`, `showToast`,
  `window._alertScript`) acessadas em runtime.
- `docs/baseline-stage-10.md` — baseline do domínio.

### Alterado
- `js/app.js` — seção Alertas removida; substituída por comentário-ponteiro.
  Matches `^function ` 266 → 260 (3 funções reais + 3 matches de *template
  string* que acompanham `gerarScriptAlertas`). `switchTab` e o compat layer
  seguem referenciando os globais (agora de `alerts.js`), sem alteração.
- `index.html` — **uma** linha: `<script src="js/alerts.js"></script>` antes de
  `js/app.js`.

### Validação
- `node --check` limpo em `app.js` e `alerts.js`. Smoke headless: 3 funções de
  Alertas globais; `gerarScriptAlertas()` executa sem lançar e popula
  `window._alertScript` (usa `compradoresList` de app.js em runtime); Histórico
  segue global; 81 handlers em `window`; `CarmaisApp.alerts` completo; 8 críticas
  globais; 14 abas; `PAGE_ERRORS: []`. `css/styles.css` intacto; `index.html` só
  a inclusão do script.

---

## [1.7.0-split-history] — 2026-07-04

Sprint 5.1 (Stage 9): **piloto de separação física** — domínio Histórico movido
para `js/history.js`, mantendo **script clássico** (sem `type="module"`, sem
`import/export`). Extração literal; nenhuma lógica/nome/chamada interna alterada.

### Adicionado
- `js/history.js` — `historicoData` + `loadHistorico` + `renderHistorico`
  (código idêntico ao original). Carregado **antes** de `js/app.js`; só declara
  (sem execução no load); dependências (`callAPI`, `SESSION`, `escHtml`, etc.)
  acessadas em runtime.
- `docs/baseline-stage-9.md` — baseline do piloto.

### Alterado
- `js/app.js` — bloco Histórico removido (268 → 266 funções), substituído por
  comentário-ponteiro. O compat layer e `switchTab` seguem referenciando os
  globais (agora vindos de `history.js`), sem alteração.
- `index.html` — **uma** linha: `<script src="js/history.js"></script>` antes de
  `js/app.js`.

### Validação
- `node --check` limpo em `app.js` e `history.js`. Smoke headless: `loadHistorico`
  /`renderHistorico` globais; `renderHistorico()` executa sem lançar (acessa
  `historicoData` local e `escHtml` de app.js); as 81 funções em `window`;
  `CarmaisHandlers` com 81; `CarmaisApp.history` completo; 8 críticas globais; 14
  abas; `PAGE_ERRORS: []`. `css/styles.css` intacto; `index.html` só a inclusão
  do script.

---

## [1.6.0-compat-layer] — 2026-07-04

Andaime da Sprint 5 (Stage 8): **camada de compatibilidade `window`** no fim de
`js/app.js`. Alteração **puramente aditiva** — o sistema segue como script
clássico (sem `type="module"`); nenhuma função movida, renomeada, encapsulada ou
substituída; nenhum uso interno alterado.

### Adicionado
- `window.CarmaisHandlers` — mapa explícito das **81 funções** referenciadas por
  handlers inline (HTML) e por handlers gerados em `innerHTML`. Documenta o que
  precisará ser reexposto em `window` quando o projeto migrar para ES Modules.
- `window.CarmaisApp` — 21 namespaces lógicos por domínio (`version`, `state`,
  `session`, `config`, `api`, `auth`, `pipeline`, `dashboard`, `charts`,
  `filters`, `analytics`, `tables`, `comprador`, `exports`, `ia`, `users`,
  `history`, `alerts`, `uploads`, `theme`, `utils`). `state`/`session`/`config`
  via getter (refletem o valor vivo de `STATE`/`SESSION`/`API_URL`).
- `docs/baseline-stage-8.md` — baseline do andaime.

### Validação
- `node --check` limpo. Smoke headless: `CarmaisHandlers` com exatamente 81
  entradas (conjunto idêntico ao grep de handlers, sem faltantes nem extras);
  todas as 81 acessíveis em `window`; 8 funções críticas globais;
  `CarmaisApp`/`CarmaisHandlers` existem; getters de estado retornam objetos
  vivos; 14 abas; `PAGE_ERRORS: []`. `index.html` e `css/styles.css` intactos.

---

## [1.5.0-multiselect] — 2026-07-04

Micro-sprint: **auditoria e correção dos multi-selects**. Corrige os rótulos sem
tocar em nenhuma lógica de filtragem.

### Corrigido
- **ID duplicado no DOM `ms-empresa-label`** (existia no Dashboard e na Análise
  Avançada). O span da Análise foi renomeado para `ms-empresa-anlabel`
  (`index.html`), eliminando o HTML inválido e a contaminação cruzada — antes,
  mexer no filtro de loja da Análise reescrevia o rótulo do Dashboard.
- **Rótulos do Dashboard não atualizavam.** Adicionada `updateMsLabelDash(id,def)`
  (alvo `<id>-label`, estado `STATE.msSelected`, texto "N selecionados"), usada
  por `buildMs` e `toggleMsOpt`. A `updateMsLabel(id)` da Análise passou a mirar
  `ms-<id>-anlabel` (estado `MS_STATE`).

### Impacto
- Filtros do Dashboard e da Análise: **inalterados** (só o texto do rótulo mudou).
- Fechar dropdown ao clicar fora: inalterado.
- Funções nomeadas: 268 → 269 (+`updateMsLabelDash`).

### Validação
- `node --check` limpo após cada uma das 4 alterações. Smoke test funcional
  headless: rótulo da Análise atualiza só o próprio span (Dashboard intacto);
  rótulo do Dashboard atualiza o próprio span; abrir/fechar dropdown OK; 12
  funções críticas globais; 14 abas; `PAGE_ERRORS: []`. `css/styles.css`
  intacto; `index.html` alterado só em 1 atributo `id` (justificado).

---

## [1.4.0-dedup] — 2026-07-04

Sprint 4 do `ROADMAP.md`: **limpeza controlada de duplicações/resíduos** em
`js/app.js`. Alterações cirúrgicas e comprovadamente sem efeito no
comportamento. `index.html` e `css/styles.css` intocados.

### Removido / Consolidado
- **`updateMsLabel` duplicado:** removida a definição morta `(id,def)` (dashboard),
  que era sobrescrita em runtime pela declaração posterior `(id)` (analytics) —
  *function hoisting*, a última vence. Remoção é no-op de runtime. Funções
  nomeadas: 269 → 268.
- **`DOMContentLoaded` duplicado:** os dois listeners viraram um só (no bloco
  INIT), preservando a ordem de execução (build-tag primeiro).
- **`closeAllMultiSelects` (click):** removido o registro redundante em
  `openDashboard()`; mantido o único registro no INIT (`addEventListener`
  deduplica referências idênticas — no-op observável).
- **Resíduo legado `carmais_claude_key`:** removidas as 2 chamadas
  `removeItem` (chave nunca lida/escrita).
- **Alias redundante de prompt:** removido `COPILOTO_CARMAIS_PROMPT`; o uso passou
  a referenciar diretamente `PROMPT_COPILOTO_CARMAIS` (mesmo valor).

### Adicionado
- `docs/baseline-stage-5.md` — baseline de regressão da Sprint 4.

### Validação
- `node --check` limpo após cada uma das 5 alterações; diff total +7/−16 linhas,
  restrito ao escopo. Smoke test headless: sem `pageerror`; `build-tag`
  renderizado; funções críticas globais (`doLogin`, `switchTab`,
  `renderDashboard`, `crossJoin`, `sendAIMessage`, `exportPDF`); 14 abas; CSS
  aplicado. `index.html`/CSS/libs CDN/handlers inline inalterados.

---

## [1.3.0-js] — 2026-07-04

Sprint 3 do `ROADMAP.md`: **separação do JavaScript** para arquivo externo.
Extração **literal** — nenhuma função, nome, variável, ordem, comentário,
espaçamento ou lógica alterada. Comportamento 100% preservado.

### Adicionado
- `js/app.js` — todo o conteúdo do antigo bloco `<script>` inline (4426 linhas),
  SHA-256 idêntico ao original
  (`5280ee6e056b33ea7bcf776175447fb54f04eede5ed9a3325eea49d2251a1f43`).
- `docs/baseline-stage-4.md` — baseline de regressão da Sprint 3.

### Alterado
- `index.html` — bloco `<script>…</script>` (linhas 993–5420) substituído por
  `<script src="js/app.js"></script>`. Diff: +1 / −4428 linhas. Ordem de
  carregamento preservada (4 libs CDN no `<head>` antes do `app.js` no fim do
  `<body>`). Funções (269), async (36), globais (30), listeners e eventos inline
  totais idênticos (soma index.html + app.js = baseline).

### Validação
- Smoke test headless (Chromium): JS carrega/parse/executa sem `pageerror`;
  `build-tag` renderizado; funções críticas globais (`doLogin`, `switchTab`,
  `renderDashboard`, `crossJoin`, `sendAIMessage`, `exportPDF`); login e 14 abas
  presentes; CSS externo aplicado. Libs CDN não exercitadas no sandbox (rede
  bloqueia os hosts) — sem impacto no código.

---

## [1.2.0-css] — 2026-07-04

Sprint 2 do `ROADMAP.md`: **separação do CSS** para arquivo externo. Recorte
**literal**, sem alterar nenhuma regra CSS, HTML, ID, classe ou JavaScript. O
comportamento visual permanece 100% idêntico.

### Adicionado
- `css/styles.css` — todo o conteúdo do antigo bloco `<style>` (371 linhas),
  SHA-256 idêntico ao original (`e797543288dc5546041c6843958b1bebaebc0c820aa2502f4ad457fec9852990`).
- `docs/baseline-stage-3.md` — baseline de regressão da Sprint 2.

### Alterado
- `index.html` — bloco `<style>…</style>` (linhas 15–387) substituído por
  `<link rel="stylesheet" href="css/styles.css"/>`. Diff: +1 / −373 linhas.
  Bloco JavaScript inalterado (SHA-256 `8677a45c…` mantido); IDs, abas (14),
  handlers inline (onclick 149 / onchange 34 / oninput 27) e libs CDN idênticos.

---

## [1.1.0-docs] — 2026-07-04

Sprint 1 do `ROADMAP.md`: **documentação e preparação da arquitetura**.
**Nenhuma linha de HTML, CSS ou JavaScript foi alterada** — o sistema permanece
100% idêntico ao de produção.

### Adicionado
- `README.md` — visão geral, tecnologias, execução local, deploy, integração com
  Apps Script/Sheets, fluxo, convenções.
- `ARCHITECTURE.md` — diagrama textual, fluxo de dados, estrutura do `STATE`,
  dependências e todos os pipelines (carga, filtros, render, exportação, IA,
  usuários, alertas).
- `CLAUDE.md` — manual permanente para IAs/devs: regras obrigatórias, o que nunca
  alterar, padrões, como estender (abas/gráficos/filtros/módulos), checklist de
  commit.
- `CHANGELOG.md` — este arquivo.
- `TODO.md` — backlog técnico priorizado.
- `ROADMAP.md` — plano em 9 sprints (documentação → evoluções futuras).

### Observações
- Registrados (sem corrigir) débitos técnicos conhecidos: `updateMsLabel`
  duplicado, dois sistemas de multi-select, `crossJoin` ~O(n²), senha em GET,
  permissões client-side, código morto. Ver `TODO.md`.

---

## [1.0.0] — Versão inicial (produção)

Estado do sistema no momento em que a documentação foi iniciada. Build de
referência: `BUILD_TAG = '2026-07-03c · inclusão manual salva no banco (Sheets)
+ sincronizar'` (definido em `index.html`).

### Funcionalidades presentes
- **SPA monolítica** em arquivo único `index.html` (HTML + CSS + JS).
- **Login e permissões** por perfil (master / usuário comum), com restrição de
  abas e lojas.
- **Carga de dados** do Google Sheets via Apps Script, com cache local (TTL
  30 min) e diagnóstico de contagem.
- **Cruzamento** avaliação ↔ compra (`crossJoin`), cálculo de órfãos e suporte a
  inclusões manuais.
- **Dashboard** com KPIs, séries diárias, rankings (vendedor, loja,
  precificador) e cards de objetivo.
- **Tabelas** de detalhe (avaliados, comprados, visão comprador) com ordenação,
  paginação e edição inline.
- **Análise Avançada** com 12 sub-seções (FIPE, objetivo, tipo, classificação,
  marcas, temporal etc.).
- **Copiloto de IA** (Google Gemini) sobre os dados filtrados, com fallback de
  modelos.
- **Exportações** em Excel, PDF e imagem/WhatsApp.
- **Gestão de usuários** e **geração de scripts de alertas** para compradores.
- **Tema claro/escuro** e layout responsivo.
- **Deploy** automático via GitHub Pages.

---

### Como manter este changelog
- Toda mudança de código entra primeiro em **[Não lançado]**.
- Ao concluir uma sprint/entrega, promova para uma seção versionada com data.
- Descreva o *impacto* (o que muda para o usuário), não só o *arquivo* alterado.
