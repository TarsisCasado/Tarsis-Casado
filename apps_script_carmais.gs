// =====================================================================
// CARMAIS SEMINOVOS — GOOGLE APPS SCRIPT (API)
// Versão: 1.1 | Autor: Sistema Carmais
// Publicar como: Web App > Qualquer pessoa
// =====================================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const ss = SpreadsheetApp.getActiveSpreadsheet();

// =====================================================================
// CORS + ROTEADOR PRINCIPAL
// =====================================================================
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    let params = {};

    if (e.parameter) {
      params = {};
      for (const key in e.parameter) {
        const val = e.parameter[key];
        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
          try { params[key] = JSON.parse(val); } catch(x) { params[key] = val; }
        } else {
          params[key] = val;
        }
      }
    }

    if (!params.action && e.postData && e.postData.contents) {
      try { params = JSON.parse(e.postData.contents); } catch(x) {}
    }

    const action = String(params.action || '').trim();
    if (!action) {
      throw new Error('Parametro "action" ausente. Recebido: ' + JSON.stringify(e.parameter));
    }

    const result = route(action, params);
    output.setContent(JSON.stringify({ ok: true, data: result }));
  } catch (err) {
    output.setContent(JSON.stringify({ ok: false, error: err.message }));
  }

  return output;
}

function route(action, params) {
  switch (action) {
    // AUTH
    case 'login':              return actionLogin(params);
    case 'logout':             return actionLogout(params);

    // LEITURA
    case 'getAvaliacoes':      return getAvaliacoes();
    case 'getComprados':       return getComprados();
    case 'getEquipes':         return getEquipes();
    case 'getComprador':       return getComprador();
    case 'getUsuarios':        return getUsuarios(params);
    case 'getHistorico':       return getHistorico(params);
    case 'getConfig':          return getConfig();
    case 'importFromSheet':    return importFromSheet(params);

    // GRAVAÇÃO — AVALIACOES
    case 'importAvaliacoes':   return importAvaliacoes(params);
    case 'clearAvaliacoes':    return clearAvaliacoes(params);
    case 'replaceAvaliacoes':  return replaceAvaliacoes(params);

    // GRAVAÇÃO — COMPRADOS
    case 'importComprados':    return importComprados(params);
    case 'clearComprados':     return clearComprados(params);
    case 'replaceComprados':   return replaceComprados(params);

    // GRAVAÇÃO — EQUIPES
    case 'importEquipes':      return importEquipes(params);

    // GRAVAÇÃO — COMPRADOR
    case 'importComprador':    return importComprador(params);

    // EDIÇÃO DE CAMPOS
    case 'updateField':        return updateField(params);
    case 'updateBuyerManual':  return updateBuyerManual(params);

    // USUÁRIOS
    case 'createUsuario':      return createUsuario(params);
    case 'updateUsuario':      return updateUsuario(params);

    // COMPRADORES DE USADOS (lista cadastral)
    case 'getCompradores':     return getCompradores(params);
    case 'createComprador':    return createComprador(params);
    case 'updateComprador':    return updateComprador(params);
    case 'deleteComprador':    return deleteComprador(params);

    default:
      throw new Error('Ação desconhecida: ' + action);
  }
}

// =====================================================================
// HELPERS DE ABA
// =====================================================================
function getSheet(name) {
  let sh = ss.getSheetByName(name);
  if (sh) return sh;

  const sheets = ss.getSheets();
  const nameLower = name.toLowerCase();
  for (const s of sheets) {
    if (s.getName().toLowerCase() === nameLower) return s;
  }

  const HEADERS = {
    'AVALIACOES': ['idAv','dataAv','empresa','vendedor','precificador','status','objetivo','valorAv','fipe','placa','marca','modelo','versao','anoModelo','km','aa','b2b','valorMelhorado','melhorado','negocioFechado','comprador','dataMelhoria'],
    'COMPRADOS': ['placa','chassi','empresa','dataCompra','modelo','vendedor'],
    'EQUIPES': ['nome','tipo','empresa'],
    'COMPRADOR': ['idAv','placa','chassi','valorMelhorado','comprador','melhorado','negocioFechado','dataMelhoria','updatedAt','updatedBy'],
    'USUARIOS': ['login','senha','nome','perfil','ativo','lojas','abas'],
    'COMPRADORES': ['nome','lojas','email','whatsapp','ativo'],
    'HISTORICO_USUARIOS': ['dataHora','usuario','perfil','acao','tela','aba','placa','empresa','vendedor','campoAlterado','valorAnterior','valorNovo','observacao'],
    'CONFIG': ['chave','valor']
  };

  const newSheet = ss.insertSheet(name);
  const headers = HEADERS[name.toUpperCase()] || ['coluna1'];
  const headerRange = newSheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1a73e8');
  headerRange.setFontColor('#ffffff');
  Logger.log('Aba criada automaticamente: ' + name);
  return newSheet;
}

function sheetToObjects(sheetName) {
  const sh = getSheet(sheetName);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];
  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim());
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined && row[i] !== null ? row[i] : ''; });
    return obj;
  }).filter(obj => Object.values(obj).some(v => v !== '' && v !== null && v !== undefined));
}

