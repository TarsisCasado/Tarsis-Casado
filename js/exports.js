/* =========================================================
   MÓDULO: EXPORTAÇÕES  (Sprint 5.5 — separação física, script clássico)
   ---------------------------------------------------------
   Carregado ANTES de js/app.js. Apenas declarações (sem
   execução no load). Usa as libs de CDN XLSX (SheetJS), jsPDF
   (window.jspdf) e html2canvas — todas carregadas no <head>
   ANTES de qualquer script de módulo e referenciadas APENAS
   dentro dos corpos de função (runtime). Dependências que ficam
   em js/app.js (STATE, dateStr, showToast) também são acessadas
   em runtime. Funções ficam em window.* automaticamente.
   ========================================================= */
function exportExcel(){
  const data=STATE.filtered.length?STATE.filtered:STATE.avaliacoes;
  if(!data.length){showToast('Sem dados','error');return;}
  const rows=data.map(r=>({'ID':r.idAv,'Data Av':fmtDate(r.dataAv),'Empresa':r.empresa,'Vendedor':r.vendedor,'Precificador':r.precificador,'Status':r.status,'Objetivo':r.objetivo,'Valor Av':r.valorAv,'FIPE':r.fipe,'%FIPE':r.pctFipe?r.pctFipe.toFixed(2)+'%':'','Placa':r.placa,'Marca':r.marca,'Modelo':r.modelo,'KM':r.km,'Comprado':r.comprado?'Sim':'Não','Data Compra':fmtDate(getCompraDate(r)),'Data Melhoria':fmtDate(r.dataMelhoria),'Valor Melhorado':r.valorMelhorado,'Melhorado':r.melhorado,'Neg. Fechado':r.negocioFechado,'Comprador':r.compradorNome}));
  const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Avaliações');
  XLSX.writeFile(wb,`seminovos_carmais_${dateStr(new Date())}.xlsx`);
  showToast('Excel exportado!','success');
}
function getCurrentBgColor(){
  const bg=getComputedStyle(document.body).getPropertyValue('--bg').trim()||'#0a0d14';
  return bg;
}
function getCurrentCardColor(){
  return getComputedStyle(document.body).getPropertyValue('--card').trim()||'#1a2035';
}
function rgbFromCssColor(css, fallback=[10,13,20]){
  const c=document.createElement('canvas').getContext('2d');
  c.fillStyle=css||'rgb('+fallback.join(',')+')';
  const v=c.fillStyle;
  if(v.startsWith('#')){
    const hex=v.slice(1);const n=parseInt(hex.length===3?hex.split('').map(x=>x+x).join(''):hex,16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }
  const m=v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m?[+m[1],+m[2],+m[3]]:fallback;
}
async function withCleanExport(callback){
  const el=document.getElementById('tab-dashboard');
  const subtitle=document.getElementById('export-cover-subtitle');
  const oldSubtitle=subtitle?subtitle.textContent:'';
  if(subtitle){
    const f1=document.getElementById('f-data-ini')?.value;
    const f2=document.getElementById('f-data-fim')?.value;
    const periodo=(f1||f2)?`Período: ${f1?fmtDate(f1):'início'} até ${f2?fmtDate(f2):'hoje'}`:'Resumo gerencial para compartilhamento';
    subtitle.textContent=`${periodo} • Gerado em ${new Date().toLocaleString('pt-BR')}`;
  }
  const oldScroll=window.scrollY;
  document.body.classList.add('export-clean');
  el.style.width='1440px';
  el.style.maxWidth='1440px';
  el.style.padding='24px';
  await new Promise(r=>setTimeout(r,250));
  try{return await callback(el);}finally{
    document.body.classList.remove('export-clean');
    el.style.width='';el.style.maxWidth='';el.style.padding='';
    if(subtitle)subtitle.textContent=oldSubtitle;
    window.scrollTo(0,oldScroll);
  }
}
async function exportPDF(){
  showToast('Gerando PDF limpo, sem filtros...','info');
  try{
    const{jsPDF}=window.jspdf;
    await withCleanExport(async(el)=>{
      const bg=getCurrentBgColor();
      const canvas=await html2canvas(el,{scale:1.35,backgroundColor:bg,useCORS:true,logging:false,windowWidth:1500,scrollX:0,scrollY:0});
      const imgData=canvas.toDataURL('image/jpeg',0.96);
      const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
      const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
      const m=7,hh=12,uw=pw-m*2,uh=ph-m*2-hh;
      const ih=(canvas.height*uw)/canvas.width;
      const bgRgb=rgbFromCssColor(bg), cardRgb=rgbFromCssColor(getCurrentCardColor());
      const addHeader=(page)=>{
        pdf.setFillColor(bgRgb[0],bgRgb[1],bgRgb[2]);pdf.rect(0,0,pw,ph,'F');
        pdf.setFillColor(cardRgb[0],cardRgb[1],cardRgb[2]);pdf.rect(0,0,pw,m+hh-1,'F');
        pdf.setTextColor(245,158,11);pdf.setFontSize(11);pdf.setFont('helvetica','bold');
        pdf.text('GRUPO CARMAIS — DASHBOARD SEMINOVOS',m,m+3);
        pdf.setTextColor(120,132,153);pdf.setFont('helvetica','normal');pdf.setFontSize(8);
        pdf.text(`${new Date().toLocaleString('pt-BR')}  •  Página ${page}`,pw-m,m+3,{align:'right'});
      };
      let page=1;addHeader(page);pdf.addImage(imgData,'JPEG',m,m+hh,uw,ih);
      let remaining=ih-uh,offset=-uh;
      while(remaining>2){page++;pdf.addPage('a4','landscape');addHeader(page);pdf.addImage(imgData,'JPEG',m,m+hh+offset,uw,ih);remaining-=uh;offset-=uh;}
      pdf.save(`dashboard_seminovos_apresentacao_${dateStr(new Date())}.pdf`);
    });
    showToast('PDF gerado sem filtros!','success');
  }catch(e){showToast('Erro PDF: '+e.message,'error');}
}
async function exportJPEG(){
  showToast('Gerando imagem limpa para WhatsApp...','info');
  try{
    await withCleanExport(async(el)=>{
      const bg=getCurrentBgColor();
      const canvas=await html2canvas(el,{scale:1.15,backgroundColor:bg,useCORS:true,logging:false,windowWidth:1500,scrollX:0,scrollY:0});
      const blob=await new Promise(res=>canvas.toBlob(res,'image/jpeg',0.94));
      const filename=`dashboard_seminovos_whatsapp_${dateStr(new Date())}.jpg`;
      const file=new File([blob],filename,{type:'image/jpeg'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:'Dashboard Seminovos — Grupo Carmais',text:'Dashboard Seminovos — Grupo Carmais'});
      }else{
        const a=document.createElement('a');a.download=filename;a.href=URL.createObjectURL(blob);a.click();
        setTimeout(()=>URL.revokeObjectURL(a.href),3000);
      }
    });
    showToast('Imagem pronta para WhatsApp!','success');
  }catch(e){
    if(String(e.message||'').toLowerCase().includes('share'))showToast('Compartilhamento cancelado.','info');
    else showToast('Erro imagem: '+e.message,'error');
  }
}
async function exportSectionImage(sectionId, title) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  showToast('Gerando imagem...', 'info');
  try {
    const canvas = await html2canvas(el, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg2').trim() || '#1e293b', scale: 2, useCORS: true, logging: false });
    const link = document.createElement('a');
    link.download = (title||'analise').replace(/\s+/g,'_') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Imagem salva!', 'success');
  } catch(e) { showToast('Erro ao gerar imagem: '+e.message, 'error'); }
}

