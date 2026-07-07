# Dashboard Seminovos — Grupo Carmais

Dashboard corporativo de gestão de **avaliações e compras de veículos seminovos**
do Grupo Carmais. Usado diariamente em produção pela equipe de gestão para
acompanhar captação, desempenho de vendedores/lojas, cruzamento entre veículos
avaliados e comprados, análises avançadas e um copiloto de IA.

> ⚠️ **Este documento descreve o sistema como ele é hoje** (pós Sprints 2–5.5 do
> `ROADMAP.md`). O CSS e o JavaScript já foram extraídos do `index.html` para
> arquivos externos — **mas o comportamento do sistema permanece 100%
> idêntico** ao da versão monolítica original. Toda extração foi literal,
> validada com `node --check` e smoke tests, sem alterar nenhuma regra de
> negócio. Ver `CHANGELOG.md` para o histórico completo dessas mudanças.

---

## 1. Visão geral do sistema

O sistema é uma **Single Page Application (SPA)** sem framework e sem build,
hoje organizada em **múltiplos scripts clássicos** (não ES Modules — ver seção
3.1). O HTML estrutural vive em `index.html`, o CSS em `css/styles.css` e o
JavaScript está dividido entre `js/app.js` (núcleo, ainda a maior parte da
lógica) e 5 módulos de domínio já extraídos (`js/history.js`, `js/alerts.js`,
`js/users.js`, `js/comprador.js`, `js/exports.js`). Não há `node_modules`, não
há passo de build, não há `package.json`.

O "backend" é um **Google Apps Script** publicado como Web App, que lê e grava
em uma planilha do **Google Sheets** (que funciona como banco de dados). O
front-end conversa com esse Apps Script exclusivamente por requisições HTTP
`GET` (JSON de resposta).

A camada de Inteligência Artificial usa a **API do Google Gemini**
(`generativelanguage.googleapis.com`) diretamente do navegador.

```
Navegador (index.html)  ⇄  Google Apps Script (Web App)  ⇄  Google Sheets
        │
        └──────────────⇄  Google Gemini API (copiloto de IA)
```

## 2. Objetivo do projeto

- Centralizar as **avaliações** de veículos e as **compras** efetivadas.
- **Cruzar** avaliação ↔ compra (por placa/chassi) para medir **captação**
  (quantos avaliados viraram comprados).
- Fornecer **KPIs**, **gráficos**, **rankings** (vendedor, loja, precificador)
  e **análises avançadas** (FIPE, objetivo, classificação, temporal etc.).
- Permitir **exportação** (Excel, PDF, imagem/WhatsApp) de relatórios.
- Oferecer um **copiloto de IA** que responde perguntas sobre os dados filtrados.
- Gerenciar **usuários e permissões** (perfil master vs. usuário comum).
- Gerar **scripts de alertas** automáticos para os compradores.

## 3. Tecnologias utilizadas

