(() => {
  "use strict";
  const KEY = "conserta-demo-v1";
  const statuses = ["Aguardando", "Em andamento", "Aguardando peça", "Concluída", "Entregue"];
  const statusClass = s => "status-" + s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-");
  const initials = name => (name || "?").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  const money = n => Number(n || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const datePt = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR") : "—";
  const today = () => new Date().toISOString().slice(0,10);
  const defaultData = () => ({business:"Minha assistência", orders:[], clients:[], technicians:[]});
  let data = loadData(), modalType = "order", toastTimer;
  function loadData(){try{return {...defaultData(),...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return defaultData()}}
  function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function showToast(message){const t=document.getElementById("toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2600)}
  function nextId(){return "OS-"+String(Date.now()).slice(-6)}
  function pageName(page){return ({dashboard:"Visão geral",orders:"Ordens de serviço",clients:"Clientes",devices:"Aparelhos",technicians:"Técnicos",finance:"Financeiro",settings:"Configurações"})[page]||"Visão geral"}
  function go(page){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));document.getElementById("breadcrumb-page").textContent=pageName(page);document.getElementById("sidebar").classList.remove("open");if(page==="orders")renderOrders();if(page==="clients")renderClients();if(page==="devices")renderDevices();if(page==="technicians")renderTechnicians();if(page==="finance")renderFinance()}
  document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
  document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.goto)));
  document.getElementById("mobile-menu").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
  document.getElementById("sidebar-toggle").addEventListener("click",()=>{document.body.classList.toggle("sidebar-hidden");localStorage.setItem("conserta-sidebar-hidden",document.body.classList.contains("sidebar-hidden")?"1":"0")});
  if(localStorage.getItem("conserta-sidebar-hidden")==="1")document.body.classList.add("sidebar-hidden");
  document.getElementById("fullscreen-toggle").addEventListener("click",async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{showToast("Tela cheia não disponível neste navegador.")}});
  document.getElementById("google-setup").addEventListener("click",()=>alert("Para ativar: crie um projeto em console.firebase.google.com, habilite Authentication > Google e Firestore Database, registre este domínio em Authentication > Settings > Authorized domains e configure as credenciais no projeto. Para compartilhar dados entre usuários, os cadastros precisam migrar do localStorage para o Firestore com regras de segurança."));

  document.getElementById("today-label").textContent=new Date().toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short",year:"numeric"});
  document.getElementById("notifications").addEventListener("click",()=>showToast("Você está em dia com as notificações."));
  document.getElementById("help-btn").addEventListener("click",()=>showToast("Dica: atualize o status de cada ordem conforme o reparo avança."));
  ["new-order-top","empty-new-order","quick-order","new-order-list","new-device"].forEach(id=>document.getElementById(id).addEventListener("click",()=>openModal("order")));
  document.getElementById("new-client").addEventListener("click",()=>openModal("client"));
  document.getElementById("new-technician").addEventListener("click",()=>openModal("technician"));
  document.getElementById("close-modal").addEventListener("click",closeModal);
  document.getElementById("cancel-modal").addEventListener("click",closeModal);
  document.getElementById("modal-backdrop").addEventListener("click",e=>{if(e.target.id==="modal-backdrop")closeModal()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
  document.getElementById("order-search").addEventListener("input",renderOrders);
  document.getElementById("status-filter").addEventListener("change",renderOrders);
  document.getElementById("client-search").addEventListener("input",renderClients);
  document.getElementById("device-search").addEventListener("input",renderDevices);

  const fields = {
    order: [
      ["client","Nome do cliente","text","Ex.: Maria Oliveira",true],
      ["phone","Telefone","tel","(00) 00000-0000",true],
      ["device","Aparelho / modelo","text","Ex.: Samsung Galaxy A54",true],
      ["problem","Defeito relatado","textarea","Descreva o problema informado",true,"full"],
      ["technician","Técnico responsável","select","",false],
      ["status","Status","select","",true],
      ["value","Valor estimado (R$)","number","0,00",false],
      ["warranty","Garantia (dias)","number","Ex.: 90",false],
      ["warrantyTerms","Condições da garantia","textarea","Descreva o que a garantia cobre e as exclusões",false,"full"],
      ["date","Data de entrada","date","",true],
      ["notes","Observações","textarea","Notas adicionais",false,"full"]
    ],
    client: [
      ["name","Nome completo","text","Nome do cliente",true,"full"],
      ["phone","Telefone","tel","(00) 00000-0000",true],
      ["email","E-mail","email","cliente@email.com",false],
      ["notes","Observações","textarea","Informações adicionais",false,"full"]
    ],
    technician: [
      ["name","Nome do técnico","text","Nome completo",true,"full"],
      ["specialty","Especialidade","text","Ex.: Smartphones e tablets",true],
      ["phone","Telefone","tel","(00) 00000-0000",false],
      ["email","E-mail","email","tecnico@email.com",false]
    ]
  };
  function fieldHtml(f){
    const [name,label,type,placeholder,required,span]=f;
    let control="";
    if(type==="select"){
      const opts=name==="status"?statuses:data.technicians.map(t=>t.name);
      control=`<select name="${name}" ${required?"required":""}><option value="">${name==="status"?"Selecione o status":"Sem atribuição"}</option>${opts.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join("")}</select>`;
    } else if(type==="textarea") control=`<textarea name="${name}" placeholder="${esc(placeholder)}" ${required?"required":""}></textarea>`;
    else control=`<input name="${name}" type="${type}" placeholder="${esc(placeholder)}" ${required?"required":""} ${name==="value"?'min="0" step="0.01"':''} ${name==="date"?`value="${today()}"`:''}>`;
    return `<div class="field-group ${span==="full"?"full":""}"><label for="field-${name}">${label}${required?' <span style="color:#d35450">*</span>':''}</label>${control}</div>`.replace(`name="${name}"`,`name="${name}" id="field-${name}"`);
  }
  function openModal(type){
    modalType=type;const titles={order:"Nova ordem de serviço",client:"Novo cliente",technician:"Adicionar técnico"};
    document.getElementById("modal-title").textContent=titles[type];
    document.getElementById("submit-modal").textContent=type==="order"?"Criar ordem":"Salvar cadastro";
    document.getElementById("form-error").textContent="";
    document.getElementById("modal-fields").innerHTML=fields[type].map(fieldHtml).join("");
    document.getElementById("modal-backdrop").hidden=false;
    setTimeout(()=>document.querySelector("#modal-fields input")?.focus(),50);
  }
  function closeModal(){document.getElementById("modal-backdrop").hidden=true;document.getElementById("modal-form").reset()}
  document.getElementById("modal-form").addEventListener("submit",e=>{
    e.preventDefault();const fd=new FormData(e.currentTarget),v=Object.fromEntries(fd.entries());
    if(modalType==="order"){
      const order={...v,id:nextId(),date:v.date||today(),status:v.status||"Aguardando",value:Number(v.value)||0,warranty:Number(v.warranty)||90,warrantyTerms:v.warrantyTerms||"Garantia cobre apenas o serviço realizado e a peça substituída; não cobre mau uso, quedas, líquidos ou violação por terceiros."};
      data.orders.unshift(order);
      const exists=data.clients.some(c=>c.name.trim().toLowerCase()===v.client.trim().toLowerCase());
      if(!exists&&v.client.trim())data.clients.push({name:v.client.trim(),phone:v.phone,email:"",notes:""});
      closeModal();save();go("orders");showToast("Ordem de serviço criada com sucesso.");
    }else if(modalType==="client"){
      data.clients.push({name:v.name.trim(),phone:v.phone,email:v.email,notes:v.notes});
      closeModal();save();go("clients");showToast("Cliente cadastrado com sucesso.");
    }else{
      data.technicians.push({...v,id:"TEC-"+Date.now().toString().slice(-5)});
      closeModal();save();go("technicians");showToast("Técnico adicionado à equipe.");
    }
  });
  function statusBadge(s){return `<span class="status-pill ${statusClass(s)}">${esc(s)}</span>`}
  function orderRows(orders,includeDate=false,actions=true){
    return orders.map(o=>`<tr><td><span class="order-id">#${esc(o.id)}</span></td><td><div class="customer-cell"><div class="mini-avatar">${esc(initials(o.client))}</div><div><strong>${esc(o.client)}</strong><small>${esc(o.device)}</small></div></div></td>${includeDate?`<td>${datePt(o.date)}</td>`:""}<td>${statusBadge(o.status)}</td><td><strong style="color:#344057;font-size:10px">${money(o.value)}</strong></td>${actions?`<td><button class="row-menu" data-edit-status="${esc(o.id)}" title="Alterar status">↻</button> <button class="row-menu" data-print-order="${esc(o.id)}" title="Imprimir relatório e garantia">▤</button> <button class="row-menu" data-edit-order="${esc(o.id)}" title="Editar relatório">✎</button></td>`:""}</tr>`).join("");
  }
  function setEmpty(id,show){document.getElementById(id).classList.toggle("show",show)}
  function renderOrders(){
    const q=(document.getElementById("order-search")?.value||"").toLowerCase(),status=document.getElementById("status-filter")?.value||"";
    const orders=data.orders.filter(o=>(!status||o.status===status)&&[o.id,o.client,o.device,o.phone,o.problem].some(v=>String(v||"").toLowerCase().includes(q)));
    document.getElementById("orders-table").innerHTML=orderRows(orders,true,true);
    setEmpty("orders-empty",orders.length===0);
    document.querySelectorAll("[data-edit-status]").forEach(b=>b.addEventListener("click",()=>cycleStatus(b.dataset.editStatus)));
    document.querySelectorAll("[data-print-order]").forEach(b=>b.addEventListener("click",()=>printOrder(b.dataset.printOrder)));
    document.querySelectorAll("[data-edit-order]").forEach(b=>b.addEventListener("click",()=>editOrder(b.dataset.editOrder)));
  }
  function printOrder(id){
    const o=data.orders.find(x=>x.id===id);if(!o)return;
    const w=window.open("","_blank","width=800,height=900");if(!w){showToast("Permita pop-ups para imprimir.");return}
    w.document.write(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Relatório e garantia ${esc(o.id)}</title><style>body{font:14px Arial;color:#111;padding:35px;max-width:760px;margin:auto}h1{font-size:22px}h2{font-size:16px;margin-top:28px;border-bottom:1px solid #aaa;padding-bottom:6px}.line{border-bottom:1px solid #ddd;padding:9px 0}.sign{display:flex;gap:40px;margin-top:70px}.sign div{flex:1;border-top:1px solid #333;text-align:center;padding-top:8px}@media print{button{display:none}}</style><h1>${esc(data.business||"Assistência técnica")}</h1><h2>RELATÓRIO DE SERVIÇO E TERMO DE GARANTIA</h2><div class="line"><b>Ordem:</b> ${esc(o.id)} &nbsp; <b>Data:</b> ${datePt(o.date)}</div><div class="line"><b>Cliente:</b> ${esc(o.client)} &nbsp; <b>Telefone:</b> ${esc(o.phone)}</div><div class="line"><b>Aparelho:</b> ${esc(o.device)}</div><div class="line"><b>Defeito relatado:</b> ${esc(o.problem)}</div><div class="line"><b>Serviço/observações:</b> ${esc(o.notes||"—")}</div><div class="line"><b>Valor:</b> ${money(o.value)} &nbsp; <b>Status:</b> ${esc(o.status)}</div><h2>GARANTIA — ${Number(o.warranty??90)} DIAS</h2><p>${esc(o.warrantyTerms||"Garantia cobre apenas o serviço realizado e a peça substituída; não cobre mau uso, quedas, líquidos ou violação por terceiros.")}</p><p>Data de entrega: ____/____/________ &nbsp; Validade até: ____/____/________</p><p>Declaro que recebi as informações acima e uma cópia deste relatório.</p><div class="sign"><div>Assinatura do cliente</div><div>Assinatura da assistência</div></div><p style="margin-top:35px;font-size:11px">Documento emitido em ${new Date().toLocaleDateString("pt-BR")}. Ajuste os termos conforme a política da assistência e a legislação aplicável.</p><script>window.onload=()=>window.print()<\/script></html>`);w.document.close();
  }
  function editOrder(id){
    const o=data.orders.find(x=>x.id===id);if(!o)return;
    const changes=prompt("Editar relatório/garantia. Informe o novo prazo de garantia em dias:",String(o.warranty??90));if(changes===null)return;
    const days=Number(changes);if(!Number.isFinite(days)||days<0){showToast("Informe um prazo válido.");return}
    const terms=prompt("Condições da garantia:",o.warrantyTerms||"Garantia cobre apenas o serviço realizado e a peça substituída; não cobre mau uso, quedas, líquidos ou violação por terceiros.");if(terms===null)return;
    const notes=prompt("Observações do relatório:",o.notes||"");if(notes===null)return;
    o.warranty=days;o.warrantyTerms=terms;o.notes=notes;save();showToast("Relatório e garantia atualizados.");
  }
  function cycleStatus(id){const o=data.orders.find(x=>x.id===id);if(!o)return;const i=statuses.indexOf(o.status);o.status=statuses[(i+1)%statuses.length];save();showToast(`Status de ${id} alterado para "${o.status}".`)}
  function renderClients(){
    const q=(document.getElementById("client-search")?.value||"").toLowerCase();
    const clients=data.clients.filter(c=>[c.name,c.phone,c.email].some(v=>String(v||"").toLowerCase().includes(q)));
    document.getElementById("clients-table").innerHTML=clients.map(c=>`<tr><td><div class="customer-cell"><div class="mini-avatar">${esc(initials(c.name))}</div><div><strong>${esc(c.name)}</strong><small>${esc(c.notes||"Cliente cadastrado")}</small></div></div></td><td>${esc(c.phone||"—")}</td><td>${esc(c.email||"—")}</td><td>${data.orders.filter(o=>o.client===c.name).length}</td><td><button class="row-menu" data-delete-client="${esc(c.name)}" title="Excluir cliente">⋯</button></td></tr>`).join("");
    document.getElementById("client-total").textContent=`${clients.length} cliente(s)`;
    setEmpty("clients-empty",clients.length===0);
    document.querySelectorAll("[data-delete-client]").forEach(b=>b.addEventListener("click",()=>{if(confirm(`Excluir o cadastro de ${b.dataset.deleteClient}?`)){data.clients=data.clients.filter(c=>c.name!==b.dataset.deleteClient);save();showToast("Cliente excluído.")}}));
  }
  function renderDevices(){
    const q=(document.getElementById("device-search")?.value||"").toLowerCase();
    const orders=data.orders.filter(o=>[o.device,o.client,o.problem,o.id].some(v=>String(v||"").toLowerCase().includes(q)));
    document.getElementById("devices-table").innerHTML=orders.map(o=>`<tr><td><div class="customer-cell"><div class="mini-avatar">▣</div><div><strong>${esc(o.device)}</strong><small>${esc(o.phone||"Sem telefone")}</small></div></div></td><td>${esc(o.client)}</td><td>${esc(o.problem)}</td><td>${statusBadge(o.status)}</td><td><span class="order-id">#${esc(o.id)}</span></td></tr>`).join("");
    setEmpty("devices-empty",orders.length===0);
  }
  function renderTechnicians(){
    document.getElementById("technician-grid").innerHTML=data.technicians.map(t=>`<article class="technician-card"><div class="tech-head"><div class="tech-avatar">${esc(initials(t.name))}</div><div><strong>${esc(t.name)}</strong><small>${esc(t.specialty||"Técnico")}</small></div></div><div class="tech-stat"><span>Ordens atribuídas</span><strong>${data.orders.filter(o=>o.technician===t.name).length}</strong></div><div class="tech-stat"><span>Contato</span><strong>${esc(t.phone||"—")}</strong></div></article>`).join("");
    setEmpty("technicians-empty",data.technicians.length===0);
  }
  function renderFinance(){
    const total=data.orders.reduce((s,o)=>s+Number(o.value||0),0),done=data.orders.filter(o=>["Concluída","Entregue"].includes(o.status)).reduce((s,o)=>s+Number(o.value||0),0);
    document.getElementById("finance-total").textContent=money(total);document.getElementById("finance-paid").textContent=money(done);document.getElementById("finance-pending").textContent=money(total-done);
    document.getElementById("finance-table").innerHTML=data.orders.map(o=>`<tr><td><span class="order-id">#${esc(o.id)}</span></td><td>${esc(o.client)}</td><td>${statusBadge(o.status)}</td><td><strong style="color:#344057">${money(o.value)}</strong></td></tr>`).join("");
    setEmpty("finance-empty",data.orders.length===0);
  }
  function render(){
    const orders=data.orders;document.getElementById("stat-open").textContent=orders.filter(o=>["Aguardando","Aguardando peça"].includes(o.status)).length;
    document.getElementById("stat-progress").textContent=orders.filter(o=>o.status==="Em andamento").length;
    document.getElementById("stat-done").textContent=orders.filter(o=>["Concluída","Entregue"].includes(o.status)).length;
    document.getElementById("stat-revenue").textContent=money(orders.reduce((s,o)=>s+Number(o.value||0),0));
    document.getElementById("nav-order-count").textContent=orders.length;
    document.getElementById("recent-orders").innerHTML=orderRows(orders.slice(0,5),false,false);
    setEmpty("recent-empty",orders.length===0);
    document.querySelector(".workspace strong").textContent=data.business||"Minha assistência";
    document.getElementById("business-name").value=data.business||"Minha assistência";
    renderOrders();renderClients();renderDevices();renderTechnicians();renderFinance();
  }
  document.getElementById("save-settings").addEventListener("click",()=>{data.business=document.getElementById("business-name").value.trim()||"Minha assistência";save();showToast("Configurações salvas.")});
  document.getElementById("export-data").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="backup-wfroz.json";a.click();URL.revokeObjectURL(a.href);showToast("Backup exportado.")});
  document.getElementById("clear-data").addEventListener("click",()=>{if(confirm("Tem certeza que deseja apagar todos os clientes, técnicos e ordens salvos neste navegador? Esta ação não pode ser desfeita.")){data=defaultData();save();showToast("Dados locais apagados.")}});
  render();
})();