function getHeaders(sheetName) {
  const sh = getSheet(sheetName);
  const lastCol = sh.getLastColumn();

  if (lastCol === 0) {
    const HEADERS = {
      'AVALIACOES': ['idAv','dataAv','empresa','vendedor','precificador','status','objetivo','valorAv','fipe','placa','marca','modelo','versao','anoModelo','km','aa','b2b','valorMelhorado','melhorado','negocioFechado','comprador','dataMelhoria'],
      'COMPRADOS': ['placa','chassi','empresa','dataCompra','modelo','vendedor'],
      'EQUIPES': ['nome','tipo','empresa'],
      'COMPRADOR': ['idAv','placa','chassi','valorMelhorado','comprador','melhorado','negocioFechado','dataMelhoria','updatedAt','updatedBy'],
      'USUARIOS': ['login','senha','nome','perfil','ativo','lojas','abas'],
      'COMPRADORES': ['nome','lojas','email','whatsapp','ativo'],
      'HISTORICO_USUARIOS': ['dataHora','usuario','perfil','acao','tela','aba','placa','empresa','vendedor','campoAlterado','valorAnterior','valorNovo','observacao'],
      'CONFIG': ['chave','valor']
    };
    const key = sheetName.toUpperCase();
    const headers = HEADERS[key] || ['coluna1'];
    const range = sh.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setFontWeight('bold');
    range.setBackground('#1a73e8');
    range.setFontColor('#ffffff');
    return headers;
  }

  const vals = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  return vals.map(v => String(v).trim());
}

function appendRows(sheetName, rows) {
  if (!rows || rows.length === 0) return;
  const sh = getSheet(sheetName);
  const headers = getHeaders(sheetName);
  if (!headers || headers.length === 0) {
    throw new Error('Não foi possível determinar cabeçalhos para a aba: ' + sheetName);
  }
  const values = rows.map(row => headers.map(h => {
    const v = row[h];
    return (v !== undefined && v !== null) ? v : '';
  }));
  const startRow = Math.max(2, sh.getLastRow() + 1);
  sh.getRange(startRow, 1, values.length, headers.length).setValues(values);
}

function clearSheetData(sheetName) {
  const sh = getSheet(sheetName);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow > 1 && lastCol > 0) {
    sh.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}

function formatDateBR(d) {
  if (!d) return '';
  if (d instanceof Date) {
    return Utilities.formatDate(d, 'America/Fortaleza', 'dd/MM/yyyy');
  }
  return String(d);
}

function nowBR() {
  return Utilities.formatDate(new Date(), 'America/Fortaleza', 'dd/MM/yyyy HH:mm:ss');
}

// =====================================================================
// AUTH — LOGIN / LOGOUT
// =====================================================================
function actionLogin(params) {
  const login = String(params.login || '').trim();
  const senha = String(params.senha || '').trim();
  if (!login || !senha) throw new Error('Login e senha são obrigatórios');

  const usuarios = sheetToObjects('USUARIOS');
  if (!usuarios || usuarios.length === 0) {
    throw new Error('Nenhum usuário cadastrado. Execute setupPlanilha() no Apps Script Editor.');
  }

  const user = usuarios.find(u => {
    const ul = String(u.login || '').trim().toLowerCase();
    const pl = login.toLowerCase();
    const us = String(u.senha || '').trim();
    return ul === pl && us === senha;
  });

  if (!user) {
    const logins = usuarios.map(u => String(u.login||'').trim()).join(', ');
    throw new Error('Usuário ou senha incorretos. Usuários cadastrados: [' + logins + ']');
  }

  const ativo = String(user.ativo || '').trim().toLowerCase();
  if (ativo !== 'sim') throw new Error('Usuário inativo. Contate o administrador.');

  const perfil = String(user.perfil || 'usuario').trim().toLowerCase();
  const nome = String(user.nome || user.login).trim();

  logHistorico({
    usuario: nome,
    perfil: perfil,
    acao: 'LOGIN',
    tela: 'Tela de Login',
    observacao: 'Login realizado com sucesso'
  });

  // Devolve lojas e abas para o dashboard aplicar as permissões automaticamente.
  return {
    login: String(user.login).trim(),
    nome: nome,
    perfil: perfil,
    lojas: String(user.lojas || '').trim(),
    abas:  String(user.abas  || '').trim()
  };
}

function actionLogout(params) {
  const { usuario, perfil } = params;
  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: 'LOGOUT',
    tela: 'Sistema',
    observacao: 'Logout realizado'
  });
  return { ok: true };
}

// =====================================================================
// PERMISSÕES
// =====================================================================
function requireMaster(params) {
  if (!params.perfil || String(params.perfil).toLowerCase() !== 'master') {
    logHistorico({
      usuario: params.usuario || '',
      perfil: params.perfil || '',
      acao: 'TENTOU_ACAO_SEM_PERMISSAO',
      tela: params.tela || 'Sistema',
      observacao: 'Tentou executar ação restrita ao master: ' + params.action
    });
    throw new Error('Permissão negada. Esta ação requer perfil master.');
  }
}

// =====================================================================
// LEITURA DE DADOS
// =====================================================================
function getAvaliacoes() {
  return sheetToObjects('AVALIACOES');
}

function getComprados() {
  return sheetToObjects('COMPRADOS');
}

function getEquipes() {
  return sheetToObjects('EQUIPES');
}

function getComprador() {
  return sheetToObjects('COMPRADOR');
}

function getConfig() {
  try {
    return sheetToObjects('CONFIG');
  } catch(e) {
    return [];
  }
}