async function exportSectionWhatsApp(sectionId, title) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  showToast('Preparando para WhatsApp...', 'info');
  try {
    const canvas = await html2canvas(el, { backgroundColor: '#1e293b', scale: 1.5, useCORS: true, logging: false });
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = (title||'analise').replace(/\s+/g,'_')+'_whatsapp.jpg';
      a.click(); setTimeout(()=>URL.revokeObjectURL(url),2000);
      showToast('Imagem otimizada para WhatsApp salva!', 'success');
    }, 'image/jpeg', 0.85);
  } catch(e) { showToast('Erro: '+e.message, 'error'); }
}

async function exportAnalyticsPDF() {
  showToast('Gerando PDF completo... aguarde', 'info');
  try {
    const el = document.getElementById('tab-analytics');
    const canvas = await html2canvas(el, { backgroundColor: '#1e293b', scale: 1.5, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width/1.5, canvas.height/1.5] });
    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width/1.5, canvas.height/1.5);
    pdf.save('analise_carmais_' + new Date().toISOString().slice(0,10) + '.pdf');
    showToast('PDF salvo!', 'success');
  } catch(e) { showToast('Erro ao gerar PDF: '+e.message, 'error'); }
}

async function exportAnalyticsImage() {
  showToast('Gerando imagem da análise...', 'info');
  try {
    const el = document.getElementById('tab-analytics');
    const canvas = await html2canvas(el, { backgroundColor: '#1e293b', scale: 1.5, useCORS: true, logging: false });
    const link = document.createElement('a');
    link.download = 'analise_carmais_' + new Date().toISOString().slice(0,10) + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Imagem salva!', 'success');
  } catch(e) { showToast('Erro: '+e.message, 'error'); }
}
