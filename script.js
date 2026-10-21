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
  document.getElementById("status-filter").addEventListener("change",renderOrders);document.getElementById("order-sort")?.addEventListener("change",renderOrders);
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
      ["exitDate","Data de saída","date","",false],
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
    const [name,label,type,placeholder,_required,span]=f;
    const required=false; // Todos os campos são opcionais, conforme solicitado.
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
    const orders=data.orders.filter(o=>(!status||o.status===status)&&[o.id,o.client,o.device,o.phone,o.problem].some(v=>String(v||"").toLowerCase().includes(q)));const sort=document.getElementById("order-sort")?.value||"recent";orders.sort((a,b)=>sort==="client"?String(a.client||"").localeCompare(String(b.client||""),"pt-BR"):sort==="value"?Number(b.value||0)-Number(a.value||0):sort==="old"?String(a.date||"").localeCompare(String(b.date||"")):String(b.date||"").localeCompare(String(a.date||"")));
    document.getElementById("orders-table").innerHTML=orderRows(orders,true,true);
    setEmpty("orders-empty",orders.length===0);
    document.querySelectorAll("[data-edit-status]").forEach(b=>b.addEventListener("click",()=>cycleStatus(b.dataset.editStatus)));
    document.querySelectorAll("[data-print-order]").forEach(b=>b.addEventListener("click",()=>printOrder(b.dataset.printOrder)));
    document.querySelectorAll("[data-edit-order]").forEach(b=>b.addEventListener("click",()=>editOrder(b.dataset.editOrder)));
  }
  function printOrder(id){
    const o=data.orders.find(x=>x.id===id);if(!o)return;
    const w=window.open("","_blank","width=900,height=1000");if(!w){showToast("Permita pop-ups para imprimir.");return}
    const warrantyDays=Number(o.warranty??90);
    const delivered=o.deliveryDate||"";
    let validUntil="A definir na entrega";
    if(delivered){const d=new Date(delivered+"T12:00:00");d.setDate(d.getDate()+warrantyDays);validUntil=d.toLocaleDateString("pt-BR")}
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WFROZ · Ordem ${esc(o.id)}</title><style>
    *{box-sizing:border-box}body{font:14px Arial,sans-serif;color:#172033;background:#fff;margin:0;padding:28px}.sheet{max-width:780px;margin:auto;border:1px solid #dce3ee;border-radius:14px;overflow:hidden}.head{padding:26px 30px;background:#07152b;color:#fff;border-bottom:5px solid #087bff;display:flex;justify-content:space-between;align-items:center}.brand{font-size:27px;font-weight:900;letter-spacing:1px}.brand span{color:#1683ff}.sub{font-size:10px;letter-spacing:2px;color:#a9c8f8;margin-top:5px}.tag{border:1px solid #4777b9;padding:8px 12px;border-radius:7px;font-weight:bold;font-size:12px}.body{padding:26px 30px}h2{font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#075bd5;margin:25px 0 12px;border-bottom:1px solid #d9e4f5;padding-bottom:8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.item{border:1px solid #e0e7f0;border-radius:8px;padding:11px;min-height:55px}.item.full{grid-column:1/-1}.label{display:block;font-size:9px;font-weight:bold;letter-spacing:1px;color:#65748b;text-transform:uppercase;margin-bottom:6px}.value{font-size:13px;line-height:1.45;overflow-wrap:anywhere}.warranty{background:#f0f6ff;border:1px solid #c8ddff;border-left:4px solid #087bff;padding:15px;border-radius:8px;line-height:1.6}.sign{display:grid;grid-template-columns:1fr 1fr;gap:45px;margin:55px 0 20px}.sign div{border-top:1px solid #65748b;text-align:center;padding-top:9px;font-size:11px}.foot{background:#f5f8fc;border-top:1px solid #e0e7f0;padding:14px 30px;color:#64748b;font-size:10px;display:flex;justify-content:space-between;gap:15px}.actions{max-width:780px;margin:15px auto;display:flex;justify-content:flex-end;gap:8px}.actions button{border:0;border-radius:8px;padding:11px 16px;font-weight:bold;background:#087bff;color:#fff}.actions button:last-child{background:#e8edf5;color:#172033}@media(max-width:600px){body{padding:8px}.head,.body{padding:18px}.grid{grid-template-columns:1fr}.item.full{grid-column:auto}.foot{padding:12px;display:block}.tag{font-size:10px}}@media print{body{padding:0}.sheet{border:0;border-radius:0}.actions{display:none}.head{-webkit-print-color-adjust:exact;print-color-adjust:exact}.warranty,.foot{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
    </style></head><body><article class="sheet"><header class="head"><div style="display:flex;align-items:center;gap:14px"><img src="data:image/jpeg;base64,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" alt="Logo da assistência" style="width:54px;height:54px;object-fit:cover;border-radius:10px;border:1px solid #ffffff40"><div><div class="brand">WFROZ<span>.</span></div><div class="sub">GESTÃO TÉCNICA · ASSISTÊNCIA</div></div></div><div class="tag">ORDEM ${esc(o.id)}</div></header><main class="body"><h2>Relatório de serviço</h2><div class="grid"><div class="item"><span class="label">Cliente</span><div class="value">${esc(o.client||"—")}</div></div><div class="item"><span class="label">Telefone</span><div class="value">${esc(o.phone||"—")}</div></div><div class="item"><span class="label">Aparelho</span><div class="value">${esc(o.device||"—")}</div></div><div class="item"><span class="label">Data de entrada</span><div class="value">${datePt(o.date)}</div></div><div class="item"><span class="label">Data de saída</span><div class="value">${o.exitDate?datePt(o.exitDate):"Não informada"}</div></div><div class="item full"><span class="label">Defeito relatado</span><div class="value">${esc(o.problem||"—")}</div></div><div class="item full"><span class="label">Serviço realizado / observações</span><div class="value">${esc(o.notes||"—")}</div></div><div class="item"><span class="label">Status</span><div class="value">${esc(o.status||"—")}</div></div><div class="item"><span class="label">Valor do serviço</span><div class="value"><b>${money(o.value)}</b></div></div></div><h2>Termo de garantia · ${warrantyDays} dias</h2><div class="warranty">${esc(o.warrantyTerms||"Garantia cobre apenas o serviço realizado e a peça substituída; não cobre mau uso, quedas, líquidos ou violação por terceiros.")}</div><div class="grid" style="margin-top:12px"><div class="item"><span class="label">Data da entrega</span><div class="value">${delivered?datePt(delivered):"____/____/________"}</div></div><div class="item"><span class="label">Garantia válida até</span><div class="value">${validUntil}</div></div></div><p style="font-size:11px;line-height:1.6;margin-top:18px">Declaro que recebi as informações deste relatório e uma cópia do termo de garantia.</p><div class="sign"><div>Assinatura do cliente</div><div>Assinatura da assistência</div></div></main><footer class="foot"><span>${esc(data.business||"WFROZ · Assistência técnica")}</span><span>Documento emitido em ${new Date().toLocaleDateString("pt-BR")}</span></footer></article><div class="actions"><button onclick="window.print()">Imprimir / Salvar em PDF</button><button onclick="window.close()">Fechar</button></div></body></html>`);w.document.close();
  }
  function editOrder(id){
    const o=data.orders.find(x=>x.id===id);if(!o)return;
    const ask=(label,current)=>prompt(label,current??"");
    const client=ask("Editar nome do cliente:",o.client);if(client===null)return;
    const phone=ask("Editar telefone:",o.phone||"");if(phone===null)return;
    const device=ask("Editar aparelho/modelo:",o.device);if(device===null)return;
    const problem=ask("Editar defeito relatado:",o.problem);if(problem===null)return;
    const notes=ask("Editar serviço realizado / observações:",o.notes||"");if(notes===null)return;
    const value=ask("Editar valor do serviço (R$):",String(o.value??0));if(value===null)return;
    const parsed=Number(value.replace(",","."));if(!Number.isFinite(parsed)||parsed<0){showToast("Informe um valor válido.");return}
    const warranty=ask("Prazo de garantia em dias:",String(o.warranty??90));if(warranty===null)return;
    const days=Number(warranty);if(!Number.isFinite(days)||days<0){showToast("Informe um prazo de garantia válido.");return}
    const terms=ask("Condições da garantia:",o.warrantyTerms||"Garantia cobre apenas o serviço realizado e a peça substituída; não cobre mau uso, quedas, líquidos ou violação por terceiros.");if(terms===null)return;
    o.client=client.trim()||o.client;o.phone=phone.trim();o.device=device.trim()||o.device;o.problem=problem.trim();o.notes=notes.trim();o.value=parsed;o.warranty=days;o.warrantyTerms=terms.trim();
    save();showToast("Ordem, relatório e garantia atualizados.");
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
