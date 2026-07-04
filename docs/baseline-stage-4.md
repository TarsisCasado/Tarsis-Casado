# Baseline de Regressão — Stage 4 (Sprint 3: separação do JavaScript)

Registro do estado do sistema **antes** de mover o JavaScript para arquivo
externo. Serve para provar, após a mudança, que nada de comportamento/estrutura
mudou. Extração **literal** — nenhuma função, nome, ordem, comentário ou
espaçamento alterado.

Data: 2026-07-04.

## Localização do bloco `<script>` inline

| Marcador | Linha |
|---|---|
| `<script>` (abertura) | **993** |
| Conteúdo JavaScript | linhas **994–5419** |
| `</script>` (fechamento) | **5420** |
| `</body>` | 5421 |
| `</html>` | 5422 |

> As 4 tags `<script src="https://…">` das libs CDN (linhas 11–14) **não** fazem
> parte deste bloco e permanecem intactas no `<head>`.

## Hash de verificação (SHA-256)

| Trecho | SHA-256 |
|---|---|
| Conteúdo JS (linhas 994–5419, entre as tags) | `5280ee6e056b33ea7bcf776175447fb54f04eede5ed9a3325eea49d2251a1f43` |

> Após a extração, `js/app.js` deve ter **exatamente** este SHA-256.

## Métricas do JavaScript (antes)

| Métrica | Valor |
|---|---|
| Linhas de JS | **4426** |
| Tamanho do script | **239281 bytes** |
| Funções nomeadas (`function nome(`) | **269** |
| Funções `async` | **36** |
| `function(` (anônimas/expressões) | **2** |
| Classes | **0** |
| Variáveis globais top-level (`let/const/var` na coluna 0) | **30** |
| `addEventListener` | **6** |
| `setInterval` | **1** |
| `setTimeout` | **16** |

## Estrutura do index.html (deve permanecer)

| Item | Valor |
|---|---|
| Linhas totais (antes) | 5421 |
| Abas (`data-tab`) | 14 |
| Libs CDN (`<script src=https>`) | 4 (SheetJS, Chart.js, html2canvas, jsPDF) |
| `<link rel="stylesheet" href="css/styles.css">` | presente (Sprint 2) |

## Eventos inline no HTML (devem permanecer idênticos)

| Handler | Ocorrências |
|---|---|
| `onclick=` | 149 |
| `onchange=` | 34 |
| `oninput=` | 27 |
| `onkeydown=` | 3 |
| `ondragover=` | 3 |
| `ondrop=` | 3 |
| `ondragleave=` | 3 |

## IDs críticos (devem permanecer presentes)

`login-screen`, `main-header`, `main-tabs`, `tab-dashboard`, `tab-tabela`,
`tab-ia`.

## Resultado esperado após a Sprint 3

- `index.html`: bloco `<script>…</script>` (linhas 993–5420) substituído por
  uma única linha `<script src="js/app.js"></script>` (perde 4426 linhas de JS).
- `js/app.js`: novo, com SHA-256 idêntico (`5280ee6e…`).
- Todos os contadores acima (funções, globais, listeners, eventos inline, abas,
  libs CDN, IDs) permanecem idênticos.
- Ordem de carregamento preservada: as 4 libs CDN no `<head>` continuam antes do
  `js/app.js` (que fica no fim do `<body>`, mesma posição do bloco original).
