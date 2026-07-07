/* =========================================================
   MÓDULO: HISTÓRICO  (Sprint 5.1 — separação física, script clássico)
   ---------------------------------------------------------
   Carregado ANTES de js/app.js. Contém APENAS declarações
   (nenhuma execução de lógica no load). As dependências
   externas (callAPI, SESSION, showLoading, hideLoading,
   showToast, escHtml) vivem em js/app.js e são acessadas em
   RUNTIME — quando o usuário abre a aba Histórico ou clica em
   Atualizar — momento em que app.js já está carregado.

   Por ser script clássico, `function` no topo deste arquivo
   já vira `window.*` automaticamente (loadHistorico /
   renderHistorico), preservando os handlers inline do HTML.
   ========================================================= */
let historicoData=[];
async function loadHistorico(){
  showLoading('Carregando histórico...');
  try{historicoData=await callAPI({action:'getHistorico',usuario:SESSION.nome,perfil:SESSION.perfil});renderHistorico();}
  catch(e){showToast('Erro: '+e.message,'error');}finally{hideLoading();}
}
function renderHistorico(){
  const s=(document.getElementById('hist-search')?.value||'').toLowerCase();
  let data=[...historicoData].reverse();
  if(s)data=data.filter(r=>Object.values(r).some(v=>v&&v.toString().toLowerCase().includes(s)));
  const tb=document.getElementById('historico-tbody');if(!tb)return;
  tb.innerHTML=data.slice(0,200).map(r=>`<tr>
    <td>${escHtml(r.dataHora||'—')}</td><td>${escHtml(r.usuario||'—')}</td>
    <td><span class="badge ${r.perfil==='master'?'badge-amber':'badge-blue'}">${r.perfil||'—'}</span></td>
    <td style="color:var(--accent);font-weight:600;font-size:11px">${escHtml(r.acao||'—')}</td>
    <td>${escHtml(r.tela||'—')}</td><td>${escHtml(r.placa||'—')}</td><td>${escHtml(r.empresa||'—')}</td>
    <td>${escHtml(r.campoAlterado||'—')}</td><td>${escHtml(r.valorAnterior||'—')}</td><td>${escHtml(r.valorNovo||'—')}</td>
    <td title="${escHtml(r.observacao||'')}">${escHtml((r.observacao||'').substring(0,40))}${(r.observacao||'').length>40?'...':''}</td>
  </tr>`).join('')||'<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--text3)">Sem registros</td></tr>';
}
