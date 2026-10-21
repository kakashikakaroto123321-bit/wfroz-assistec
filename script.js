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
    </style></head><body><article class="sheet"><header class="head"><div style="display:flex;align-items:center;gap:14px"><img src="data:image/png;base64,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" alt="Logo da assistência" style="width:54px;height:54px;object-fit:cover;border-radius:10px;border:1px solid #ffffff40"><div><div class="brand">WFROZ<span>.</span></div><div class="sub">GESTÃO TÉCNICA · ASSISTÊNCIA</div></div></div><div class="tag">ORDEM ${esc(o.id)}</div></header><main class="body"><h2>Relatório de serviço</h2><div class="grid"><div class="item"><span class="label">Cliente</span><div class="value">${esc(o.client||"—")}</div></div><div class="item"><span class="label">Telefone</span><div class="value">${esc(o.phone||"—")}</div></div><div class="item"><span class="label">Aparelho</span><div class="value">${esc(o.device||"—")}</div></div><div class="item"><span class="label">Data de entrada</span><div class="value">${datePt(o.date)}</div></div><div class="item"><span class="label">Data de saída</span><div class="value">${o.exitDate?datePt(o.exitDate):"Não informada"}</div></div><div class="item full"><span class="label">Defeito relatado</span><div class="value">${esc(o.problem||"—")}</div></div><div class="item full"><span class="label">Serviço realizado / observações</span><div class="value">${esc(o.notes||"—")}</div></div><div class="item"><span class="label">Status</span><div class="value">${esc(o.status||"—")}</div></div><div class="item"><span class="label">Valor do serviço</span><div class="value"><b>${money(o.value)}</b></div></div></div><h2>Termo de garantia · ${warrantyDays} dias</h2><div class="warranty">${esc(o.warrantyTerms||"Garantia cobre apenas o serviço realizado e a peça substituída; não cobre mau uso, quedas, líquidos ou violação por terceiros.")}</div><div class="grid" style="margin-top:12px"><div class="item"><span class="label">Data da entrega</span><div class="value">${delivered?datePt(delivered):"____/____/________"}</div></div><div class="item"><span class="label">Garantia válida até</span><div class="value">${validUntil}</div></div></div><p style="font-size:11px;line-height:1.6;margin-top:18px">Declaro que recebi as informações deste relatório e uma cópia do termo de garantia.</p><div class="sign"><div>Assinatura do cliente</div><div>Assinatura da assistência</div></div></main><footer class="foot"><span>${esc(data.business||"WFROZ · Assistência técnica")}</span><span>Documento emitido em ${new Date().toLocaleDateString("pt-BR")}</span></footer></article><div class="actions"><button onclick="window.print()">Imprimir / Salvar em PDF</button><button onclick="window.close()">Fechar</button></div></body></html>`);w.document.close();
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