function getUsuarios(params) {
  requireMaster(params);
  const usuarios = sheetToObjects('USUARIOS');
  // Nunca retorna senhas; retorna lojas e abas para o dashboard.
  return usuarios.map(u => ({
    login:  u.login,
    nome:   u.nome,
    perfil: u.perfil,
    ativo:  u.ativo,
    lojas:  String(u.lojas || '').trim(),
    abas:   String(u.abas  || '').trim()
  }));
}

function getHistorico(params) {
  requireMaster(params);
  return sheetToObjects('HISTORICO_USUARIOS');
}

// =====================================================================
// GARANTIR CABEÇALHOS CORRETOS
// =====================================================================
function ensureHeaders(sheetName) {
  const HEADERS = {
    'AVALIACOES': ['idAv','dataAv','empresa','vendedor','precificador','status','objetivo','valorAv','fipe','placa','marca','modelo','versao','anoModelo','km','aa','b2b','valorMelhorado','melhorado','negocioFechado','comprador','dataMelhoria'],
    // COMPRADOS agora guarda também os campos da INCLUSÃO MANUAL (origem, valores
    // e auditoria) para que a inclusão fique no banco e apareça em qualquer acesso.
    'COMPRADOS': ['placa','chassi','empresa','dataCompra','modelo','vendedor','origem','vinReferencia','anoModelo','km','valorAvaliado','fipe','incluidoPor','incluidoEm'],
    'EQUIPES': ['nome','tipo','empresa'],
    'COMPRADOR': ['idAv','placa','chassi','valorMelhorado','comprador','melhorado','negocioFechado','dataMelhoria','updatedAt','updatedBy'],
    'USUARIOS': ['login','senha','nome','perfil','ativo','lojas','abas'],
    'COMPRADORES': ['nome','lojas','email','whatsapp','ativo'],
    'HISTORICO_USUARIOS': ['dataHora','usuario','perfil','acao','tela','aba','placa','empresa','vendedor','campoAlterado','valorAnterior','valorNovo','observacao'],
    'CONFIG': ['chave','valor']
  };
  const key = sheetName.toUpperCase();
  const headers = HEADERS[key];
  if (!headers) return null;

  const sh = getSheet(sheetName);
  const currentHeaders = sh.getLastColumn() > 0
    ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim())
    : [];

  // Aba nova (sem cabeçalhos): cria todos.
  if (currentHeaders.length === 0) {
    const range = sh.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
    return headers;
  }

  // Aba existente: apenas ADICIONA as colunas que faltam, no fim, SEM apagar
  // dados. (Nunca mais usa sh.clear() — que já apagou bases inteiras quando os
  // cabeçalhos divergiam.) Leitura/escrita são por NOME de coluna, então a
  // ordem não importa.
  let changed = false;
  headers.forEach(h => {
    if (!currentHeaders.includes(h)) {
      const newCol = sh.getLastColumn() + 1;
      sh.getRange(1, newCol).setValue(h);
      sh.getRange(1, newCol).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
      currentHeaders.push(h);
      changed = true;
    }
  });
  return changed ? getHeaders(sheetName) : currentHeaders;
}

// =====================================================================
// IMPORT AVALIAÇÕES
// =====================================================================
function importAvaliacoes(params) {
  requireMaster(params);
  const { rows, usuario, perfil } = params;
  if (!rows || !rows.length) throw new Error('Nenhuma linha para importar');
  ensureHeaders('AVALIACOES');

  const existing = sheetToObjects('AVALIACOES');
  const existingKeys = new Set(existing.map(r => makeAvKey(r)));

  const newRows = rows.filter(r => !existingKeys.has(makeAvKey(r)));
  appendRows('AVALIACOES', newRows);

  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: 'IMPORTOU_AVALIACOES',
    tela: 'Input Avaliações',
    aba: 'AVALIACOES',
    observacao: `Adicionadas ${newRows.length} novas avaliações (${rows.length - newRows.length} duplicatas ignoradas)`
  });

  return { inserted: newRows.length, duplicates: rows.length - newRows.length };
}

function replaceAvaliacoes(params) {
  requireMaster(params);
  const { rows, usuario, perfil } = params;
  ensureHeaders('AVALIACOES');
  clearSheetData('AVALIACOES');
  if (rows && rows.length) appendRows('AVALIACOES', rows);

  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: 'SUBSTITUIU_BASE',
    tela: 'Input Avaliações',
    aba: 'AVALIACOES',
    observacao: `Base substituída. ${rows ? rows.length : 0} linhas inseridas.`
  });

  return { replaced: rows ? rows.length : 0 };
}

function clearAvaliacoes(params) {
  requireMaster(params);
  const { usuario, perfil } = params;
  clearSheetData('AVALIACOES');

  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: 'APAGOU_INPUT',
    tela: 'Input Avaliações',
    aba: 'AVALIACOES',
    observacao: 'Dados da aba AVALIACOES apagados'
  });

  return { ok: true };
}

function makeAvKey(r) {
  const placa = String(r.placa || '').replace(/[\s\-]/g, '').toUpperCase();
  const dataAv = String(r.dataAv || '').split('T')[0];
  const empresa = String(r.empresa || '').trim().toUpperCase();
  return `${placa}|${dataAv}|${empresa}`;
}

