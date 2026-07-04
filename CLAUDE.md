# CLAUDE.md — Manual permanente para IAs e desenvolvedores

Este arquivo é o **manual de operação** para qualquer IA (Claude, etc.) ou
desenvolvedor que for trabalhar neste repositório. **Leia-o inteiro antes de
tocar em qualquer código.** Ele complementa `README.md` (visão geral) e
`ARCHITECTURE.md` (arquitetura detalhada).

---

## 1. Objetivo do sistema

Dashboard corporativo do **Grupo Carmais** para gestão de **avaliações e compras
de veículos seminovos**: mede captação (avaliado → comprado), rankings de
vendedores/lojas/precificadores, análises avançadas, exportações, copiloto de IA,
gestão de usuários/permissões e geração de scripts de alerta.

**Está em produção e é usado diariamente. Qualquer regressão tem impacto real.**

## 2. Arquitetura (resumo)

- **Single-file:** todo o sistema vive em `index.html` (HTML + CSS + JS).
- **Backend:** Google Apps Script (Web App) sobre Google Sheets (banco).
- **IA:** Google Gemini API, chamada direto do navegador.
- **Estado:** objeto global `STATE` em memória + `localStorage` (cache/config).
- Detalhes completos em `ARCHITECTURE.md`.

## 3. Regras obrigatórias

1. **Preservar 100% do comportamento** salvo quando a tarefa pedir explicitamente
   uma mudança de comportamento aprovada.
2. **Nunca** alterar regra de negócio, cálculo, fluxo, layout ou integração sem
   pedido explícito e aprovado.
3. **Retrocompatibilidade absoluta** com o Google Sheets e o Apps Script: os
   nomes de `action`, o formato dos parâmetros e o contrato `{ok,data|error}`
   não mudam.
4. **Preservar a forma do `STATE`** — dezenas de funções dependem dela.
5. **Refatoração é mecânica e reversível:** mover/renomear com equivalência
   comportamental, nunca "melhorar de passagem".
6. **Um passo por vez.** Mudanças pequenas, verificáveis, seguindo o `ROADMAP.md`.
7. **Escapar sempre** conteúdo dinâmico injetado via `innerHTML` (`escHtml`).

## 4. O que NUNCA pode ser alterado (sem aprovação explícita)

- A lógica de **`crossJoin`** (cruzamento avaliação↔compra, órfãos, inclusões
  manuais) — é o coração do negócio.
- Os **cálculos de KPI** (captação, % FIPE, melhorados, médias).
- A **normalização de campos** da planilha (`normalizeAvFromSheets`,
  `getAnyField`, `CAMPOS`) — tolera variações de cabeçalho em produção.
- O **contrato com o Apps Script** (`action`, querystring, `_ts`, `{ok,data}`).
- O **fluxo de login** e o **sistema de permissões** (abas + lojas).
- Os **nomes de chaves do `localStorage`** (`carmais_*`) e a estrutura do cache.
- A **lógica da IA** (contexto, prompt, fallback de modelos).
- As **exportações** (PDF/Excel/imagem) e o CSS `export-clean`.
- O **CSS de design system** (variáveis, temas) — mudanças visuais são vedadas.

## 5. Padrões de código

- **Idioma:** pt-BR em código, comentários e UI.
- **Funções:** `camelCase`, verbo primeiro (`render*`, `load*`, `salvar*`,
  `export*`, `apply*`, `get*`).
- **Estado interno do STATE:** prefixo `_` (`STATE._contagem`).
- **Sem framework, sem build.** Não introduzir dependências novas sem aprovação.
- **Bibliotecas:** só via CDN, como as já existentes.
- **Comentários:** explicam o *porquê* das regras de negócio (o código já tem
  muitos — preserve-os ao mover blocos).

## 6. Convenções

- `action` é sempre o primeiro parâmetro de chamadas ao Apps Script.
- Respostas do backend: `{ok:true,data}` ou `{ok:false,error}`.
- Cache-buster `_ts=<Date.now()>` em toda leitura remota.
- Chaves `localStorage` com prefixo `carmais_`.
- Chart.js: `CHARTS[id].destroy()` antes de recriar.
- Datas: `parseDate` para ler, `dateStr`/`fmtDate`/`fmtDateForSheets` para formatar.
- Números BR: `parseNumBR` / `fmtBRL`.

## 7. Como criar novos módulos

Enquanto o projeto for single-file (até as Sprints de modularização):

1. Adicione a seção com um comentário de cabeçalho claro
   (`// ===== NOME DO MÓDULO =====`).
2. Exponha apenas as funções necessárias (evite novos globais; se precisar de
   estado, encapsule dentro do módulo ou use `STATE._novoCampo`).
3. Não crie um segundo caminho para algo que já existe (evite duplicações como o
   caso do multi-select).

Após a Sprint 5 (modularização em ES Modules), cada módulo será um arquivo em
`/js/modules/` com `import/export` — siga o padrão que estiver estabelecido.

## 8. Como criar novas abas

1. Adicione o botão em `<nav class="tabs-bar" id="main-tabs">` com
   `data-tab="minha-aba"` e `onclick="switchTab('minha-aba',this)"`. Use a classe
   `master-only` se for restrita ao perfil master.
2. Crie o container `<div id="tab-minha-aba" class="tab-content">…</div>`.
3. Se a aba puder ser liberada a usuário comum, inclua-a no array `ABAS_USUARIO`.
4. Se precisar carregar dados ao abrir, ligue o carregamento em `switchTab`
   (padrão já usado por outras abas).

## 9. Como criar novos gráficos

- Reutilize `renderLineChart(id, labels, data, label, color)` ou
  `renderDoughnut(id, labels, data, colors)`.
