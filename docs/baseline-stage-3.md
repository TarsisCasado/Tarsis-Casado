# Baseline de Regressão — Stage 3 (Sprint 2: separação do CSS)

Registro do estado do sistema **antes** de mover o CSS para arquivo externo.
Serve para provar, após a mudança, que nada de comportamento/estrutura mudou.

Data: 2026-07-04.

## Métricas do index.html (antes)

| Métrica | Valor |
|---|---|
| Linhas | **5793** |
| Tamanho | **340620 bytes** |
| `BUILD_TAG` | `2026-07-03c · inclusão manual salva no banco (Sheets) + sincronizar` |
| Bloco `<style>` | linha **15** (`<style>`) até linha **387** (`</style>`) |
| Conteúdo CSS interno | linhas **16–386** (371 linhas) |

## Hashes de verificação (SHA-256)

| Trecho | SHA-256 |
|---|---|
| Conteúdo CSS (linhas 16–386, entre as tags) | `e797543288dc5546041c6843958b1bebaebc0c820aa2502f4ad457fec9852990` |
| Bloco JavaScript (linha 1365 até o fim) | `8677a45cb7dcf0147466787fe569a3bb786ff7d08e7d9999d9eb79ee5fb50d24` |

> Após a extração, `css/styles.css` deve ter exatamente o mesmo SHA do conteúdo
> CSS acima, e o bloco JS deve permanecer com o mesmo SHA.

## Bibliotecas CDN (devem permanecer)

- SheetJS/xlsx 0.18.5 — `cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`
- Chart.js 4.4.0 — `cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`
- html2canvas 1.4.1 — `cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js`
- jsPDF 2.5.1 — `cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
- Google Fonts (Syne, Inter, DM Sans) — `<link>` mantido no `<head>`

## IDs críticos (devem permanecer presentes)

| ID | Status |
|---|---|
| `login-screen` | presente |
| `main-header` | presente |
| `main-tabs` | presente |
| `tab-dashboard` | presente |
| `tab-tabela` | presente |
| `tab-ia` | presente |

## Abas existentes (14 `data-tab`)

`alertas`, `analytics`, `comprador-vis`, `config-script`, `dashboard`,
`historico`, `ia`, `inclusao-manual`, `input-avaliacoes`, `input-comprados`,
`input-equipes`, `tabela`, `tabela-comprados`, `usuarios`.

## Contagem de handlers inline (devem permanecer idênticos)

| Handler | Ocorrências |
|---|---|
| `onclick=` | 149 |
| `onchange=` | 34 |
| `oninput=` | 27 |
| `onkeydown=` | 3 |
| `ondragover=` | 3 |
| `ondrop=` | 3 |

## Resultado esperado após a Sprint 2

- `index.html`: bloco `<style>…</style>` substituído por
  `<link rel="stylesheet" href="css/styles.css"/>` (perde 371 linhas de CSS).
- `css/styles.css`: novo, com SHA idêntico ao conteúdo CSS acima.
- Bloco JS: SHA inalterado.
- Todos os IDs, abas, libs CDN e handlers inline: contagens idênticas.
