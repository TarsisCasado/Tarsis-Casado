# Dashboard Seminovos — Grupo Carmais

Dashboard corporativo de gestão de **avaliações e compras de veículos seminovos**
do Grupo Carmais. Usado diariamente em produção pela equipe de gestão para
acompanhar captação, desempenho de vendedores/lojas, cruzamento entre veículos
avaliados e comprados, análises avançadas e um copiloto de IA.

> ⚠️ **Este documento descreve o sistema exatamente como ele é hoje.**
> A documentação foi criada na Sprint 1 (ver `ROADMAP.md`) **sem alterar uma
> única linha** de HTML, CSS ou JavaScript. O comportamento do sistema
> permanece 100% idêntico ao que está em produção.

---

## 1. Visão geral do sistema

O sistema é uma **Single Page Application (SPA) monolítica de arquivo único**:
todo o HTML, CSS e JavaScript vivem dentro de `index.html` (~5.800 linhas).
Não há build, não há dependências instaladas localmente, não há `node_modules`.

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

## 4. Estrutura atual

```
Tarsis-Casado/
├── index.html                     ← TODO o sistema (HTML + CSS + JS)
├── .github/
│   └── workflows/
│       └── pages.yml              ← deploy automático no GitHub Pages
├── .gitignore
├── README.md                      ← este arquivo
├── ARCHITECTURE.md                ← arquitetura detalhada
├── CLAUDE.md                      ← manual para IAs/devs que forem editar
├── CHANGELOG.md                   ← histórico de versões
├── TODO.md                        ← backlog técnico
└── ROADMAP.md                     ← plano de sprints
```

Dentro de `index.html` a organização (por comentários de seção) é:

- **`<head>` → `<style>`** — todo o CSS (design system via variáveis CSS, temas
  claro/escuro, componentes, responsividade).
- **`<body>`** — telas: login, header, barra de abas e os 14 `.tab-content`.
- **`<script>`** — toda a lógica: API, login, carga, pipeline de dados
  (`crossJoin`), filtros, renderização, exportação, IA, usuários, alertas.

## 5. Como executar localmente

O projeto é estático. Não há passo de build.

**Opção A — abrir direto:** basta abrir `index.html` no navegador. Funciona,
mas alguns navegadores restringem `fetch` a partir de `file://`.

**Opção B (recomendada) — servidor estático local:**

```bash
# Python
python3 -m http.server 8080
# ou Node
npx serve .
```

Depois acesse `http://localhost:8080`.

Para logar você precisa de uma **URL válida do Apps Script** (ver seção 7) e de
credenciais cadastradas na planilha de usuários. A URL padrão já vem embutida na
constante `DEFAULT_API_URL`.

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

Hoje o código é single-file; a "estrutura de pastas" é a listada na seção 4.
A separação física em pastas (`/css`, `/js`, `/js/modules`) está planejada para
as Sprints 2–5 do `ROADMAP.md` e **ainda não foi executada**.

## 11. Boas práticas (adotadas e a manter)

- **Não quebrar retrocompatibilidade** com a planilha e com o Apps Script.
- **Sempre escapar** conteúdo dinâmico inserido via `innerHTML` com `escHtml`.
- **Destruir instâncias de Chart.js** antes de recriar (`CHARTS[id].destroy()`).
- **Tolerar variações de cabeçalho** da planilha (`getAnyField`).
- **Tratar erros de rede** com timeout/retry e sinalizar o estado em `setCloud`.
- **Cache-buster `_ts`** em toda chamada de leitura ao Apps Script.

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

---

Documentos relacionados: `ARCHITECTURE.md`, `CLAUDE.md`, `CHANGELOG.md`,
`TODO.md`, `ROADMAP.md`.
