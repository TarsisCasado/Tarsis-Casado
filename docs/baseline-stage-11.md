# Baseline — Stage 11 (domínio Usuários → `js/users.js`)

Terceira separação física de domínio, **script clássico** (sem `type="module"`/
`import`/`export`). Move **apenas** as 11 funções do escopo + `usuariosListCache`.

Data: 2026-07-04.

## Identidade / contadores (antes)

| Métrica | Valor |
|---|---|
| SHA-256 `js/app.js` (antes) | `150f566feee08aa791f398d99329d9379f57dfa8f216883000813659974bbaf5` |
| Matches `^function ` em `js/app.js` (antes) | 260 |
| Funções de Usuários a mover | 11 |
| Matches `^function ` esperados em `js/users.js` | 11 |
| Matches `^function ` esperados em `js/app.js` (depois) | 249 |
| Abas (`data-tab`) | 14 |

## Funções do domínio Usuários que SERÃO movidas (escopo autorizado)

`loadUsuarios`, `getUserPerms`, `setUserPerms`, `buildLojasCheckboxes`,
`toggleAllLojas`, `syncLojasAllCheckbox`, `buildAbasCheckboxes`, `onPerfilChange`,
`renderUsuarios`, `salvarUsuario`, `toggleUsuario` + variável `usuariosListCache`.

Faixas de linha (não-contíguas): 1116–1119, 1133–1134, 1144–1159, 1161–1172,
1174–1192, 1221–1261.

## Funções relacionadas que PERMANECEM em `js/app.js` (fora do escopo / compartilhadas)

| Fica em app.js | Motivo |
|---|---|
| `ABAS_USUARIO` (const) | também usada por `aplicarAbasUI` (auth) |
| `getAllUserPerms` | helper; chamada por getUserPerms/setUserPerms em runtime |
| `parseLista` | também usada por `aplicarPermissoesUsuario` (auth) e renderUsuarios/editUsuario |
| `getAllLojas` | helper de lojas |
| `getLojasSelecionadas` | helper; chamada por salvarUsuario em runtime |
| `openModalNovoUsuario`, `editUsuario` | **não** estão no escopo desta sprint |

## Variáveis usadas por Usuários

- **`usuariosListCache`** (`let`, move): escrita em `renderUsuarios` (1176), lida
  em `editUsuario` (1205, **fica** em app.js). Como scripts clássicos
  compartilham o **escopo global léxico**, `editUsuario` (app.js) lê a `let`
  declarada em `users.js` em runtime. ✅
- **Dependências externas** (permanecem em app.js, runtime): `callAPI`, `SESSION`,
  `showToast`, `closeModal`, `escHtml`, `normHdrEmpresa`, `loadJsonLocal`,
  `saveJsonLocal`, `STATE`, e os helpers acima.

## Referências cruzadas resultantes (todas em runtime — corpos de função)

| De (arquivo) | Para (arquivo) |
|---|---|
| `getUserPerms`/`setUserPerms` (users) → `getAllUserPerms` (app) | ✅ runtime |
| `buildLojasCheckboxes` (users) → `getAllLojas` (app) | ✅ runtime |
| `buildAbasCheckboxes` (users) → `ABAS_USUARIO` (app) | ✅ runtime |
| `salvarUsuario` (users) → `getLojasSelecionadas` (app) | ✅ runtime |
| `renderUsuarios` (users) → `parseLista`, `getUserPerms` | ✅ runtime |
| `aplicarPermissoesUsuario` (app) → `getUserPerms` (users) | ✅ runtime |
| `editUsuario`/`openModalNovoUsuario` (app) → `buildLojasCheckboxes`/`buildAbasCheckboxes`/`onPerfilChange`/`usuariosListCache` (users) | ✅ runtime |
| `switchTab` (app) → `loadUsuarios` (users) | ✅ runtime |

## Quem chama as funções de Usuários

- `switchTab` (`js/app.js:1929`): `if(name==='usuarios'){loadUsuarios();...}`
- `aplicarPermissoesUsuario` (`js/app.js:341`): `getUserPerms`
- `editUsuario`/`openModalNovoUsuario` (app.js): build*Checkboxes, onPerfilChange
- Handlers inline (index.html): `onPerfilChange` (957), `toggleAllLojas` (962),
  `salvarUsuario` (972); `editUsuario`/`toggleUsuario` gerados por
  `renderUsuarios` via innerHTML.
- Compat layer: `CarmaisApp.users` (loadUsuarios, salvarUsuario, toggleUsuario,
  getUserPerms, setUserPerms); `CarmaisHandlers` (salvarUsuario, toggleUsuario,
  onPerfilChange, toggleAllLojas, syncLojasAllCheckbox).

## Funções de Usuários que precisam estar em `window`

Handlers inline/innerHTML: `salvarUsuario`, `toggleUsuario`, `onPerfilChange`,
`toggleAllLojas`, `syncLojasAllCheckbox` (+ `editUsuario` que **fica**). Em
script clássico, `function` no topo de `users.js` já vira `window.*`
automaticamente.

## Handlers inline relacionados (`index.html`)

- `onchange="onPerfilChange()"` (957)
- `onchange="toggleAllLojas(this.checked)"` (962)
- `onclick="salvarUsuario()"` (972)
- gerados em innerHTML por `renderUsuarios`: `editUsuario(...)`, `toggleUsuario(...)`
- gerado por `buildLojasCheckboxes`: `syncLojasAllCheckbox()`

## Ordem de carregamento

`users.js` **antes** de `app.js` (após history/alerts). Só declara; dependências
acessadas em runtime. Compat layer (fim de app.js) referencia os globais já
declarados por `users.js`. ✅

## Resultado esperado

- `js/app.js`: 260 → 249 matches `^function `; funções do escopo removidas;
  helpers e `openModalNovoUsuario`/`editUsuario` permanecem; pointer comment.
- `js/users.js`: 11 funções + `usuariosListCache`; código idêntico ao original.
- `index.html`: só a inclusão de `<script src="js/users.js">` antes de `app.js`.
- `window.*` das funções de Usuários acessível; `CarmaisApp.users` e
  `CarmaisHandlers` completos; 14 abas; `css` intacto.