// =====================================================================
// IMPORT COMPRADOS
// =====================================================================
function importComprados(params) {
  requireMaster(params);
  const { rows, usuario, perfil } = params;
  if (!rows || !rows.length) throw new Error('Nenhuma linha para importar');
  ensureHeaders('COMPRADOS');

  const existing = sheetToObjects('COMPRADOS');
  const existingKeys = new Set(existing.map(r =>
    normPlaca(r.placa) + '|' + normEmpresa(r.empresa)
  ));

  const newRows = rows.filter(r =>
    !existingKeys.has(normPlaca(r.placa) + '|' + normEmpresa(r.empresa))
  );
  if (newRows.length) appendRows('COMPRADOS', newRows);

  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: 'IMPORTOU_COMPRADOS',
    tela: 'Input Comprados',
    aba: 'COMPRADOS',
    observacao: `Adicionados ${newRows.length} comprados novos`
  });

  return { inserted: newRows.length, duplicates: rows.length - newRows.length };
}

function replaceComprados(params) {
  requireMaster(params);
  const { rows, usuario, perfil } = params;
  ensureHeaders('COMPRADOS');
  clearSheetData('COMPRADOS');
  if (rows && rows.length) appendRows('COMPRADOS', rows);

  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: 'SUBSTITUIU_BASE',
    tela: 'Input Comprados',
    aba: 'COMPRADOS',
    observacao: `Base de comprados substituída. ${rows ? rows.length : 0} linhas.`
  });

  return { replaced: rows ? rows.length : 0 };
}

function clearComprados(params) {
  requireMaster(params);
  const { usuario, perfil } = params;
  clearSheetData('COMPRADOS');

  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: 'APAGOU_INPUT',
    tela: 'Input Comprados',
    aba: 'COMPRADOS',
    observacao: 'Dados da aba COMPRADOS apagados'
  });

  return { ok: true };
}

// =====================================================================
// IMPORT EQUIPES
// =====================================================================
function importEquipes(params) {
  requireMaster(params);
  const { rows, usuario, perfil } = params;
  ensureHeaders('EQUIPES');
  clearSheetData('EQUIPES');
  if (rows && rows.length) appendRows('EQUIPES', rows);

  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: 'IMPORTOU_EQUIPES',
    tela: 'Input Equipes',
    aba: 'EQUIPES',
    observacao: `${rows ? rows.length : 0} equipes importadas`
  });

  return { ok: true, count: rows ? rows.length : 0 };
}

// =====================================================================
// IMPORT COMPRADOR
// =====================================================================
function importComprador(params) {
  requireMaster(params);
  const { rows, usuario, perfil } = params;
  clearSheetData('COMPRADOR');
  if (rows && rows.length) appendRows('COMPRADOR', rows);

  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: 'IMPORTOU_COMPRADOR',
    tela: 'Input Comprador',
    aba: 'COMPRADOR',
    observacao: `${rows ? rows.length : 0} linhas de comprador importadas`
  });

  return { ok: true, count: rows ? rows.length : 0 };
}

// =====================================================================
// EDIÇÃO DE CAMPO
// =====================================================================
const CAMPOS_EDITAVEIS = ['valorMelhorado', 'melhorado', 'negocioFechado', 'comprador', 'dataMelhoria'];
const CAMPOS_EDITAVEIS_ALIASES = {
  valorMelhorado: ['valorMelhorado','manualValorMelhorado','vlrMelhorado','valor_melhorado','vlr_melhorado','Valor Melhorado','Vlr Melhorado','VLR MELHORADO'],
  melhorado: ['melhorado','manualMelhorado','Melhorado','MELHORADO'],
  negocioFechado: ['negocioFechado','negocio_fechado','negFechado','Neg. Fechado','Negocio Fechado','Negócio Fechado','NEG FECHADO'],
  comprador: ['comprador','manualCompradorNome','compradorNome','comprador_nome','Comprador','COMPRADOR'],
  dataMelhoria: ['dataMelhoria','manualDataMelhoria','data_melhoria','Data Melhoria','DATA MELHORIA']
};

function canonicalCampoEditavel(campo) {
  const c = String(campo || '').trim();
  for (const canonico in CAMPOS_EDITAVEIS_ALIASES) {
    if (CAMPOS_EDITAVEIS_ALIASES[canonico].some(a => String(a).trim().toLowerCase() === c.toLowerCase())) {
      return canonico;
    }
  }
  return c;
}

function ensureEditableHeaders() {
  const sh = getSheet('AVALIACOES');
  let headers = getHeaders('AVALIACOES').map(h => String(h).trim());
  let changed = false;
  CAMPOS_EDITAVEIS.forEach(h => {
    if (headers.indexOf(h) < 0) {
      headers.push(h);
      changed = true;
    }
  });
  if (headers.indexOf('idAv') < 0) {
    headers.unshift('idAv');
    changed = true;
  }
  if (changed) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
  }
  return headers;
}

