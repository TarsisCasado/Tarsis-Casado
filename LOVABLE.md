# LOVABLE.md — Guia para evolução deste projeto via Lovable

Este documento é dirigido especificamente a quem for usar o **Lovable** (ou
outra IA de geração/edição de código) para continuar evoluindo este projeto.
Ele resume, em formato acionável, o que já está em `CLAUDE.md` e
`ARCHITECTURE.md` — leia-os também antes de pedir qualquer mudança grande.

---

## 1. Visão geral do sistema

**Dashboard Seminovos — Grupo Carmais**: sistema corporativo, **em produção e
usado diariamente**, para gestão de avaliações e compras de veículos seminovos.
Mede captação (avaliado → comprado), rankings de vendedores/lojas/precificadores,
oferece análises avançadas, exportações, um copiloto de IA (Gemini) e gestão de
usuários/permissões.

- **Front-end:** HTML + CSS + JavaScript **puro**, sem framework, sem build.
- **JavaScript:** scripts clássicos (`<script src="...">`), **não** ES Modules.
- **Backend:** Google Apps Script (Web App) sobre Google Sheets como banco de
  dados.
- **IA:** Google Gemini API, chamada direto do navegador.
- **Hospedagem:** GitHub Pages.

Qualquer regressão tem impacto real em um sistema usado todos os dias por uma
equipe. **Trate cada mudança com o mesmo cuidado que teria com uma alteração
em produção**, porque é exatamente isso que está acontecendo.

---

## 2. Como o Lovable deve evoluir este projeto

1. **Preserve o modelo de scripts clássicos.** Não converta `<script>` para
   `type="module"`, não introduza `import`/`export`. As funções chamadas por
   `onclick`/`onchange`/`oninput` no HTML (e geradas via `innerHTML` em
   runtime) dependem de estarem no escopo global (`window.*`) — isso já
   acontece automaticamente hoje. Uma migração para ES Modules é um projeto à
   parte, com plano próprio em `docs/modularization-plan.md`, e **não deve ser
   feita "de passagem"** ao implementar uma feature.
2. **Não reescreva em React, Vue ou qualquer framework.** O `ROADMAP.md`
   deliberadamente não inclui essa migração nesta fase. Se identificar que uma
   reescrita traria benefícios, **documente a sugestão** (ex.: em `TODO.md`)
   em vez de executá-la.
