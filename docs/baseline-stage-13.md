# Baseline — Stage 13 (domínio Exportações → `js/exports.js`)

Quinta separação física, **script clássico**. Move as funções de exportação
(incluindo os 3 helpers de cor usados exclusivamente por elas). Duas regiões.

Data: 2026-07-04.

## Identidade / contadores (antes)

| Métrica | Valor |
|---|---|
| SHA-256 `js/app.js` (antes) | `84f09815c15441b248f7a576899d6bb6bebc208b55c1f3eded9fa3ba7d0da1af` |
| Matches `^function ` em `js/app.js` (antes) | 238 |
| Funções de Exportações a mover | 11 |
| Matches `^function ` esperados em `js/exports.js` | 11 |
| Matches `^function ` esperados em `js/app.js` (depois) | 227 |
| Abas (`data-tab`) | 14 |

## Funções do domínio Exportações que SERÃO movidas (escopo)

**Região A — `// EXPORT` (contígua 2384–2484):** `exportExcel`,
`getCurrentBgColor`, `getCurrentCardColor`, `rgbFromCssColor`, `withCleanExport`,
`exportPDF`, `exportJPEG`.

**Região B — export de seções da Análise (contígua 3890–3945):**
`exportSectionImage`, `exportSectionWhatsApp`, `exportAnalyticsPDF`,
`exportAnalyticsImage`.

> Os 3 helpers de cor (`getCurrentBgColor`, `getCurrentCardColor`,
> `rgbFromCssColor`) são usados **exclusivamente** por `exportPDF`/`exportJPEG`
> (linhas 2439/2446/2467) → entram no escopo ("auxiliares usadas exclusivamente
> por exportação"). `withCleanExport` idem (usado só em 2438/2466).

## Bibliotecas externas usadas (todas em RUNTIME, dentro dos corpos)

| Lib | Onde (na exportação) |
|---|---|
| **XLSX** (SheetJS) | `exportExcel` (2388–2390) |
| **jsPDF** (`window.jspdf`) | `exportPDF` (2437/2442), `exportAnalyticsPDF` (3926/3927) |
| **html2canvas** | `exportPDF`/`exportJPEG` (2440/2468), Região B (3895/3909/3924/3938) |

> As libs carregam no `<head>` (index.html linhas 11–14), **antes** de todos os
> scripts do `<body>`, e são referenciadas **apenas dentro de funções**
> (runtime). Nenhuma execução no load de `exports.js`.
> Obs.: `XLSX` também é usado por `processFile` (import de planilha), que
> **permanece** em `app.js` — o global `XLSX` continua acessível aos dois.

## Variáveis usadas por Exportações

- `STATE.filtered`/`STATE.avaliacoes` (leitura), `document`/DOM,
  `getComputedStyle`. Nenhuma variável de estado exclusiva do domínio.
- Dependências externas (permanecem em app.js, runtime): `dateStr`, `showToast`,
  `STATE`, e as libs CDN.

## Quem chama as funções de Exportações

| Chamador | Local |
|---|---|
| Handlers inline `onclick="exportExcel()/exportPDF()/exportJPEG()"` | index.html:270/271/273/328/360 |
| `onclick="exportAnalyticsPDF()/exportAnalyticsImage()"` | index.html:506/507 |
| `onclick="...exportSectionImage(...)/exportSectionWhatsApp(...)"` | index.html (10 seções da Análise) |
| compat layer (`CarmaisApp.exports`, `CarmaisHandlers`) | app.js:4148/4167 |

Todas em runtime (clique do usuário / referência do compat após load). ✅

## Funções que precisam estar em `window`

`exportExcel`, `exportPDF`, `exportJPEG`, `exportAnalyticsPDF`,
`exportAnalyticsImage`, `exportSectionImage`, `exportSectionWhatsApp` (handlers
inline). Os helpers (`getCurrentBgColor`/`getCurrentCardColor`/`rgbFromCssColor`/
`withCleanExport`) não têm handler, mas em script clássico também ficam em
`window.*` automaticamente.

## Handlers inline relacionados (`index.html`)

`exportExcel` (270/328/360), `exportPDF` (271), `exportJPEG` (273),
`exportAnalyticsPDF` (506), `exportAnalyticsImage` (507),
`exportSectionImage`/`exportSectionWhatsApp` (10 pares nas seções da Análise).

## Ordem de carregamento

`exports.js` **antes** de `app.js` (após os demais módulos):
```html
... history / alerts / users / comprador / exports / app ...
```
Só declara; libs e dependências acessadas em runtime; libs CDN já carregadas no
`<head>` antes de qualquer script de módulo. ✅

## Resultado esperado

- `js/app.js`: 238 → 227 matches `^function `; funções do escopo removidas
  (helpers de cor + withCleanExport incluídos); 2 pointer comments.
- `js/exports.js`: 11 funções; código idêntico ao original.
- `index.html`: só a inclusão de `<script src="js/exports.js">`.
- `window.*` das exportações acessível; XLSX/jsPDF/html2canvas só em runtime;
  `CarmaisApp.exports`/`CarmaisHandlers` completos; 14 abas; `css` intacto.