function updateField(params) {
  const { idAv, valorNovo, usuario, perfil, placa, empresa, vendedor } = params;
  const campoOriginal = String(params.campo || '').trim();
  const campo = canonicalCampoEditavel(campoOriginal);

  if (!CAMPOS_EDITAVEIS.includes(campo)) {
    throw new Error('Campo não permitido para edição: ' + campoOriginal);
  }

  const sh = getSheet('AVALIACOES');
  let headers = ensureEditableHeaders();
  let data = sh.getDataRange().getValues();
  headers = data[0].map(h => String(h).trim());

  const colIdx = headers.indexOf(campo);
  if (colIdx < 0) throw new Error('Coluna não encontrada na planilha: ' + campo);

  const idAvIdx = headers.indexOf('idAv');
  if (idAvIdx < 0) throw new Error('Coluna idAv não encontrada');

  let targetRow = -1;
  let valorAnterior = '';
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idAvIdx]).trim() === String(idAv).trim()) {
      targetRow = i + 1;
      valorAnterior = data[i][colIdx];
      break;
    }
  }

  if (targetRow < 0) throw new Error('Avaliação não encontrada: idAv=' + idAv);

  sh.getRange(targetRow, colIdx + 1).setValue(valorNovo);

  const acaoMap = {
    valorMelhorado: 'ALTEROU_VALOR_MELHORADO',
    melhorado: 'ALTEROU_MELHORADO',
    negocioFechado: 'ALTEROU_NEGOCIO_FECHADO',
    comprador: 'ALTEROU_COMPRADOR',
    dataMelhoria: 'ALTEROU_DATA_MELHORIA'
  };

  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: acaoMap[campo] || 'ALTEROU_CAMPO',
    tela: params.tela || 'Visão Detalhada',
    aba: 'AVALIACOES',
    placa: placa || '',
    empresa: empresa || '',
    vendedor: vendedor || '',
    campoAlterado: campo,
    valorAnterior: String(valorAnterior),
    valorNovo: String(valorNovo),
    observacao: `Campo ${campo} alterado de "${valorAnterior}" para "${valorNovo}"`
  });

  return { ok: true, campo: campo };
}

// =====================================================================
// EDIÇÃO COMPARTILHADA — ABA COMPRADOR
// =====================================================================
const COMPRADOR_HEADERS_V20 = ['idAv','placa','chassi','valorMelhorado','comprador','melhorado','negocioFechado','dataMelhoria','updatedAt','updatedBy'];

function ensureHeadersAppendOnly(sheetName, requiredHeaders) {
  const sh = getSheet(sheetName);
  let lastCol = sh.getLastColumn();
  let headers = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim()) : [];
  if (headers.length === 0 || headers.every(h => h === '')) {
    sh.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sh.getRange(1, 1, 1, requiredHeaders.length).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
    return requiredHeaders.slice();
  }
  let changed = false;
  requiredHeaders.forEach(h => {
    if (headers.indexOf(h) < 0) {
      headers.push(h);
      changed = true;
    }
  });
  if (changed) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
  }
  return headers;
}

