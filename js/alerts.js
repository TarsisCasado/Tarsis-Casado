/* =========================================================
   MÓDULO: ALERTAS  (Sprint 5.2 — separação física, script clássico)
   ---------------------------------------------------------
   Carregado ANTES de js/app.js. Apenas declarações (sem
   execução no load). Dependências externas (compradoresList,
   showToast, DOM, navigator.clipboard) vivem em js/app.js e
   são acessadas em RUNTIME (ao salvar config / copiar código).
   window._alertScript é compartilhado via window entre os
   arquivos. Por ser script clássico, estas funções já ficam
   em window.* automaticamente, preservando os handlers inline.
   ========================================================= */
function salvarConfigAlertas() {
  const config = { primeiroDisparo:document.getElementById('alert-primeiro')?.value||30, segundoDisparo:document.getElementById('alert-segundo')?.value||24, canal:document.getElementById('alert-canal')?.value||'email' };
  localStorage.setItem('carmais_alert_config', JSON.stringify(config));
  gerarScriptAlertas(config);
  showToast('Configurações salvas e código gerado!','success');
}

function gerarScriptAlertas(config) {
  const compradores = compradoresList.filter(c=>c.ativo!=='Não'&&(c.email||c.whatsapp));
  const cJson = JSON.stringify(compradores.map(c=>({nome:c.nome,lojas:c.lojas,email:c.email,whatsapp:c.whatsapp})), null, 2);
  const script = `// ============================================================
// SISTEMA DE ALERTAS AUTOMÁTICOS — GRUPO CARMAIS
// Gerado em: ${new Date().toLocaleString('pt-BR')}
// Configure um trigger de TEMPO para checkNewAvaliacoes
// Frequência: a cada ${config.primeiroDisparo} minutos
// ============================================================

const COMPRADORES = ${cJson};
const PRIMEIRO_DISPARO_MIN = ${config.primeiroDisparo};
const SEGUNDO_DISPARO_H = ${config.segundoDisparo};
const CANAL = '${config.canal}'; // 'email', 'whatsapp' ou 'ambos'
const CALLMEBOT_KEY = 'SUA_CHAVE_CALLMEBOT'; // https://www.callmebot.com

function checkNewAvaliacoes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');
  if (!sheet) { Logger.log('Aba AVALIACOES não encontrada'); return; }
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idx = (name) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
  const iData = idx('data'); const iEmpresa = idx('empresa');
  const iModelo = idx('modelo'); const iPlaca = idx('placa');
  let iNotif = idx('notificado_alerta');
  if (iNotif === -1) {
    sheet.getRange(1, headers.length + 1).setValue('notificado_alerta');
    iNotif = headers.length;
  }
  const now = new Date();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dataAv = new Date(row[iData]);
    if (!dataAv || isNaN(dataAv)) continue;
    const empresa = String(row[iEmpresa] || '');
    const modelo = String(row[iModelo] || '');
    const placa = String(row[iPlaca] || '');
    const notif = String(row[iNotif] || '');
    const diffMin = (now - dataAv) / 60000;
    const compradores = getCompradoresPorLoja(empresa);
    if (!compradores.length) continue;
    if (diffMin >= PRIMEIRO_DISPARO_MIN && diffMin < PRIMEIRO_DISPARO_MIN + 40 && !notif.includes('D1')) {
      compradores.forEach(c => enviarAlerta(c, empresa, modelo, placa, dataAv, 1));
      sheet.getRange(i+1, iNotif+1).setValue(notif ? notif+',D1' : 'D1');
    }
    if (diffMin >= SEGUNDO_DISPARO_H*60 && diffMin < SEGUNDO_DISPARO_H*60+60 && !notif.includes('D2')) {
      compradores.forEach(c => enviarAlerta(c, empresa, modelo, placa, dataAv, 2));
      sheet.getRange(i+1, iNotif+1).setValue((sheet.getRange(i+1, iNotif+1).getValue()||'')+',D2');
    }
  }
}

function getCompradoresPorLoja(empresa) {
  const emp = empresa.toLowerCase();
  return COMPRADORES.filter(c => {
    const lojas = String(c.lojas||'').toLowerCase().split(',').map(l=>l.trim()).filter(Boolean);
    return lojas.length === 0 || lojas.some(l => emp.includes(l) || l.includes(emp.split(' ')[0]));
  });
}

function enviarAlerta(comprador, empresa, modelo, placa, dataAv, disparo) {
  const dtFmt = Utilities.formatDate(dataAv, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  const msg = '[CARMAIS] Avaliação disponível!\\n' +
    'Loja: ' + empresa + '\\n' +
    'Modelo: ' + modelo + '\\n' +
    'Placa: ' + placa + '\\n' +
    'Data: ' + dtFmt + '\\n' +
    'Disparo ' + disparo + 'º de 2';
  try {
    if ((CANAL === 'email' || CANAL === 'ambos') && comprador.email) {
      GmailApp.sendEmail(comprador.email, '[Carmais] Nova avaliação — ' + modelo, msg);
    }
    if ((CANAL === 'whatsapp' || CANAL === 'ambos') && comprador.whatsapp) {
      const url = 'https://api.callmebot.com/whatsapp.php?phone=' + comprador.whatsapp +
        '&text=' + encodeURIComponent(msg) + '&apikey=' + CALLMEBOT_KEY;
      UrlFetchApp.fetch(url, {muteHttpExceptions:true});
    }
    Logger.log('Alerta ' + disparo + 'º enviado para ' + comprador.nome);
  } catch(e) { Logger.log('Erro ao enviar para ' + comprador.nome + ': ' + e); }
}`;
  const preview = document.getElementById('alert-script-preview');
  if (preview) preview.textContent = script;
  window._alertScript = script;
}

function copyAlertScript() {
  const txt = window._alertScript || document.getElementById('alert-script-preview')?.textContent || '';
  if (!txt) { showToast('Clique em "Salvar e Gerar Código" primeiro.','error'); return; }
  navigator.clipboard.writeText(txt).then(()=>showToast('Código copiado!','success')).catch(()=>showToast('Selecione o texto manualmente para copiar.','info'));
}
