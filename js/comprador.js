/* =========================================================
   MÓDULO: COMPRADOR  (Sprint 5.4 — separação física, script clássico)
   ---------------------------------------------------------
   Carregado ANTES de js/app.js (e DEPOIS de js/alerts.js).
   Apenas declarações (sem execução no load). Reúne a Visão
   Comprador e o CRUD de Compradores.

   compradoresList (let) vive aqui e é lido/usado por
   js/alerts.js (gerarScriptAlertas) em RUNTIME — em script
   clássico o let global é compartilhado e reatribuível, então
   loadCompradores() atualiza o valor que Alertas enxerga.

   Dependências que permanecem em js/app.js e são acessadas em
   runtime: STATE, callAPI, SESSION, showToast, escHtml, fillDL,
   cvVal, getCompradorVisData, ensureCompradorFilterPanel,
   inRange, getCompraDate, fmtDate, setText, saveJsonLocal,
   loadJsonLocal, closeModal, normHdrEmpresa.
   ========================================================= */
function populateCompradorFilterOptions(){
  const data=STATE.avaliacoes||[];
  const uniq=arr=>[...new Set(arr.filter(Boolean).map(s=>s.toString().trim()))].sort();
  fillDL('cv-dl-empresa', uniq(data.map(r=>r.empresaEquipe||r.empresa)));
  const empFiltro = cvVal('cv-f-empresa');
  const baseVendedores = empFiltro ? data.filter(r=>normHdrEmpresa(r.empresaEquipe||r.empresa||'').includes(normHdrEmpresa(empFiltro))) : data;
  fillDL('cv-dl-vendedor', uniq(baseVendedores.map(r=>r.vendedor)));
  fillDL('cv-dl-precificador', uniq(data.map(r=>r.precificador)));
  fillDL('cv-dl-objetivo', uniq(data.map(r=>r.objetivo)));
  fillDL('cv-dl-tipo', uniq(data.map(r=>r.tipo)));
  fillDL('cv-dl-comprador', uniq(data.map(r=>r.compradorNome)));
  fillDL('cv-dl-modelo', uniq(data.map(r=>r.modelo)));
}
function passesCompradorVisFilters(r){
  const contains=(v,t)=>!t||normHdrEmpresa(v||'').includes(normHdrEmpresa(t));
  const emp=cvVal('cv-f-empresa'), vend=cvVal('cv-f-vendedor'), prec=cvVal('cv-f-precificador');
  if(!contains(r.empresaEquipe||r.empresa, emp)) return false;
  if(!contains(r.vendedor, vend)) return false;
  if(!contains(r.precificador, prec)) return false;
  if(!contains(r.objetivo, cvVal('cv-f-objetivo'))) return false;
  if(!contains(r.tipo, cvVal('cv-f-tipo'))) return false;
  if(!contains(r.placa, cvVal('cv-f-placa'))) return false;
  if(!contains(r.compradorNome, cvVal('cv-f-comprador'))) return false;
  if(!contains(r.modelo, cvVal('cv-f-modelo'))) return false;
  const mel=cvVal('cv-f-melhorado'); if(mel && (r.melhorado||'Não')!==mel) return false;
  const compradoFiltro=cvVal('cv-f-comprado'); if(compradoFiltro && (r.comprado?'Sim':'Não')!==compradoFiltro) return false;
  const negocioFiltro=cvVal('cv-f-negocio'); if(negocioFiltro && (r.negocioFechado||'Não')!==negocioFiltro) return false;
  const ini=cvVal('cv-f-data-ini')?new Date(cvVal('cv-f-data-ini')+'T00:00:00'):null;
  const fim=cvVal('cv-f-data-fim')?new Date(cvVal('cv-f-data-fim')+'T23:59:59'):null;
  if(!ini&&!fim) return true;
  return inRange(r.dataAv,ini,fim)||inRange(getCompraDate(r),ini,fim)||inRange(r.dataMelhoria,ini,fim);
}
function clearCompradorFilters(){
  ['cv-f-data-ini','cv-f-data-fim','cv-f-empresa','cv-f-vendedor','cv-f-precificador','cv-f-objetivo','cv-f-tipo','cv-f-placa','cv-f-melhorado','cv-f-comprado','cv-f-negocio','cv-f-comprador','cv-f-modelo'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  renderCompradorVis();
}
function renderCompradorVis(){
  ensureCompradorFilterPanel();
  const data=getCompradorVisData();
  const mel=data.filter(r=>r.melhorado==='Sim'),comp=data.filter(r=>r.comprado);
  const cmel=comp.filter(r=>r.melhorado==='Sim'),comps=[...new Set(mel.map(r=>r.compradorNome).filter(Boolean))];
  setText('cv-total',mel.length.toLocaleString('pt-BR'));
  setText('cv-comprados-melhoria',cmel.length.toLocaleString('pt-BR'));
  setText('cv-compradores',comps.length.toLocaleString('pt-BR'));
  const ek=document.getElementById('cv-extra-kpis');
  if(ek)ek.innerHTML=`
    <div class="metric-card" style="--accent-color:var(--blue)"><div class="label">Avaliados</div><div class="value">${data.length.toLocaleString('pt-BR')}</div><div class="sub">base filtrada</div><div class="icon">📋</div></div>
    <div class="metric-card" style="--accent-color:var(--green)"><div class="label">Comprados</div><div class="value">${comp.length.toLocaleString('pt-BR')}</div><div class="sub">vinculados</div><div class="icon">✅</div></div>
    <div class="metric-card" style="--accent-color:var(--accent)"><div class="label">Sem melhoria</div><div class="value">${Math.max(0,comp.length-cmel.length).toLocaleString('pt-BR')}</div><div class="sub">comprados pendentes</div><div class="icon">🔎</div></div>
    <div class="metric-card" style="--accent-color:var(--purple)"><div class="label">% melhoria</div><div class="value">${comp.length?(cmel.length/comp.length*100).toFixed(1)+'%':'0.0%'}</div><div class="sub">comprados c/ melhoria</div><div class="icon">📈</div></div>`;
  const cm={};
  comp.forEach(r=>{const n=r.compradorNome||'N/D';if(!cm[n])cm[n]={c:0,m:0};cm[n].c++;if(r.melhorado==='Sim')cm[n].m++;});
  const entries=Object.entries(cm).map(([n,v])=>({n,c:v.c,m:v.m,pct:v.c?v.m/v.c*100:0})).sort((a,b)=>b.pct-a.pct||b.c-a.c);
  const rc=document.getElementById('rank-comprador');
  if(rc){
    if(!entries.length){rc.innerHTML='<div class="no-data">Sem dados</div>';}
    else{const max=Math.max(...entries.map(e=>e.pct),1);rc.innerHTML=entries.map((e,i)=>`<div class="rank-row"><div class="rank-num ${i<3?'top':''}">${i+1}</div><div class="rank-info"><div class="rank-name">${escHtml(e.n)}</div><div class="rank-sub">${e.m} mel / ${e.c} comp</div></div><div class="rank-bar-wrap"><div class="rank-bar"><div class="rank-bar-fill" style="width:${(e.pct/max*100).toFixed(0)}%;background:#f59e0b"></div></div></div><div class="rank-val">${e.pct.toFixed(1)}%</div></div>`).join('');}
  }
  const tb=document.getElementById('cv-placas-tbody');
  if(tb)tb.innerHTML=mel.map(r=>`<tr><td>${escHtml(r.placa||'—')}</td><td>${escHtml(r.modelo||'—')}</td><td>${escHtml(r.empresaEquipe||r.empresa||'—')}</td><td>${escHtml(r.vendedor||'—')}</td><td>${r.valorAv?'R$ '+Number(r.valorAv).toLocaleString('pt-BR'):'—'}</td><td>${r.valorMelhorado?'R$ '+Number(r.valorMelhorado).toLocaleString('pt-BR'):'—'}</td><td>${fmtDate(r.dataAv)}</td><td>${fmtDate(r.dataMelhoria)}</td><td>${r.comprado?'<span class="badge badge-green">Sim</span>':'<span class="badge badge-gray">Não</span>'}</td><td>${escHtml(r.compradorNome||'—')}</td></tr>`).join('')||'<tr><td colspan="10" class="no-data" style="text-align:center;padding:20px">Nenhuma melhoria.</td></tr>';
}
let compradoresList = [];

async function loadCompradores() {
  try {
    const list = await callAPI({ action:'getCompradores', usuario:SESSION.nome, perfil:SESSION.perfil });
    compradoresList = Array.isArray(list) ? list : [];
  } catch(e) {
    // Fallback: extract unique buyer names from avaliações
    const saved = loadJsonLocal('carmais_compradores_local', []);
    if (saved.length) { compradoresList = saved; }
    else {
      const nomes = [...new Set((STATE.avaliacoes||[]).map(r=>r.compradorNome).filter(Boolean))];
      compradoresList = nomes.map(n=>({ nome:n, lojas:'', email:'', whatsapp:'', ativo:'Sim' }));
    }
  }
  renderCompradores();
}

function renderCompradores() {
  // Atualiza o datalist de compradores em todos os formulários do dashboard
  const dl = document.getElementById('dl-compradores-manual');
  if (dl) dl.innerHTML = compradoresList.filter(c=>c.ativo!=='Não').map(c=>`<option value="${escHtml(c.nome)}"></option>`).join('');

  const tb = document.getElementById('compradores-tbody'); if(!tb) return;
  if (!compradoresList.length) { tb.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3)">Nenhum comprador cadastrado</td></tr>'; return; }
  tb.innerHTML = compradoresList.map((c,i)=>`<tr>
    <td style="font-weight:600">${escHtml(c.nome||'—')}</td><td>${escHtml(c.lojas||'—')}</td>
    <td>${escHtml(c.email||'—')}</td><td>${escHtml(c.whatsapp||'—')}</td>
    <td><span class="badge ${(c.ativo||'Sim')==='Sim'?'badge-green':'badge-red'}">${c.ativo||'Sim'}</span></td>
    <td style="display:flex;gap:6px">
      <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px" title="Editar" onclick="editComprador(${i})">✏️</button>
      <button class="btn btn-${(c.ativo||'Sim')==='Sim'?'red':'green'}" style="padding:4px 10px;font-size:12px" title="${(c.ativo||'Sim')==='Sim'?'Inativar':'Ativar'}" onclick="toggleComprador(${i})">${(c.ativo||'Sim')==='Sim'?'🚫':'✅'}</button>
      <button class="btn btn-red" style="padding:4px 10px;font-size:12px" title="Excluir" onclick="excluirComprador(${i})">🗑️</button>
    </td></tr>`).join('');
}

function openModalNovoComprador() {
  document.getElementById('modal-comprador-title').textContent = 'Novo Comprador';
  ['mc-nome','mc-lojas','mc-email','mc-whatsapp'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('mc-ativo').value = 'Sim';
  document.getElementById('mc-nome').dataset.editIdx = '';
  document.getElementById('modal-comprador').classList.add('open');
}

function editComprador(idx) {
  const c = compradoresList[idx]; if(!c) return;
  document.getElementById('modal-comprador-title').textContent = 'Editar Comprador';
  document.getElementById('mc-nome').value = c.nome||'';
  document.getElementById('mc-lojas').value = c.lojas||'';
  document.getElementById('mc-email').value = c.email||'';
  document.getElementById('mc-whatsapp').value = c.whatsapp||'';
  document.getElementById('mc-ativo').value = c.ativo||'Sim';
  document.getElementById('mc-nome').dataset.editIdx = idx;
  document.getElementById('modal-comprador').classList.add('open');
}

async function salvarComprador() {
  const nome = document.getElementById('mc-nome').value.trim();
  if (!nome) { showToast('Nome obrigatório.','error'); return; }
  const comp = { nome, lojas:document.getElementById('mc-lojas').value.trim(), email:document.getElementById('mc-email').value.trim(), whatsapp:document.getElementById('mc-whatsapp').value.trim(), ativo:document.getElementById('mc-ativo').value };
  const editIdx = document.getElementById('mc-nome').dataset.editIdx;
  try {
    if (editIdx!=='') { await callAPI({action:'updateComprador',idx:Number(editIdx),comprador:comp,usuario:SESSION.nome,perfil:SESSION.perfil}); compradoresList[editIdx]=comp; }
    else { await callAPI({action:'createComprador',comprador:comp,usuario:SESSION.nome,perfil:SESSION.perfil}); compradoresList.push(comp); }
    showToast('Comprador salvo!','success');
  } catch(e) {
    if (editIdx!=='') compradoresList[editIdx]=comp; else compradoresList.push(comp);
    saveJsonLocal('carmais_compradores_local', compradoresList);
    showToast('Salvo localmente. Configure o Apps Script para persistência cloud.','info');
  }
  closeModal('modal-comprador');
  renderCompradores();
}

async function toggleComprador(idx) {
  const c = compradoresList[idx]; if(!c) return;
  compradoresList[idx] = {...c, ativo:(c.ativo||'Sim')==='Sim'?'Não':'Sim'};
  saveJsonLocal('carmais_compradores_local', compradoresList);
  try { await callAPI({action:'updateComprador',idx,comprador:compradoresList[idx],usuario:SESSION.nome,perfil:SESSION.perfil}); } catch(e) {}
  renderCompradores();
}

async function excluirComprador(idx) {
  const c = compradoresList[idx]; if(!c) return;
  if(!confirm(`Excluir o comprador "${c.nome}"? Esta ação não pode ser desfeita.`)) return;
  try {
    await callAPI({action:'deleteComprador',idx,nome:c.nome,comprador:c,usuario:SESSION.nome,perfil:SESSION.perfil});
    showToast('Comprador excluído.','success');
  } catch(e) {
    showToast('Excluído localmente. Configure o Apps Script (action deleteComprador) para remover na nuvem.','info');
  }
  compradoresList.splice(idx,1);
  saveJsonLocal('carmais_compradores_local', compradoresList);
  renderCompradores();
}