function normChassiApi(v) {
  return String(v || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function findRowByKeys_(data, headers, keys) {
  const idxId = headers.indexOf('idAv');
  const idxPlaca = headers.indexOf('placa');
  const idxChassi = headers.indexOf('chassi');
  const id = String(keys.idAv || '').trim();
  const placa = normPlaca(keys.placa || '');
  const chassi = normChassiApi(keys.chassi || '');

  for (let i = 1; i < data.length; i++) {
    if (id && idxId >= 0 && String(data[i][idxId] || '').trim() === id) return i + 1;
  }
  for (let i = 1; i < data.length; i++) {
    if (chassi && idxChassi >= 0 && normChassiApi(data[i][idxChassi]) === chassi) return i + 1;
  }
  for (let i = 1; i < data.length; i++) {
    if (placa && idxPlaca >= 0 && normPlaca(data[i][idxPlaca]) === placa) return i + 1;
  }
  return -1;
}

function upsertCompradorManual_(params, campoCanonico, manual) {
  const sh = getSheet('COMPRADOR');
  const headers = ensureHeadersAppendOnly('COMPRADOR', COMPRADOR_HEADERS_V20);
  const data = sh.getDataRange().getValues();
  let rowNumber = findRowByKeys_(data, headers, params);
  if (rowNumber < 0) rowNumber = sh.getLastRow() + 1;

  const payload = {
    idAv: params.idAv || '',
    placa: normPlaca(params.placa || ''),
    chassi: normChassiApi(params.chassi || ''),
    valorMelhorado: manual.valorMelhorado !== undefined ? manual.valorMelhorado : '',
    comprador: manual.comprador !== undefined ? manual.comprador : '',
    melhorado: manual.melhorado !== undefined ? manual.melhorado : '',
    negocioFechado: manual.negocioFechado !== undefined ? manual.negocioFechado : '',
    dataMelhoria: manual.dataMelhoria !== undefined ? manual.dataMelhoria : '',
    updatedAt: nowBR(),
    updatedBy: params.usuario || ''
  };

  if (rowNumber <= sh.getLastRow()) {
    const current = sh.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
    headers.forEach((h, idx) => {
      if ((payload[h] === '' || payload[h] === undefined) && current[idx] !== '' && current[idx] !== undefined) {
        payload[h] = current[idx];
      }
    });
  }

  const values = headers.map(h => payload[h] !== undefined ? payload[h] : '');
  sh.getRange(rowNumber, 1, 1, headers.length).setValues([values]);
  return rowNumber;
}

function updateAvaliacaoManualIfFound_(params, campoCanonico, valorNovo) {
  const sh = getSheet('AVALIACOES');
  let headers = ensureEditableHeaders();
  headers = ensureHeadersAppendOnly('AVALIACOES', ['idAv','placa','chassi'].concat(CAMPOS_EDITAVEIS));
  const data = sh.getDataRange().getValues();
  const rowNumber = findRowByKeys_(data, headers, params);
  if (rowNumber < 0) return false;
  const colIdx = headers.indexOf(campoCanonico);
  if (colIdx < 0) return false;
  sh.getRange(rowNumber, colIdx + 1).setValue(valorNovo);
  return true;
}

function updateBuyerManual(params) {
  const campoOriginal = String(params.campo || '').trim();
  const campo = canonicalCampoEditavel(campoOriginal);
  if (!CAMPOS_EDITAVEIS.includes(campo)) {
    throw new Error('Campo não permitido para edição: ' + campoOriginal);
  }

  const manual = params.manual || {};
  if (campo === 'valorMelhorado') manual.valorMelhorado = params.valorNovo;
  if (campo === 'melhorado') manual.melhorado = params.valorNovo;
  if (campo === 'negocioFechado') manual.negocioFechado = params.valorNovo;
  if (campo === 'comprador') manual.comprador = params.valorNovo;
  if (campo === 'dataMelhoria') manual.dataMelhoria = params.valorNovo;

  const rowComprador = upsertCompradorManual_(params, campo, manual);
  const updatedAvaliacao = updateAvaliacaoManualIfFound_(params, campo, params.valorNovo);

  logHistorico({
    usuario: params.usuario || '',
    perfil: params.perfil || '',
    acao: 'ALTEROU_CAMPO_COMPRADOR_COMPARTILHADO',
    tela: params.tela || 'Visão Detalhada',
    aba: 'COMPRADOR',
    placa: params.placa || '',
    empresa: params.empresa || '',
    vendedor: params.vendedor || '',
    campoAlterado: campo,
    valorAnterior: '',
    valorNovo: String(params.valorNovo || ''),
    observacao: 'Campo salvo na aba COMPRADOR. Linha: ' + rowComprador + '. AVALIACOES: ' + (updatedAvaliacao ? 'Sim' : 'Não')
  });

  return { ok: true, campo: campo, rowComprador: rowComprador, updatedAvaliacao: updatedAvaliacao };
}

// =====================================================================
// USUÁRIOS
// =====================================================================
function createUsuario(params) {
  requireMaster(params);
  const { novoUsuario, usuario, perfil } = params;
  const { login, senha, nome, perfilNovo, ativo } = novoUsuario;
  const lojas = String(novoUsuario.lojas || '').trim();
  const abas  = String(novoUsuario.abas  || '').trim();

  if (!login || !senha || !nome) throw new Error('login, senha e nome são obrigatórios');

  const existentes = sheetToObjects('USUARIOS');
  if (existentes.find(u => String(u.login).trim().toLowerCase() === String(login).trim().toLowerCase())) {
    throw new Error('Já existe um usuário com este login: ' + login);
  }

  // Garante que as colunas lojas e abas existam antes de inserir.
  ensureHeaders('USUARIOS');

  const sh = getSheet('USUARIOS');
  const headers = getHeaders('USUARIOS');
  const map = { login, senha, nome, perfil: perfilNovo || 'usuario', ativo: ativo || 'Sim', lojas, abas };
  const row = headers.map(h => map[h] !== undefined ? map[h] : '');
  sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);

  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: 'CRIOU_USUARIO',
    tela: 'Usuários',
    observacao: `Usuário criado: ${login} (${perfilNovo || 'usuario'})`
  });

  return { ok: true };
}

function updateUsuario(params) {
  requireMaster(params);
  const { loginAlvo, campos, usuario, perfil } = params;

  // Garante colunas lojas/abas antes de atualizar.
  ensureHeaders('USUARIOS');

  const sh = getSheet('USUARIOS');
  const data = sh.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const loginIdx = headers.indexOf('login');

  let targetRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][loginIdx]).trim().toLowerCase() === String(loginAlvo).trim().toLowerCase()) {
      targetRow = i + 1;
      break;
    }
  }
  if (targetRow < 0) throw new Error('Usuário não encontrado: ' + loginAlvo);

  Object.keys(campos).forEach(campo => {
    const idx = headers.indexOf(campo);
    if (idx >= 0) sh.getRange(targetRow, idx + 1).setValue(campos[campo]);
  });

  const acaoLog = campos.ativo === 'Não' ? 'INATIVOU_USUARIO' : 'ALTEROU_USUARIO';
  logHistorico({
    usuario: usuario || '',
    perfil: perfil || '',
    acao: acaoLog,
    tela: 'Usuários',
    observacao: `Usuário ${loginAlvo} atualizado: ${JSON.stringify(campos)}`
  });

  return { ok: true };
}

// =====================================================================
// COMPRADORES DE USADOS (lista cadastral)
// =====================================================================
function getCompradores(params) {
  return sheetToObjects('COMPRADORES');
}

function createComprador(params) {
  requireMaster(params);
  const { comprador, usuario, perfil } = params;
  if (!comprador || !comprador.nome) throw new Error('Nome do comprador é obrigatório.');
  ensureHeaders('COMPRADORES');
  const sh = getSheet('COMPRADORES');
  const headers = getHeaders('COMPRADORES');
  const map = {
    nome:      String(comprador.nome      || '').trim(),
    lojas:     String(comprador.lojas     || '').trim(),
    email:     String(comprador.email     || '').trim(),
    whatsapp:  String(comprador.whatsapp  || '').trim(),
    ativo:     String(comprador.ativo     || 'Sim').trim()
  };
  const row = headers.map(h => map[h] !== undefined ? map[h] : '');
  sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  logHistorico({ usuario: usuario||'', perfil: perfil||'', acao:'CRIOU_COMPRADOR', tela:'Usuários', observacao:'Comprador criado: '+map.nome });
  return { ok: true };
}