- Sempre guarde a instância em `CHARTS[id]` e destrua antes de recriar.
- Use `chartGridColor()` / `chartTickColor()` para respeitar o tema.
- Adicione o `<canvas id="...">` dentro de um `.chart-card`.

## 10. Como adicionar filtros

- Dashboard: adicione o controle na `.filters-bar`, com `onchange="applyFilters()"`
  (ou o multi-select correspondente), e trate o novo campo dentro de
  `passesFilters(r)`. Popular opções em `populateFilters`.
- Analytics/Visão Comprador têm filtros próprios (`getAnalyticsData` /
  `passesCompradorVisFilters`) — siga o padrão da aba.
- Não crie um novo sistema de multi-select: use o existente da aba.

## 11. Como funciona o Google Sheets

Banco de dados com abas AVALIACOES, COMPRADOS, EQUIPES, COMPRADOR, USUARIOS,
HISTORICO. O front-end normaliza cabeçalhos (aceita várias grafias pt-BR). Ver
`README.md` §8 e `ARCHITECTURE.md` §5. **Não** presuma nomes de coluna fixos —
use sempre `getAnyField`/`CAMPOS`.

## 12. Como funciona o Apps Script

Web App `doGet(e)` que roteia por `e.parameter.action` e responde JSON
`{ok,data|error}`. Publicado como "Qualquer pessoa". A URL vem de
`DEFAULT_API_URL` ou de `localStorage['carmais_api_url']`. Escritas grandes são
enviadas em **chunks de 15 linhas** (`callAPIChunked`). Lista de `action`s em
`ARCHITECTURE.md` §5.

## 13. Como funciona a IA

`sendAIMessage` → `prepareAIContext` (agrega `STATE.filtered`) + resumo
estruturado + `COPILOTO_CARMAIS_PROMPT` → `callGeminiWithFallback` (percorre
`GEMINI_FALLBACK_MODELS` com retry/backoff). Chave em
`localStorage['carmais_gemini_key']`. A IA responde **só** com base nos dados
filtrados. Ver `ARCHITECTURE.md` §9.

## 14. Como funciona o login

`doLogin` envia `{action:'login', login, senha}` ao Apps Script; a resposta
preenche `SESSION` (`usuario`, `nome`, `perfil`, `lojas`, `abas`).
`openDashboard` revela a UI e chama `aplicarPermissoesUsuario`. Ver
`ARCHITECTURE.md` §10. **Não** alterar o fluxo sem aprovação (há um item de
segurança planejado para mover a senha de GET para POST — Sprint 7).

## 15. Como funciona o sistema de permissões

- `perfil === 'master'` → vê tudo (`body.is-master`).
- Usuário comum → `SESSION.abasPermitidas` (abas liberadas) e
  `SESSION.lojasPermitidas` (lojas). `aplicarAbasUI` esconde abas;
  `restringirDadosPorLoja` filtra os dados na origem.
- Apoio local em `localStorage['carmais_user_perms']` (`getUserPerms`/`setUserPerms`).
- **Lembrete de segurança:** a restrição é client-side; a autoridade real deve
  estar no Apps Script.

## 16. Como funciona o STATE

Objeto global único com as bases (`avaliacoes`, `equipes`, `comprador`,
`comprados`), o recorte filtrado (`filtered`), estado de ordenação/paginação e
seleção de multi-selects. Campos internos usam prefixo `_`. **Preservar a forma
exata.** Ver `ARCHITECTURE.md` §3.

## 17. Como testar alterações

Não há suíte automatizada hoje. Teste manual mínimo (base real ou de teste):

1. **Login** com usuário master e com usuário comum (verifique abas/lojas).
2. **Carga:** confira o painel de diagnóstico (totais avaliações/comprados/
   vinculados/órfãos) e compare com o valor anterior (não deve mudar).
3. **Filtros:** aplique datas/lojas/vendedores e confira KPIs e tabela.
4. **Dashboard:** KPIs, gráficos e rankings renderizam sem erro no console.
5. **Análise Avançada** e **Visão Comprador:** filtros e tabelas.
6. **Exportação:** PDF, Excel e imagem geram corretamente.
7. **IA:** uma pergunta simples retorna resposta (com chave válida).
8. **Console limpo:** sem novos erros/exceções.

Registre no `CHANGELOG.md` o que mudou.

## 18. Checklist obrigatório antes de qualquer commit

- [ ] Nenhuma regra de negócio, cálculo ou fluxo foi alterado sem aprovação.
- [ ] A forma do `STATE` e o contrato com o Apps Script foram preservados.
- [ ] Nenhuma chave `localStorage` (`carmais_*`) foi renomeada/removida.
- [ ] Conteúdo dinâmico em `innerHTML` continua escapado (`escHtml`).
- [ ] Instâncias Chart.js são destruídas antes de recriar.
- [ ] Testes manuais da seção 17 executados; console sem novos erros.
- [ ] KPIs e contagens do diagnóstico idênticos ao baseline.
- [ ] `CHANGELOG.md` atualizado.
- [ ] Se mexeu no deploy, o `pages.yml` aponta para a branch correta.
- [ ] Commit pequeno, descritivo e reversível.

## 19. Princípios de arquitetura deste projeto

Sempre priorizar, nesta ordem:

1. **Simplicidade** — a solução mais simples que resolve.
2. **Legibilidade** — código e nomes que qualquer dev/IA entenda.
3. **Modularização** — separar responsabilidades (rumo do `ROADMAP.md`).
4. **Retrocompatibilidade** — nunca quebrar Sheets/Apps Script/estado.
5. **Baixo risco** — passos pequenos, reversíveis, verificáveis.

> Em caso de conflito entre "melhorar o código" e "não mudar comportamento",
> **não mudar comportamento vence**. Documente o débito em `TODO.md`.
