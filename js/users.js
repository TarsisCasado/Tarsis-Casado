/* =========================================================
   MÓDULO: USUÁRIOS  (Sprint 5.3 — separação física, script clássico)
   ---------------------------------------------------------
   Carregado ANTES de js/app.js. Apenas declarações (sem
   execução no load). Depende, em RUNTIME, de helpers que
   permanecem em js/app.js (ABAS_USUARIO, getAllUserPerms,
   parseLista, getAllLojas, getLojasSelecionadas) e de callAPI/
   SESSION/showToast/closeModal/escHtml/normHdrEmpresa/STATE.
   A variável usuariosListCache (let) fica aqui e é lida por
   editUsuario (em app.js) via escopo global compartilhado.
   Por ser script clássico, as funções já ficam em window.*
   automaticamente, preservando os handlers inline.
   ========================================================= */
async function loadUsuarios() {
  try{ const users=await callAPI({action:'getUsuarios',usuario:SESSION.nome,perfil:SESSION.perfil}); renderUsuarios(users); }
  catch(e){showToast('Erro usuários: '+e.message,'error');}
}
function getUserPerms(login){ return getAllUserPerms()[(login||'').toString().toLowerCase()] || {}; }
function setUserPerms(login, perms){ const m=getAllUserPerms(); m[(login||'').toString().toLowerCase()]=perms; saveJsonLocal('carmais_user_perms', m); }
// Monta a lista de checkboxes de lojas no modal de usuário, marcando as já liberadas.
function buildLojasCheckboxes(selected){
  const wrap=document.getElementById('mu-lojas'); if(!wrap)return;
  const lojas=getAllLojas();
  const selSet=new Set((selected||[]).map(x=>normHdrEmpresa(x)));
  if(!lojas.length){ wrap.innerHTML='<div style="font-size:12px;color:var(--text3)">Nenhuma loja encontrada nos dados. Carregue os dados do dashboard antes de configurar.</div>'; const all=document.getElementById('mu-lojas-all'); if(all){all.checked=false;all.disabled=true;} return; }
  const all=document.getElementById('mu-lojas-all'); if(all)all.disabled=false;
  wrap.innerHTML=lojas.map(l=>`<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;"><input type="checkbox" class="mu-loja-chk" value="${escHtml(l)}" ${selSet.has(normHdrEmpresa(l))?'checked':''} onchange="syncLojasAllCheckbox()"/>${escHtml(l)}</label>`).join('');
  syncLojasAllCheckbox();
}
function toggleAllLojas(check){ document.querySelectorAll('.mu-loja-chk').forEach(c=>c.checked=check); }
function syncLojasAllCheckbox(){
  const all=document.getElementById('mu-lojas-all'); if(!all)return;
  const chks=[...document.querySelectorAll('.mu-loja-chk')];
  all.checked = chks.length>0 && chks.every(c=>c.checked);
}
function buildAbasCheckboxes(selected){
  const wrap=document.getElementById('mu-abas'); if(!wrap)return;
  const sel = (selected && selected.length) ? selected : ABAS_USUARIO.map(a=>a.id);
  wrap.innerHTML = ABAS_USUARIO.map(a=>`<label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;"><input type="checkbox" class="mu-aba-chk" value="${a.id}" ${sel.includes(a.id)?'checked':''} ${a.id==='dashboard'?'disabled':''}/>${a.label}</label>`).join('');
}
// Master não usa restrição de loja/abas: esconde os campos quando perfil=master.
function onPerfilChange(){
  const isMaster = document.getElementById('mu-perfil').value==='master';
  const lw=document.getElementById('mu-lojas-wrap'), aw=document.getElementById('mu-abas-wrap');
  if(lw) lw.style.display = isMaster ? 'none' : 'block';
  if(aw) aw.style.display = isMaster ? 'none' : 'block';
}
let usuariosListCache = [];
function renderUsuarios(users) {
  usuariosListCache = users || [];
  const tb=document.getElementById('usuarios-tbody'); if(!tb)return;
  tb.innerHTML=(users||[]).map(u=>{
    const perms=getUserPerms(u.login);
    const lojas=parseLista(u.lojas!=null&&u.lojas!==''?u.lojas:perms.lojas);
    const lojasTxt = u.perfil==='master' ? 'Todas' : (lojas.length?lojas.join(', '):'Todas');
    return `<tr>
    <td>${escHtml(u.login)}</td><td>${escHtml(u.nome)}</td>
    <td><span class="badge ${u.perfil==='master'?'badge-amber':'badge-blue'}">${u.perfil==='master'?'⭐ Master':'👤 Usuário'}</span></td>
    <td style="font-size:12px;color:var(--text2)">${escHtml(lojasTxt)}</td>
    <td><span class="badge ${u.ativo==='Sim'?'badge-green':'badge-red'}">${u.ativo}</span></td>
    <td style="display:flex;gap:6px">
      <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px" onclick="editUsuario('${escHtml(u.login)}')">✏️</button>
      <button class="btn btn-${u.ativo==='Sim'?'red':'green'}" style="padding:4px 10px;font-size:12px" onclick="toggleUsuario('${escHtml(u.login)}','${u.ativo}')">${u.ativo==='Sim'?'🚫 Inativar':'✅ Ativar'}</button>
    </td></tr>`;
  }).join('')||'<tr><td colspan="6" class="no-data" style="padding:20px;text-align:center">Sem usuários</td></tr>';
}
async function salvarUsuario(){
  const login=document.getElementById('mu-login').value.trim();
  const nome=document.getElementById('mu-nome').value.trim();
  const senha=document.getElementById('mu-senha').value.trim();
  const perfilNovo=document.getElementById('mu-perfil').value;
  const ativo=document.getElementById('mu-ativo').value;
  const editMode=document.getElementById('mu-login').dataset.editMode;
  if(!login||!nome){showToast('Login e nome obrigatórios.','error');return;}
  // Permissões (só fazem sentido para usuário comum)
  const lojas = perfilNovo==='master' ? [] : getLojasSelecionadas();
  let abas = perfilNovo==='master' ? [] : [...document.querySelectorAll('.mu-aba-chk:checked')].map(c=>c.value);
  if(perfilNovo!=='master' && !abas.includes('dashboard')) abas.unshift('dashboard');
  const lojasStr = lojas.join(','), abasStr = abas.join(',');
  try{
    if(editMode){
      const campos={nome,perfil:perfilNovo,ativo,lojas:lojasStr,abas:abasStr}; if(senha)campos.senha=senha;
      await callAPI({action:'updateUsuario',loginAlvo:editMode,campos,usuario:SESSION.nome,perfil:SESSION.perfil});
    }else{
      if(!senha){showToast('Senha obrigatória.','error');return;}
      await callAPI({action:'createUsuario',novoUsuario:{login,senha,nome,perfilNovo,ativo,lojas:lojasStr,abas:abasStr},usuario:SESSION.nome,perfil:SESSION.perfil});
    }
    setUserPerms(login,{lojas,abas});
    closeModal('modal-usuario');
    if(perfilNovo!=='master' && lojas.length){
      showToast(`Usuário salvo! ${lojas.length} loja(s) liberada(s). A restrição vale no próximo login dele.`,'success');
    } else {
      showToast('Usuário salvo!','success');
    }
    await loadUsuarios();
  }catch(e){
    // Mesmo sem backend, mantém as permissões salvas localmente (só vale nesta máquina).
    setUserPerms(login,{lojas,abas});
    showToast('⚠️ O servidor não confirmou o salvamento. A restrição de loja só funciona para outro usuário se o Apps Script atualizado estiver publicado. Erro: '+e.message,'error');
  }
}
async function toggleUsuario(login,atual){
  const novoAtivo=atual==='Sim'?'Não':'Sim';
  if(!confirm(`${novoAtivo==='Não'?'Inativar':'Ativar'} usuário ${login}?`))return;
  try{ await callAPI({action:'updateUsuario',loginAlvo:login,campos:{ativo:novoAtivo},usuario:SESSION.nome,perfil:SESSION.perfil}); showToast('Usuário atualizado.','success'); await loadUsuarios();}
  catch(e){showToast('Erro: '+e.message,'error');}
}