function updateComprador(params) {
  requireMaster(params);
  const { idx, comprador, usuario, perfil } = params;
  if (!comprador) throw new Error('Dados do comprador não informados.');
  ensureHeaders('COMPRADORES');
  const sh = getSheet('COMPRADORES');
  const data = sh.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  // idx é base 0 referente aos dados (sem header); linha real = idx + 2
  const rowNum = Number(idx) + 2;
  if (rowNum < 2 || rowNum > sh.getLastRow()) throw new Error('Índice de comprador inválido: ' + idx);
  const map = {
    nome:     String(comprador.nome     || '').trim(),
    lojas:    String(comprador.lojas    || '').trim(),
    email:    String(comprador.email    || '').trim(),
    whatsapp: String(comprador.whatsapp || '').trim(),
    ativo:    String(comprador.ativo    || 'Sim').trim()
  };
  const row = headers.map(h => map[h] !== undefined ? map[h] : '');
  sh.getRange(rowNum, 1, 1, row.length).setValues([row]);
  logHistorico({ usuario: usuario||'', perfil: perfil||'', acao:'ATUALIZOU_COMPRADOR', tela:'Usuários', observacao:'Comprador atualizado: '+map.nome });
  return { ok: true };
}

function deleteComprador(params) {
  requireMaster(params);
  const nomeAlvo = String(params.nome || '').trim().toLowerCase();
  const idxAlvo  = params.idx != null ? Number(params.idx) : -1;
  const { usuario, perfil } = params;

  const sh = getSheet('COMPRADORES');
  if (!sh || sh.getLastRow() < 2) return { ok: true, aviso: 'Aba COMPRADORES vazia.' };

  const data = sh.getDataRange().getValues();
  // Busca por nome (mais seguro que índice)
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0] || '').trim().toLowerCase() === nomeAlvo) {
      sh.deleteRow(i + 1);
      logHistorico({ usuario: usuario||'', perfil: perfil||'', acao:'EXCLUIU_COMPRADOR', tela:'Usuários', observacao:'Comprador excluído: '+nomeAlvo });
      return { ok: true };
    }
  }
  // Fallback por índice
  if (idxAlvo >= 0 && idxAlvo + 2 <= data.length) {
    const nome = String(data[idxAlvo + 1][0] || '');
    sh.deleteRow(idxAlvo + 2);
    logHistorico({ usuario: usuario||'', perfil: perfil||'', acao:'EXCLUIU_COMPRADOR', tela:'Usuários', observacao:'Comprador excluído por índice: '+nome });
    return { ok: true };
  }
  return { ok: true, aviso: 'Comprador não encontrado na planilha.' };
}

// =====================================================================
// HISTÓRICO DE USUÁRIOS
// =====================================================================
function logHistorico(entry) {
  try {
    const sh = getSheet('HISTORICO_USUARIOS');
    const headers = getHeaders('HISTORICO_USUARIOS');
    const now = nowBR();
    const row = headers.map(h => {
      const map = {
        dataHora: now, usuario: entry.usuario||'', perfil: entry.perfil||'',
        acao: entry.acao||'', tela: entry.tela||'', aba: entry.aba||'',
        placa: entry.placa||'', empresa: entry.empresa||'', vendedor: entry.vendedor||'',
        campoAlterado: entry.campoAlterado||'', valorAnterior: entry.valorAnterior||'',
        valorNovo: entry.valorNovo||'', observacao: entry.observacao||''
      };
      return map[h] !== undefined ? map[h] : '';
    });
    sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  } catch(e) {
    console.error('Erro ao gravar histórico:', e.message);
  }
}

// =====================================================================
// NORMALIZAÇÃO
// =====================================================================
function normPlaca(p) {
  return String(p || '').replace(/[\s\-]/g, '').toUpperCase();
}