| Camada | Tecnologia |
|---|---|
| Front-end | HTML5, CSS3 (custom properties), JavaScript (ES2017+, sem framework) |
| Gráficos | [Chart.js 4.4.0](https://www.chartjs.org/) (CDN) |
| Planilhas | [SheetJS / xlsx 0.18.5](https://sheetjs.com/) (CDN) — leitura de `.xlsx/.csv` |
| Exportação | [html2canvas 1.4.1](https://html2canvas.hertzen.com/) + [jsPDF 2.5.1](https://github.com/parallax/jsPDF) (CDN) |
| Backend | Google Apps Script (Web App `doGet`) |
| Banco de dados | Google Sheets |
| IA | Google Gemini API (`gemini-3.1-flash-lite` + fallbacks) |
| Fontes | Google Fonts (Syne, Inter, DM Sans) |
| Hospedagem | GitHub Pages (workflow `.github/workflows/pages.yml`) |

> Todas as bibliotecas de front-end são carregadas via **CDN** — não há
> `package.json` nem instalação local.

### 3.1 Arquitetura JS atual: scripts clássicos, não ES Modules

Os arquivos `.js` são **scripts clássicos** (`<script src="...">`, sem
`type="module"`) que compartilham um único escopo global — exatamente como no
`index.html` monolítico original. Isso é uma decisão deliberada (ver
`CLAUDE.md` e `docs/modularization-plan.md`): funções chamadas por handlers
inline do HTML (`onclick="doLogin()"`) e por `innerHTML` gerado em runtime só
funcionam sem alteração adicional em script clássico. Migrar para ES Modules
exigiria reexpor manualmente dezenas de funções em `window` — está planejado,
mas **não foi feito ainda**.

Cada módulo extraído só **declara** funções/variáveis; nenhum executa lógica no
carregamento. Dependências entre arquivos (ex.: `js/alerts.js` lendo
`compradoresList`, que vive em `js/comprador.js`) são resolvidas **em tempo de
execução**, nunca no momento do load — por isso a **ordem das tags `<script>`**
importa (ver seção 4.2).

## 4. Estrutura atual

```
Tarsis-Casado/
├── index.html                     ← estrutura HTML + <link>/<script> externos
├── css/
│   └── styles.css                 ← todo o CSS (design system, temas, componentes)
├── js/
│   ├── history.js                 ← módulo: Histórico (2 funções)
│   ├── alerts.js                  ← módulo: Alertas (3 funções)
│   ├── users.js                   ← módulo: Usuários (11 funções)
│   ├── comprador.js               ← módulo: Comprador — Visão + CRUD (11 funções)
│   ├── exports.js                 ← módulo: Exportações (11 funções)
│   └── app.js                     ← NÚCLEO: API, auth, carga, crossJoin, filtros,
│                                     dashboard, tabelas, analytics, IA, compat layer
├── docs/
│   ├── baseline-stage-*.md        ← baselines de regressão de cada sprint
│   └── modularization-plan.md     ← plano técnico de modularização (vivo)
├── .github/
│   └── workflows/
│       └── pages.yml              ← deploy automático no GitHub Pages
├── .gitignore
├── README.md                      ← este arquivo
├── ARCHITECTURE.md                ← arquitetura detalhada
├── CLAUDE.md                      ← manual para IAs/devs que forem editar
├── LOVABLE.md                     ← guia específico para evolução via Lovable
├── CHANGELOG.md                   ← histórico de versões
├── TODO.md                        ← backlog técnico
└── ROADMAP.md                     ← plano de sprints
```

### 4.1 Módulos JS já separados

| Arquivo | Domínio | Funções | Linhas |
|---|---|---|---|
| `js/history.js` | Histórico de ações | 2 | 34 |
| `js/alerts.js` | Config. e geração do script de alertas | 3 | 109 |
| `js/users.js` | CRUD de usuários e permissões | 11 | 107 |
| `js/comprador.js` | Visão Comprador + CRUD de compradores | 11 | 174 |
| `js/exports.js` | Excel/PDF/imagem (Dashboard e Análise) | 11 | 168 |
| `js/app.js` | **Núcleo** — tudo o mais (API, login, carga, `crossJoin`, filtros, dashboard, tabelas, analytics, IA, e a camada de compatibilidade `window.CarmaisApp`/`window.CarmaisHandlers`) | 227 | 4025 |

### 4.2 Ordem de carregamento dos arquivos

A ordem no `<head>`/`<body>` do `index.html` é fixa e importa:

```html
<!-- <head> -->
<link rel="stylesheet" href="css/styles.css"/>
<script src="https://.../xlsx.full.min.js"></script>      <!-- SheetJS -->
<script src="https://.../chart.umd.min.js"></script>      <!-- Chart.js -->
<script src="https://.../html2canvas.min.js"></script>
<script src="https://.../jspdf.umd.min.js"></script>

<!-- fim do <body>, nesta ordem -->
<script src="js/history.js"></script>
<script src="js/alerts.js"></script>
<script src="js/users.js"></script>
<script src="js/comprador.js"></script>
<script src="js/exports.js"></script>
<script src="js/app.js"></script>   <!-- SEMPRE por último -->
```

- As 4 libs de CDN carregam **antes** de qualquer script local — usadas só
  dentro de corpos de função (runtime), nunca no load.
- Os 5 módulos de domínio carregam **antes** de `js/app.js`, que roda por
  último e contém o listener único `DOMContentLoaded` (bloco `INIT`) e a
  camada de compatibilidade (`window.CarmaisApp`, `window.CarmaisHandlers`).
- **Não reordene** essas tags sem entender as dependências cruzadas descritas
  em `docs/baseline-stage-9.md` a `13.md` e em `docs/modularization-plan.md`.

## 5. Como executar localmente

O projeto é estático. Não há passo de build — mas agora tem **múltiplos
arquivos** (`css/styles.css` + 6 arquivos em `js/`), então **servir por `file://`
não é recomendado** (alguns navegadores bloqueiam `fetch`/scripts locais nesse
esquema).

**Servidor estático local (recomendado):**

```bash
# Python
python3 -m http.server 8080
# ou Node
npx serve .
```

Depois acesse `http://localhost:8080`.

Para logar você precisa de uma **URL válida do Apps Script** (ver seção 7) e de
credenciais cadastradas na planilha de usuários. A URL padrão já vem embutida na
constante `DEFAULT_API_URL` (em `js/app.js`).

**Validação rápida de que os arquivos estão corretos** (sem precisar de
backend):

```bash
node --check js/app.js js/history.js js/alerts.js js/users.js js/comprador.js js/exports.js
```

Se todos passarem sem erro, os arquivos JS estão sintaticamente válidos. A tela
de login deve aparecer estilizada (CSS carregado) e o console do navegador (F12)
não deve mostrar `404` para nenhum `js/*.js` nem para `css/styles.css`.

## 6. Como publicar no GitHub Pages

O deploy é automático via GitHub Actions (`.github/workflows/pages.yml`):

- O workflow publica o repositório inteiro (`path: '.'`) no GitHub Pages.
- **Gatilho atual:** `push` na branch **`claude/charming-gauss-NX5Mu`**
  (além de `workflow_dispatch` manual).

> ⚠️ **Atenção:** o deploy só dispara na branch configurada no `pages.yml`.
> Alterações em outras branches (incluindo branches de trabalho) **não** vão
> ao ar até serem levadas para a branch de deploy. Ao mudar a branch de deploy,
> atualize o `pages.yml`.

## 7. Como conectar ao Google Apps Script

1. Crie/abra o projeto do **Apps Script** vinculado à planilha do Google Sheets.
2. Implemente um Web App com `doGet(e)` que trate os parâmetros `action` (ver
   lista em `ARCHITECTURE.md` → Pipeline de carregamento) e responda **sempre**
   no formato JSON:
   ```json
   { "ok": true,  "data": <payload> }
   { "ok": false, "error": "mensagem" }
   ```
3. Publique como **Web App** com acesso **"Qualquer pessoa"**.
4. Copie a URL `https://script.google.com/macros/s/.../exec`.
5. No sistema, a URL pode vir de duas fontes (ver `loadSavedApiUrl`):
   - a constante `DEFAULT_API_URL` embutida em `index.html`; ou
   - o campo em **⚙️ Config Script** (persistido em
     `localStorage['carmais_api_url']`).

O front-end monta a chamada como
`API_URL + '?action=...&param=...&_ts=<timestamp>'`. O `_ts` é um cache-buster.

## 8. Como funciona o Google Sheets

A planilha atua como banco de dados com (ao menos) as abas:

| Aba lógica | Conteúdo | `action` de leitura |
|---|---|---|
| **AVALIACOES** | veículos avaliados (data, empresa, vendedor, placa, chassi/VIN, modelo, valor avaliado, FIPE, objetivo, precificador…) | `getAvaliacoes` |
| **COMPRADOS** | veículos comprados (placa, chassi/VIN, empresa, data compra, e campos de inclusão manual) | `getComprados` |
| **EQUIPES** | vendedores → tipo e empresa/loja | `getEquipes` |
| **COMPRADOR** | dados complementares por placa (melhorado, valor melhorado, comprador, negócio fechado, data melhoria) | `getComprador` |
| **USUARIOS** | login, senha, perfil, lojas, abas | `getUsuarios` / `login` |
| **HISTORICO** | log de ações | `getHistorico` |

O front-end **normaliza** os cabeçalhos (aceita várias grafias em PT-BR — ver
`normalizeAvFromSheets`, `getAnyField`, `CAMPOS`) para tolerar variações de
nomenclatura entre planilhas.

## 9. Fluxo geral do sistema

```
Login → Permissões → Carga (cache ou Sheets) → crossJoin (cruzamento)
      → Filtros → KPIs/Gráficos/Rankings → Tabelas → Exportação / IA
```

Detalhamento completo em `ARCHITECTURE.md`. Em resumo:

1. **Login** (`doLogin`) valida credenciais no Apps Script → preenche `SESSION`.
2. **Permissões** (`aplicarPermissoesUsuario`) definem abas e lojas visíveis.
3. **Carga** (`loadDataFromSheets`) usa cache local (TTL 30 min) ou busca as 4
   abas em paralelo.
4. **Cruzamento** (`crossJoin`) vincula compras a avaliações e calcula órfãos.
5. **Filtros** (`applyFilters`/`passesFilters`) produzem `STATE.filtered`.
6. **Renderização** (`renderDashboard`, tabelas, analytics) desenha a UI.
7. **Exportação/IA** consomem os dados já filtrados.

## 10. Estrutura das pastas

A separação física em `css/` e `js/` (Sprints 2 e 3 do `ROADMAP.md`) **já foi
executada** — ver seção 4. A modularização de `js/app.js` em domínios menores
está **em andamento** (Sprint 5, 5 de ~20 domínios extraídos até agora — ver
`docs/modularization-plan.md` §8 para o estado exato e a próxima ordem
recomendada). Ainda faltam extrair: Utils, API, Auth, Carga de Dados,
CrossJoin, Filtros, Dashboard, Tabelas, IA e Analytics, entre outros blocos
menores.

## 11. Boas práticas (adotadas e a manter)

- **Não quebrar retrocompatibilidade** com a planilha e com o Apps Script.
- **Sempre escapar** conteúdo dinâmico inserido via `innerHTML` com `escHtml`.
- **Destruir instâncias de Chart.js** antes de recriar (`CHARTS[id].destroy()`).
- **Tolerar variações de cabeçalho** da planilha (`getAnyField`).
- **Tratar erros de rede** com timeout/retry e sinalizar o estado em `setCloud`.
- **Cache-buster `_ts`** em toda chamada de leitura ao Apps Script.
- **Extração de módulos JS é sempre literal** (copiar/colar, sem reescrever) e
  validada com `node --check` + smoke test antes de remover do arquivo de
  origem — ver os `docs/baseline-stage-*.md` para o método usado em cada corte.

## 12. Convenções adotadas

- **Idioma:** todo o código, comentários e UI em **português (pt-BR)**.
- **Nomes de função:** `camelCase`, verbo no início (`render*`, `load*`,
  `salvar*`, `export*`, `apply*`).
- **Prefixos de estado interno:** propriedades "de sistema" em `STATE` usam
  underscore (`STATE._contagem`, `STATE._compradosSemAv`).
- **Chaves de `localStorage`:** prefixo `carmais_` (ex.: `carmais_api_url`,
  `carmais_data_cache_v1`, `carmais_gemini_key`).
- **`action`** é sempre o primeiro parâmetro de qualquer chamada ao Apps Script.
- **Resposta do backend:** sempre `{ok:boolean, data|error}`.

## 13. Observações para uso no Lovable

Este projeto pode ser importado e evoluído via **Lovable**. Antes de pedir
qualquer mudança à IA do Lovable, leia **`LOVABLE.md`** — ele resume o que pode
e o que não pode ser alterado, o estado atual dos módulos e os próximos passos
sugeridos. Pontos-chave:

- O projeto **não é React** e **não deve ser convertido para React** nesta
  fase — é HTML/CSS/JS puro com scripts clássicos. Se o Lovable sugerir
  reescrever em React automaticamente, **recuse** até que isso seja uma decisão
  explícita e aprovada (ver `CLAUDE.md`).
- Os 5 módulos já extraídos (`js/history.js`, `js/alerts.js`, `js/users.js`,
  `js/comprador.js`, `js/exports.js`) e o núcleo `js/app.js` **compartilham
  escopo global** propositalmente — não adicione `type="module"` nem
  `import`/`export` sem revisar `docs/modularization-plan.md` primeiro.
- A lógica de negócio crítica (`crossJoin`, cálculos de KPI, contrato com o
  Apps Script) está descrita em `CLAUDE.md` §4 ("O que NUNCA pode ser
  alterado") — trate essas regras como inegociáveis mesmo em um fluxo assistido
  por IA.

---

Documentos relacionados: `ARCHITECTURE.md`, `CLAUDE.md`, `LOVABLE.md`,
`CHANGELOG.md`, `TODO.md`, `ROADMAP.md`.
