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