function normEmpresa(e) {
  return String(e || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ').trim().toUpperCase();
}

// =====================================================================
// IMPORTAÇÃO DIRETA DE OUTRA PLANILHA GOOGLE
// =====================================================================
function importFromSheet(params) {
  requireMaster(params);
  const { spreadsheetId, sheetName, targetAba, mode, usuario, perfil } = params;
  if (!spreadsheetId) throw new Error('ID da planilha não informado');

  let ssId = spreadsheetId.trim();
  const match = ssId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) ssId = match[1];

  let sourceSS;
  try {
    sourceSS = SpreadsheetApp.openById(ssId);
  } catch(e) {
    throw new Error('Não foi possível abrir a planilha. Verifique o ID e o compartilhamento.');
  }

  let sourceSheet;
  if (sheetName) {
    sourceSheet = sourceSS.getSheetByName(sheetName);
    if (!sourceSheet) {
      const sheets = sourceSS.getSheets();
      for (const s of sheets) {
        if (s.getName().toLowerCase() === sheetName.toLowerCase()) { sourceSheet = s; break; }
      }
    }
    if (!sourceSheet) throw new Error('Aba "' + sheetName + '" não encontrada na planilha de origem.');
  } else {
    sourceSheet = sourceSS.getActiveSheet();
  }

  const lastRow = sourceSheet.getLastRow();
  const lastCol = sourceSheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) throw new Error('A planilha de origem está vazia ou só tem cabeçalho.');

  const data = sourceSheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0].map(h => String(h).trim());

  const COL_MAP_APPS = {
    idAv: ['ID Avaliação','Id avaliação','id avaliação','idAv'],
    dataAv: ['Data de Avaliação','Data de avaliação','Data Avaliação','dataAv'],
    empresa: ['Empresa','empresa'],
    vendedor: ['Vendedor','vendedor'],
    precificador: ['precificador','Precificador'],
    status: ['Status','status'],
    objetivo: ['Objetivo','objetivo'],
    valorAv: ['Valor da avaliação','Valor da Avaliação','valorAv'],
    fipe: ['FIPE','Fipe','fipe'],
    placa: ['Placa','placa'],
    marca: ['Marca','marca'],
    modelo: ['Modelo','modelo'],
    versao: ['Versão','Versao','versao'],
    anoModelo: ['Ano Modelo','Ano modelo','anoModelo'],
    km: ['KM','km','Km'],
    aa: ['AA','aa'],
    b2b: ['B2B','b2b']
  };

  function findCol(hdrs, variants) {
    const norm = s => (s||'').toString().trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    for (const v of variants) {
      const idx = hdrs.findIndex(h => norm(h) === norm(v));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const target = targetAba || 'AVALIACOES';
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row.some(c => c !== '' && c !== null && c !== undefined)) continue;
    const obj = {};
    for (const [key, variants] of Object.entries(COL_MAP_APPS)) {
      const idx = findCol(headers, variants);
      obj[key] = idx >= 0 ? row[idx] : '';
    }
    if (obj.dataAv instanceof Date) {
      obj.dataAv = Utilities.formatDate(obj.dataAv, 'America/Fortaleza', 'yyyy-MM-dd');
    }
    rows.push(obj);
  }

  if (rows.length === 0) throw new Error('Nenhuma linha válida encontrada na planilha de origem.');

  if (mode === 'replace') clearSheetData(target);

  let inserted = 0, duplicates = 0;
  if (mode === 'append' || !mode) {
    const existing = sheetToObjects(target);
    const existingKeys = new Set(existing.map(r => {
      const p = (r.placa||'').toString().replace(/[\s\-]/g,'').toUpperCase();
      const d = (r.dataAv||'').toString().split('T')[0];
      const e = (r.empresa||'').toString().toUpperCase();
      return p + '|' + d + '|' + e;
    }));
    const newRows = rows.filter(r => {
      const p = (r.placa||'').toString().replace(/[\s\-]/g,'').toUpperCase();
      const d = (r.dataAv||'').toString().split('T')[0];
      const e = (r.empresa||'').toString().toUpperCase();
      return !existingKeys.has(p + '|' + d + '|' + e);
    });
    duplicates = rows.length - newRows.length;
    if (newRows.length > 0) appendRows(target, newRows);
    inserted = newRows.length;
  } else {
    appendRows(target, rows);
    inserted = rows.length;
  }

  logHistorico({
    usuario: usuario||'', perfil: perfil||'',
    acao: 'IMPORTOU_AVALIACOES', tela: 'Input Avaliações', aba: target,
    observacao: `Importação direta. ${inserted} inseridas, ${duplicates} duplicatas.`
  });

  return { inserted, duplicates, total: rows.length };
}

// =====================================================================
// SETUP INICIAL — Executar manualmente UMA VEZ
// =====================================================================
function setupPlanilha() {
  const abas = {
    AVALIACOES: ['idAv','dataAv','empresa','vendedor','precificador','status','objetivo','valorAv','fipe','placa','marca','modelo','versao','anoModelo','km','aa','b2b','valorMelhorado','melhorado','negocioFechado','comprador','dataMelhoria'],
    COMPRADOS: ['placa','empresa','dataCompra'],
    EQUIPES: ['nome','tipo','empresa'],
    COMPRADOR: ['idAv','placa','chassi','valorMelhorado','comprador','melhorado','negocioFechado','dataMelhoria','updatedAt','updatedBy'],
    USUARIOS: ['login','senha','nome','perfil','ativo','lojas','abas'],
    COMPRADORES: ['nome','lojas','email','whatsapp','ativo'],
    HISTORICO_USUARIOS: ['dataHora','usuario','perfil','acao','tela','aba','placa','empresa','vendedor','campoAlterado','valorAnterior','valorNovo','observacao'],
    CONFIG: ['chave','valor']
  };

  Object.keys(abas).forEach(nome => {
    let sh = ss.getSheetByName(nome);
    if (!sh) sh = ss.insertSheet(nome);
    const headers = abas[nome];
    const firstRow = sh.getRange(1, 1, 1, headers.length);
    firstRow.setValues([headers]);
    firstRow.setFontWeight('bold');
    firstRow.setBackground('#1a73e8');
    firstRow.setFontColor('#ffffff');
  });

  const shUsuarios = ss.getSheetByName('USUARIOS');
  const data = shUsuarios.getDataRange().getValues();
  const existeMaster = data.slice(1).some(r => String(r[0]).trim() === 'Tarsis Casado');
  if (!existeMaster) {
    shUsuarios.appendRow(['Tarsis Casado', 'Carmais@1111', 'Tarsis Casado', 'master', 'Sim', '', '']);
  }

  SpreadsheetApp.getUi().alert('✅ Planilha configurada!\n\nUsuário master:\nLogin: Tarsis Casado\nSenha: Carmais@1111');
}