3. **Siga o padrão de extração de módulos já estabelecido**, se for continuar a
   modularização de `js/app.js`:
   - Leia `docs/modularization-plan.md` §8 para saber qual domínio extrair a
     seguir e por quê (ordem calculada por acoplamento/risco real).
   - Crie um `docs/baseline-stage-N.md` **antes** de mexer no código, com:
     SHA do arquivo de origem, funções do domínio, variáveis usadas, quem
     chama, contagem de funções antes/depois.
   - Copie o código **literalmente** (não reescreva, não "aproveite para
     melhorar") para o novo arquivo `js/<dominio>.js`.
   - Adicione a tag `<script src="js/<dominio>.js"></script>` **antes** de
     `<script src="js/app.js"></script>` no `index.html`.
   - Rode `node --check` em ambos os arquivos.
   - Valide com um smoke test (headless ou manual): funções críticas
     continuam `typeof === 'function'` em `window`, as 14 abas existem, sem
     erros de console.
   - Só então remova o código do arquivo de origem, deixando um comentário
     apontando para onde foi.
4. **Toda mudança de comportamento visível ao usuário requer aprovação
   explícita antes de ser implementada** — não assuma que "parece uma boa
   ideia" é suficiente. Isso vale especialmente para: cálculos de KPI, regra de
   cruzamento (`crossJoin`), fluxo de login/permissões, contrato com o Apps
   Script, exportações.
5. **Atualize a documentação junto com o código**: `CHANGELOG.md` (o que
   mudou), `TODO.md` (riscos/débitos identificados), `docs/modularization-plan.md`
   (se mexeu em módulos).

---

## 3. Regras do que NÃO alterar sem aprovação explícita

(Reprodução resumida de `CLAUDE.md` §4 — a fonte de verdade é sempre esse
arquivo.)

- A lógica de **`crossJoin`** (cruzamento avaliação↔compra, órfãos, inclusões
  manuais) em `js/app.js` — é o coração do negócio.
- Os **cálculos de KPI** (captação, % FIPE, melhorados, médias).
- A **normalização de campos** da planilha (`normalizeAvFromSheets`,
  `getAnyField`, `CAMPOS`) — tolera variações de cabeçalho em produção.
- O **contrato com o Apps Script** (`action`, querystring, `_ts`, formato
  `{ok,data|error}`).
- O **fluxo de login** e o **sistema de permissões** (abas + lojas).
- Os **nomes de chaves do `localStorage`** (prefixo `carmais_*`) e a estrutura
  do cache.
- A **lógica da IA** (contexto enviado ao Gemini, prompt, fallback de modelos).
- As **exportações** (PDF/Excel/imagem) e o CSS `export-clean`.
- O **CSS de design system** (variáveis, temas claro/escuro) — mudanças
  visuais amplas são vedadas sem pedido explícito.
- O **modelo de scripts clássicos** (ver seção 2, item 1).
- A **decisão de não migrar para React** (ver seção 2, item 2).

Se uma tarefa pedida parecer exigir tocar em algum desses pontos, **pare e
pergunte** antes de implementar.

---

## 4. Módulos atuais (estado real, ~15% modularizado)

| Arquivo | Domínio | Funções | Linhas |
|---|---|---|---|
| `js/history.js` | Histórico de ações | 2 | 34 |
| `js/alerts.js` | Configuração e geração do script de alertas | 3 | 109 |
| `js/users.js` | CRUD de usuários e permissões | 11 | 107 |
| `js/comprador.js` | Visão Comprador + CRUD de compradores | 11 | 174 |
| `js/exports.js` | Exportação Excel/PDF/imagem | 11 | 168 |
| `js/app.js` | **Núcleo** — API, login, carga de dados, `crossJoin`, filtros, dashboard, tabelas, análise avançada, IA, e a camada de compatibilidade `window.CarmaisApp`/`window.CarmaisHandlers` | 227 | 4025 |

**Ordem de carregamento** (fixa, não reordenar sem entender as dependências
cruzadas — ver `docs/modularization-plan.md`):

```html
<script src="js/history.js"></script>
<script src="js/alerts.js"></script>
<script src="js/users.js"></script>
<script src="js/comprador.js"></script>
<script src="js/exports.js"></script>
<script src="js/app.js"></script>   <!-- sempre por último -->
```

`css/styles.css` é referenciado por `<link>` no `<head>`. As 4 bibliotecas de
CDN (SheetJS, Chart.js, html2canvas, jsPDF) carregam antes de qualquer script
local.

---

## 5. Próximos módulos sugeridos (ordem recomendada)

Baseado em `docs/modularization-plan.md` §8, do menor para o maior risco:

**Podem sair a qualquer momento (🟢 muito seguro — zero dependência de `STATE`):**
1. `js/utils.js` — funções puras de data/número/string/normalização (24
   funções, usadas por quase tudo — extrair primeiro reduz o acoplamento das
   próximas extrações).
2. `js/toast.js` — sistema de notificações (`showToast`).
3. `js/cache-local.js` — cache de apoio em `localStorage`.
4. `js/smart-cache.js` — cache de dados com TTL.
5. `js/theme.js` — tema claro/escuro.

**Depois, com cuidado moderado (🟡/🟠):**
6. `js/api.js` — camada de comunicação com o Apps Script.
7. `js/uploads.js` — importação de planilhas.
8. `js/dashboard.js`, `js/filters.js` — dashboard e filtros.
9. `js/ia.js` — copiloto Gemini (620 linhas, 27 funções).
10. `js/analytics.js` — Análise Avançada (792 linhas, 31 funções — o maior
    domínio ainda não extraído).

**Só por último (🔴 núcleo — risco alto, exige baseline de contagens):**
11. Tabelas de detalhe + órfãos.
12. Auth/Login/Permissões.
13. Carga de Dados.
14. `crossJoin` + Inclusão Manual — **o mais crítico de todos**.
15. O que sobrar (`STATE`, `Tabs`, `INIT`, camada de compatibilidade) permanece
    em `js/app.js` como o "casco" final do sistema.

**Não pule direto para os itens 🔴** só porque parecem interessantes — cada
extração deve seguir a ordem de risco crescente, com baseline e validação, como
documentado em `docs/modularization-plan.md`.

---

## 6. Antes de pedir ao Lovable para "melhorar" algo

Pergunte-se:

- Isso muda algum cálculo, regra de negócio ou contrato de API? → Pare, peça
  aprovação.
- Isso introduz `type="module"`, `import`/`export`, ou um framework novo? →
  Não faça, a menos que explicitamente decidido em conjunto.
- Isso é puramente estético/CSS visível ao usuário? → Confirme antes, o design
  system é considerado estável.
- Isso é uma extração de módulo JS seguindo o processo da seção 2? → Ok,
  prossiga com baseline + validação.
- Isso é uma correção de bug comprovado, sem mudar comportamento esperado? →
  Ok, mas registre no `CHANGELOG.md`.

---

Documentos relacionados: `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`,
`docs/modularization-plan.md`, `CHANGELOG.md`, `TODO.md`, `ROADMAP.md`.
