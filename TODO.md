# TODO — Backlog técnico

Backlog priorizado do projeto. Itens **não** devem ser executados nesta sprint de
documentação; servem de referência para as sprints seguintes (ver `ROADMAP.md`).
Cada item respeita os princípios do `CLAUDE.md`: baixo risco, retrocompatível,
sem alterar comportamento salvo aprovação explícita.

Legenda de esforço: 🟢 baixo · 🟡 médio · 🔴 alto.

---

## 🔴 Alta prioridade

- [x] **`updateMsLabel` duplicado** — *(Sprint 4)* removida a definição morta
  `(id,def)` (dashboard), que era sobrescrita em runtime pela `(id)` (analytics)
  via *function hoisting*. Remoção comprovadamente no-op.
  - ⚠️ **Peculiaridade latente descoberta (NÃO corrigida — fica p/ sprint
    funcional):** como a versão ativa `(id)` procura o elemento
    `'ms-'+id+'-label'`, as chamadas do multi-select do **Dashboard** (ids
    `ms-empresa`/`ms-vendedor`/`ms-precificador`, cujo label é `id+'-label'`)
    resultam em no-op — o rótulo do gatilho no Dashboard não é atualizado por
    `updateMsLabel`. Esse é o comportamento **atual de produção** e foi
    preservado. Avaliar num sprint de correção funcional (fora do escopo de
    refatoração).
- [ ] **Segurança do login** — a senha trafega em querystring `GET`
  (`callAPI({action:'login', login, senha})`). Migrar para `POST` no Apps Script.
  Requer mudança coordenada backend + front. 🔴
- [ ] **Autorização no servidor** — hoje abas/lojas são restringidas só no
  cliente (`aplicarAbasUI`, `restringirDadosPorLoja`). Validar permissões também
  no Apps Script para impedir bypass. 🔴
- [ ] **Baseline de regressão** — capturar um snapshot dos KPIs/contagens com
  base real (ou de teste) para comparar antes/depois de cada refatoração. 🟢

## 🟡 Média prioridade

- [ ] **Unificar os dois multi-selects** — `.multi-select`/`toggleMultiSelect`/
  `buildMs` (dashboard) vs `.ms-*`/`toggleMsDropdown`/`populateMsDropdown`
  (analytics). Escolher uma implementação e migrar a outra. 🟡 *(parcialmente
  tocado na Sprint 4: removida só a `updateMsLabel` morta; a unificação real
  segue pendente.)*
- [x] **Remover registros duplicados de listeners** — *(Sprint 4)*
  `DOMContentLoaded` consolidado em 1; `document.click → closeAllMultiSelects`
  reduzido a 1 registro (no INIT).
- [ ] **Otimizar `crossJoin`** — substituir o `filter` dentro do loop de
  comprados por índices `Map` (placa/chassi → avaliações), reduzindo de ~O(n²)
  para ~O(n). Manter resultado idêntico. 🟡
- [ ] **Cachear referências de DOM** — `getElementById` é chamado centenas de
  vezes em renders repetidos; cachear onde seguro. 🟡
- [ ] **Extrair helper de querystring** — a montagem de `URLSearchParams` está
  repetida em `callAPI`, `callAPISingle` e `callAPIChunked`. 🟢

## 🟢 Baixa prioridade

- [x] **Remover código morto** — *(Sprint 4)* removidos
  `localStorage.removeItem('carmais_claude_key')` (integração Claude) e o alias
  `COPILOTO_CARMAIS_PROMPT`.
- [ ] **Padronizar toasts/erros** — mensagens de erro de rede/IA em um único
  formatador. 🟢
- [ ] **Comentar seções longas** — `renderDashboard` está muito compacto;
  adicionar comentários (sem reformatar a lógica). 🟢

## 🚀 Melhorias futuras

- [ ] **Modo offline mais robusto** — indicar claramente quando os dados são de
  cache vs. ao vivo (já há badge; melhorar UX).
- [ ] **Exportação agendada / relatório recorrente**.
- [ ] **Internacionalização** — hoje 100% pt-BR fixo.
- [ ] **Acessibilidade (a11y)** — foco, labels ARIA nos multi-selects e modais.

## 🧱 Refatorações (rumo à modularização)

- [ ] **Sprint 2:** extrair `<style>` para `css/styles.css`.
- [ ] **Sprint 3:** extrair `<script>` para `js/app.js`.
- [ ] **Sprint 5:** quebrar `js/app.js` em módulos ES por domínio
  (`api.js`, `auth.js`, `pipeline.js`, `filters.js`, `render/`, `export.js`,
  `ia.js`, `usuarios.js`, `alertas.js`, `utils.js`).
- [ ] **Migrar handlers inline** (`onclick`/`onchange`) para
  `addEventListener` — só depois da modularização, com cuidado para não perder
  bindings.

## ⚡ Performance

- [ ] Reduzir re-renders totais em cada `applyFilters` (renderizar só a aba ativa).
- [ ] Memoizar agregações reutilizadas por `renderDashboard`, `getAnalyticsData`
  e `prepareAIContext`.
- [ ] Avaliar tamanho do cache em `localStorage` para bases grandes.

## 🔒 Segurança

- [ ] Login por `POST` (ver Alta prioridade).
- [ ] Autorização server-side (ver Alta prioridade).
- [ ] Revisar todos os `innerHTML` para garantir `escHtml` em campos vindos da
  planilha.
- [ ] Avaliar proteção do endpoint do Apps Script (token/segredo) sem quebrar o
  acesso público necessário.
- [ ] Tratar a chave Gemini em `localStorage` (escopo/ível de exposição a XSS).

## 🧩 Novos módulos (ideias, sem compromisso)

- [ ] Painel de metas/objetivos por loja.
- [ ] Exportação consolidada multi-período.
- [ ] Log de auditoria de edições inline.

---

> Antes de pegar qualquer item: reler `CLAUDE.md` (§4 "o que nunca alterar" e
> §18 checklist) e registrar o resultado no `CHANGELOG.md`.
