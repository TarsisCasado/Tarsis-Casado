# ROADMAP — Plano de evolução por sprints

Plano de evolução do Dashboard Seminovos Carmais, dividido em sprints
**independentes** e de **baixo risco**. Cada sprint entrega um sistema 100%
funcional; nenhuma sprint pode quebrar o comportamento em produção.

Princípios (ver `CLAUDE.md` §19): simplicidade, legibilidade, modularização,
retrocompatibilidade e baixo risco. **Este roadmap não inclui migração para
React** — a evolução é feita mantendo a base atual (HTML/CSS/JS).

Regra transversal: antes de cada sprint, capturar/atualizar o **baseline de
regressão** (KPIs e contagens do painel de diagnóstico) e, ao final, confirmar
que os valores permanecem idênticos.

---

## Sprint 1 — Documentação ✅ (atual)

**Objetivo:** transformar o projeto em software profissional do ponto de vista
de documentação, sem tocar no código.

- [x] `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `CHANGELOG.md`, `TODO.md`,
  `ROADMAP.md`.
- [x] Revisão cruzada dos documentos (sem contradições).

**Risco:** nenhum. **Critério de conclusão:** qualquer dev/IA entende o sistema
só pela documentação.

---

## Sprint 2 — Separação do CSS

**Objetivo:** extrair o bloco `<style>` de `index.html` para `css/styles.css`.

- [ ] Recortar o CSS **literalmente** (sem editar regras) para `css/styles.css`.
- [ ] Referenciar via `<link rel="stylesheet" href="css/styles.css">`.
- [ ] Conferir visual idêntico em tema claro e escuro, e no `export-clean`.

**Risco:** 🟢 baixo (corte mecânico). **Critério:** nenhuma diferença visual.

---

## Sprint 3 — Separação do JavaScript

**Objetivo:** extrair o bloco `<script>` para `js/app.js`.

- [ ] Recortar o JS **literalmente** para `js/app.js`.
- [ ] Referenciar via `<script src="js/app.js"></script>` (mesma posição/ordem).
- [ ] Garantir que os handlers inline (`onclick`/`onchange`) continuem
  encontrando as funções globais.

**Risco:** 🟢 baixo. **Critério:** login, carga, filtros, render, export e IA
funcionam exatamente como antes; console sem erros novos.

---

## Sprint 4 — Eliminação de duplicações

**Objetivo:** remover duplicações confirmadas, com equivalência comportamental.

- [ ] Unificar `updateMsLabel` (hoje definido 2×).
- [ ] Unificar os dois sistemas de multi-select (`.multi-select` vs `.ms-*`).
- [ ] Consolidar `DOMContentLoaded` e listeners de `document.click` repetidos.
- [ ] Extrair helper de montagem de querystring (`callAPI*`).
- [ ] Remover código morto (`carmais_claude_key`, alias de prompt).

**Risco:** 🟡 médio. **Critério:** comportamento idêntico; menos código.

---

## Sprint 5 — Modularização

**Objetivo:** quebrar `js/app.js` em módulos ES por domínio.

- [ ] Estrutura sugerida em `js/modules/`: `api.js`, `auth.js`, `pipeline.js`,
  `filters.js`, `render/` (dashboard/tabelas/analytics), `export.js`, `ia.js`,
  `usuarios.js`, `alertas.js`, `utils.js`.
- [ ] `import/export` explícitos; preservar a forma do `STATE`.
- [ ] Migrar handlers inline para `addEventListener` **somente** quando seguro.

**Risco:** 🟡 médio. **Critério:** paridade funcional total; `STATE` intacto.

---

## Sprint 6 — Performance

**Objetivo:** otimizar sem mudar resultados.

- [ ] Reescrever `crossJoin` com índices `Map` (de ~O(n²) para ~O(n)).
- [ ] Cachear referências de DOM em renders quentes.
- [ ] Renderizar apenas a aba ativa em `applyFilters`.
- [ ] Memoizar agregações reutilizadas.

**Risco:** 🟡 médio. **Critério:** KPIs/contagens idênticos; tempo de render menor.

---

## Sprint 7 — Segurança

**Objetivo:** fechar as lacunas mapeadas (requer coordenação com o Apps Script).

- [ ] Login via `POST` (tirar a senha da querystring).
- [ ] Validar permissões (abas/lojas) **no servidor** (Apps Script).
- [ ] Revisar `innerHTML` para garantir `escHtml` em dados da planilha.
- [ ] Reavaliar exposição da chave Gemini e proteção do endpoint.

**Risco:** 🔴 alto (toca backend). **Critério:** login e permissões funcionam;
sem regressão; sem senha em URL.

---

## Sprint 8 — Novos módulos

**Objetivo:** evoluir funcionalidades (após base modular e segura).

- [ ] Painel de metas/objetivos por loja.
- [ ] Log de auditoria das edições inline.
- [ ] Exportação consolidada multi-período.
- [ ] (Priorizar conforme necessidade do negócio.)

**Risco:** variável. **Critério:** cada módulo é opcional e isolado.

---

## Sprint 9 — Evoluções futuras

**Objetivo:** melhorias contínuas de UX e manutenção.

- [ ] Acessibilidade (a11y) em multi-selects, modais e navegação por teclado.
- [ ] Melhor UX de estado offline/cache.
- [ ] Internacionalização (se necessário).
- [ ] Testes automatizados básicos (smoke) para os pipelines críticos.

**Risco:** 🟢–🟡. **Critério:** melhorias mensuráveis sem regressão.

---

### Dependências entre sprints

```
S1 (docs) → S2 (css) → S3 (js) → S4 (dedup) → S5 (módulos) → S6 (perf)
                                                  └────────→ S7 (segurança)
S5/S7 → S8 (novos módulos) → S9 (evoluções)
```

- S2 e S3 são pré-requisito de todas as seguintes (código separado).
- S7 depende de coordenação com o Apps Script e pode correr em paralelo a S6
  após S5.
- Nenhuma sprint inclui migração para React (fora do escopo deste roadmap).
