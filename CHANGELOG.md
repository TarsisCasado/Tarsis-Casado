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
