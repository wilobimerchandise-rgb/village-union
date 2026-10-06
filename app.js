/* =========================================================
   Village Union — Modern Frontend
   Wrapped in DOMContentLoaded to guarantee elements exist.
   ========================================================= */

const VILLAGE_NAMES = ["Umunneochi","Arochukwu","Ibeku","Ohafia","Abiriba",
  "Bende","Ihiagwa","Mbaise","Nguru","Isiala"];
const LEVY_TYPES = ["Annual Dues","Burial Levy","Life Insurance Levy","Party Donations","Support Levy"];
const PAGE_SIZE = 8;

/* ---------- STORAGE ---------- */
const DB = {
  get:(k)=>JSON.parse(localStorage.getItem(k)||"[]"),
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),
};

/* ---------- SEED ---------- */
function seedData(){
  if(localStorage.getItem("vu_seeded")) return;
  const villages = VILLAGE_NAMES.map((n,i)=>({id:`v${i+1}`,name:n,code:`VU-${String(i+1).padStart(3,"0")}`}));
  DB.set("vu_villages", villages);

  const users = [];
  villages.forEach((v,i)=>{
    users.push({id:`u_a_${i+1}`,villageId:v.id,role:"admin",
      username:`admin${i+1}`,password:"admin123",name:`Admin ${i+1}`});
    for(let m=1;m<=3;m++){
      users.push({id:`u_m_${i+1}_${m}`,villageId:v.id,role:"member",
        username:`member${i+1}_${m}`,password:"member123",name:`Member ${m} of ${v.name}`});
    }
  });
  DB.set("vu_users", users);

  const tx = []; let txId = 1;
  villages.forEach(v=>{
    const members = users.filter(u=>u.villageId===v.id && u.role==="member");
    members.forEach((mem,mi)=>{
      LEVY_TYPES.slice(0,3).forEach((type,ti)=>{
        const date = new Date(2026, 8, 10+ti+mi);
        tx.push({
          id:`t${txId++}`, villageId:v.id, memberId:mem.id, memberName:mem.name,
          type, amount: 5000 + ti*2000 + mi*500,
          status:"verified", ref:`REF-${txId}`,
          proofImage:null, notes:"Sample seed data",
          submittedAt:date.toISOString(),
          verifiedBy:`admin${v.id.slice(1)}`, verifiedAt:date.toISOString(),
          editedBy:null, editedAt:null
        });
      });
    });
  });
  DB.set("vu_transactions", tx);
  DB.set("vu_audit", []);
  localStorage.setItem("vu_seeded","1");
}

/* ---------- TOASTS ---------- */
function toast(msg, type="success"){
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type==="success"?"✓":type==="error"?"✕":"ℹ"}</span><span>${msg}</span>`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(()=>{el.style.opacity="0";el.style.transform="translateX(20px)";
    setTimeout(()=>el.remove(),300)},3500);
}

/* ---------- CONFIRM DIALOG ---------- */
function confirmDialog(title, message){
  return new Promise(resolve=>{
    document.getElementById("cmTitle").textContent = title;
    document.getElementById("cmMessage").textContent = message;
    const btn = document.getElementById("cmConfirm");
    const modal = document.getElementById("confirmModal");
    modal.classList.add("active");
    const handler = ()=>{ modal.classList.remove("active"); btn.removeEventListener("click",handler); resolve(true); };
    btn.addEventListener("click", handler);
    modal.addEventListener("click", e=>{
      if(e.target===modal){ modal.classList.remove("active"); btn.removeEventListener("click",handler); resolve(false); }
    },{once:true});
  });
}

/* ---------- THEME ---------- */
function initTheme(){
  const saved = localStorage.getItem("vu_theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur==="dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("vu_theme", next);
  updateThemeIcon(next);
  // Redraw charts if visible
  if(window._charts) Object.values(window._charts).forEach(c=>c&&c.update&&c.update());
}
function updateThemeIcon(theme){
  document.querySelectorAll(".theme-toggle").forEach(b=>{
    if(b.id==="themeToggle" || b.closest(".sidebar-foot")) b.textContent = theme==="dark"?"☀️":"🌙";
  });
}

/* ---------- VIEW ROUTING ---------- */
function showView(id){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}

/* ---------- SIDEBAR TOGGLE ---------- */
function toggleSidebar(id){ document.getElementById(id).classList.toggle("open"); }

/* ---------- RENDER LANDING ---------- */
function renderVillages(){
  const villages = DB.get("vu_villages");
  const grid = document.getElementById("villageGrid");
  if(!grid) return;
  grid.innerHTML = villages.map((v,i)=>`
    <div class="village-card reveal">
      <div class="num">${i+1}</div>
      <h4>${v.name}</h4>
      <small>${v.code}</small>
    </div>`).join("");

  // Populate login dropdown — THIS IS THE FIX
  const sel = document.getElementById("loginVillage");
  if(sel){
    sel.innerHTML = `<option value="">-- Select your village --</option>` +
      villages.map(v=>`<option value="${v.id}">${v.name} (${v.code})</option>`).join("");
  }
  // Trigger reveal animations
  requestAnimationFrame(initReveal);
}

/* ---------- REVEAL ON SCROLL ---------- */
function initReveal(){
  const els = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("visible"); io.unobserve(e.target); } });
  },{threshold:.1});
  els.forEach(el=>io.observe(el));
}

/* ---------- LOGIN ---------- */
let currentUser = null;

function handleLogin(e){
  e.preventDefault();
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";

  const villageId = document.getElementById("loginVillage").value;
  const role = document.getElementById("loginRole").value;
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value;

  if(!villageId){ errEl.textContent = "Please select a village"; return; }

  const users = DB.get("vu_users");
  const user = users.find(u=>u.villageId===villageId && u.role===role
    && u.username===username && u.password===password);

  if(!user){
    errEl.textContent = "Invalid credentials for this village/role.";
    toast("Login failed. Check your details.","error");
    return;
  }

  currentUser = user;
  sessionStorage.setItem("vu_session", JSON.stringify(user));
  document.getElementById("loginForm").reset();
  toast(`Welcome back, ${user.name}!`);

  if(user.role==="admin") initAdminDash();
  else initMemberDash();
}

function logout(){
  currentUser = null;
  sessionStorage.removeItem("vu_session");
  showView("landing");
  toast("Logged out successfully","success");
}

function restoreSession(){
  const s = sessionStorage.getItem("vu_session");
  if(s){
    currentUser = JSON.parse(s);
    if(currentUser.role==="admin") initAdminDash();
    else initMemberDash();
  }
}

/* ---------- MEMBER DASHBOARD ---------- */
function initMemberDash(){
  showView("memberDash");
  const villages = DB.get("vu_villages");
  const vName = villages.find(v=>v.id===currentUser.villageId).name;
  document.getElementById("mVillageName").textContent = vName;
  document.getElementById("mWelcome").textContent = `Welcome, ${currentUser.name.split(" ")[0]}`;
  renderMemberOverview();
  bindTabSwitching("memberDash");
  bindMemberSearch();
  bindFileDrop();
}

function renderMemberOverview(){
  const tx = DB.get("vu_transactions").filter(t=>t.memberId===currentUser.id);
  const verified = tx.filter(t=>t.status==="verified");
  const total = verified.reduce((s,t)=>s+Number(t.amount),0);
  const pending = tx.filter(t=>t.status==="pending").length;

  document.getElementById("mStats").innerHTML = `
    <div class="stat"><div class="label">Total Verified</div><div class="value" data-count="${total}">₦ 0</div><div class="sub">${verified.length} transactions</div></div>
    <div class="stat"><div class="label">Pending</div><div class="value" data-count="${pending}">0</div><div class="sub">Awaiting admin</div></div>
    <div class="stat"><div class="label">This Month</div><div class="value" data-count="${monthTotal(tx)}">₦ 0</div><div class="sub">${new Date().toLocaleString('default',{month:'long',year:'numeric'})}</div></div>
  `;
  animateCounters();

  // Chart
  renderMemberChart(verified);

  // Recent
  const recent = [...tx].sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt)).slice(0,5);
  document.querySelector("#mRecentTable tbody").innerHTML = recent.map(t=>`
    <tr><td>${fmtDate(t.submittedAt)}</td><td>${t.type}</td><td>₦ ${Number(t.amount).toLocaleString()}</td>
    <td><span class="status ${t.status}">${t.status}</span></td></tr>`).join("")
    || `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:2rem">No transactions yet</td></tr>`;

  renderMemberAllTx();
}

function renderMemberChart(verified){
  const byType = {};
  LEVY_TYPES.forEach(t=>byType[t]=0);
  verified.forEach(t=>byType[t.type]+=Number(t.amount));
  const ctx = document.getElementById("mChart");
  if(!ctx) return;
  if(window._mChart) window._mChart.destroy();
  const isDark = document.documentElement.getAttribute("data-theme")==="dark";
  window._mChart = new Chart(ctx,{
    type:"doughnut",
    data:{labels:LEVY_TYPES,datasets:[{data:Object.values(byType),
      backgroundColor:["#0f766e","#0891b2","#f59e0b","#dc2626","#7c3aed"],borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:"bottom",labels:{color:isDark?"#e2e8f0":"#0f172a",padding:12}}}}
  });
}

let mPage = 1;
function renderMemberAllTx(){
  const search = (document.getElementById("mSearch")?.value||"").toLowerCase();
  let tx = DB.get("vu_transactions").filter(t=>t.memberId===currentUser.id);
  if(search) tx = tx.filter(t=>t.type.toLowerCase().includes(search)||t.status.includes(search)||(t.notes||"").toLowerCase().includes(search));
  tx.sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));

  const totalPages = Math.max(1, Math.ceil(tx.length/PAGE_SIZE));
  if(mPage>totalPages) mPage=1;
  const page = tx.slice((mPage-1)*PAGE_SIZE, mPage*PAGE_SIZE);

  document.querySelector("#mAllTable tbody").innerHTML = page.map(t=>`
    <tr><td>${fmtDate(t.submittedAt)}</td><td>${t.type}</td><td>₦ ${Number(t.amount).toLocaleString()}</td>
    <td><span class="status ${t.status}">${t.status}</span></td>
    <td>${t.verifiedBy||"—"}</td><td>${t.notes||"—"}</td></tr>`).join("")
    || `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem">No transactions</td></tr>`;

  renderPagination("mPagination", totalPages, p=>{mPage=p;renderMemberAllTx();});
}

function bindMemberSearch(){
  const s = document.getElementById("mSearch");
  if(s) s.addEventListener("input",()=>{mPage=1;renderMemberAllTx();});
}

/* ---------- PAGINATION ---------- */
function renderPagination(containerId, totalPages, onClick){
  const c = document.getElementById(containerId);
  if(!c) return;
  if(totalPages<=1){ c.innerHTML=""; return; }
  let html = `<button ${mPage===1?"disabled":""} data-p="${mPage-1}">‹</button>`;
  for(let i=1;i<=totalPages;i++){
    html += `<button class="${i===mPage?'active':''}" data-p="${i}">${i}</button>`;
  }
  html += `<button ${mPage===totalPages?"disabled":""} data-p="${mPage+1}">›</button>`;
  c.innerHTML = html;
  c.querySelectorAll("button").forEach(b=>{
    b.addEventListener("click",()=>{ if(!b.disabled) onClick(parseInt(b.dataset.p)); });
  });
}

/* ---------- FILE DROP ---------- */
function bindFileDrop(){
  const drop = document.getElementById("fileDrop");
  const input = document.getElementById("sProof");
  if(!drop||!input) return;
  drop.addEventListener("click",()=>input.click());
  drop.addEventListener("dragover",e=>{e.preventDefault();drop.classList.add("drag");});
  drop.addEventListener("dragleave",()=>drop.classList.remove("drag"));
  drop.addEventListener("drop",e=>{
    e.preventDefault();drop.classList.remove("drag");
    if(e.dataTransfer.files.length){ input.files=e.dataTransfer.files; updateDropLabel(); }
  });
  input.addEventListener("change",updateDropLabel);
}
function updateDropLabel(){
  const input = document.getElementById("sProof");
  const drop = document.getElementById("fileDrop");
  if(input.files.length){
    drop.classList.add("has-file");
    drop.querySelector(".file-drop-content").innerHTML =
      `<div style="font-size:2rem">✓</div><p><strong>${input.files[0].name}</strong></p><small>Click to change</small>`;
  }
}

/* ---------- SUBMIT PAYMENT ---------- */
function submitPayment(e){
  e.preventDefault();
  const file = document.getElementById("sProof").files[0];
  if(!file){ toast("Please upload proof of payment","error"); return; }
  const reader = new FileReader();
  reader.onload = ev=>{
    const tx = DB.get("vu_transactions");
    const newTx = {
      id:`t${Date.now()}`, villageId:currentUser.villageId, memberId:currentUser.id,
      memberName:currentUser.name, type:document.getElementById("sType").value,
      amount:parseFloat(document.getElementById("sAmount").value),
      ref:document.getElementById("sRef").value,
      notes:document.getElementById("sNotes").value,
      proofImage:ev.target.result, status:"pending",
      submittedAt:new Date().toISOString(),
      verifiedBy:null,verifiedAt:null,editedBy:null,editedAt:null
    };
    tx.push(newTx);
    DB.set("vu_transactions", tx);
    logAudit("SUBMIT", `Submitted ${newTx.type} ₦${newTx.amount} (${newTx.ref})`);
    toast("Payment submitted! Admin will verify shortly.","success");
    document.getElementById("submitForm").reset();
    // Reset file drop
    const drop = document.getElementById("fileDrop");
    drop.classList.remove("has-file");
    drop.querySelector(".file-drop-content").innerHTML =
      `<div style="font-size:2rem">📎</div><p><strong>Click to upload</strong> or drag & drop</p><small>PNG, JPG, PDF up to 5MB</small>`;
    renderMemberOverview();
  };
  reader.readAsDataURL(file);
}

/* ---------- ADMIN DASHBOARD ---------- */
function initAdminDash(){
  showView("adminDash");
  const villages = DB.get("vu_villages");
  const vName = villages.find(v=>v.id===currentUser.villageId).name;
  document.getElementById("aVillageName").textContent = vName;
  document.getElementById("aWelcome").textContent = `${vName} Admin`;
  renderAdminOverview();
  bindTabSwitching("adminDash");
}

function renderAdminOverview(){
  const tx = DB.get("vu_transactions").filter(t=>t.villageId===currentUser.villageId);
  const verified = tx.filter(t=>t.status==="verified");
  const pending = tx.filter(t=>t.status==="pending").length;
  const total = verified.reduce((s,t)=>s+Number(t.amount),0);
  const members = DB.get("vu_users").filter(u=>u.villageId===currentUser.villageId && u.role==="member").length;

  document.getElementById("pendingBadge").textContent = pending;

  document.getElementById("aStats").innerHTML = `
    <div class="stat"><div class="label">Total Collected</div><div class="value" data-count="${total}">₦ 0</div><div class="sub">${verified.length} verified</div></div>
    <div class="stat"><div class="label">Pending</div><div class="value" data-count="${pending}">0</div><div class="sub">Requires action</div></div>
    <div class="stat"><div class="label">Members</div><div class="value" data-count="${members}">0</div><div class="sub">Active accounts</div></div>
    <div class="stat"><div class="label">This Month</div><div class="value" data-count="${monthTotal(tx)}">₦ 0</div></div>
  `;
  animateCounters();

  // Charts
  renderAdminCharts(tx);

  // Levy summary
  const summary = LEVY_TYPES.map(type=>{
    const t = tx.filter(x=>x.type===type);
    const v = t.filter(x=>x.status==="verified");
    const p = t.filter(x=>x.status==="pending");
    return {type, total:v.reduce((s,x)=>s+Number(x.amount),0), pending:p.length, count:v.length};
  });
  document.querySelector("#aLevySummary tbody").innerHTML = summary.map(s=>`
    <tr><td>${s.type}</td><td>₦ ${s.total.toLocaleString()}</td><td>${s.pending}</td><td>${s.count}</td></tr>`).join("");

  renderPending();
  aPage=1; renderAllTx();
  renderMembers();
  renderAudit();
}

function renderAdminCharts(tx){
  const byType = {};
  LEVY_TYPES.forEach(t=>byType[t]=0);
  tx.filter(t=>t.status==="verified").forEach(t=>byType[t.type]+=Number(t.amount));

  const isDark = document.documentElement.getAttribute("data-theme")==="dark";
  const textColor = isDark?"#e2e8f0":"#0f172a";

  const barCtx = document.getElementById("aChartBar");
  if(window._aBar) window._aBar.destroy();
  window._aBar = new Chart(barCtx,{
    type:"bar",
    data:{labels:LEVY_TYPES.map(l=>l.replace(" Levy","")),
      datasets:[{label:"Collected (₦)",data:Object.values(byType),
        backgroundColor:["#0f766e","#0891b2","#f59e0b","#dc2626","#7c3aed"],borderRadius:8}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{x:{ticks:{color:textColor},grid:{display:false}},
              y:{ticks:{color:textColor},grid:{color:isDark?"#1e293b":"#e2e8f0"}}}}
  });

  const statusCounts = {verified:0,pending:0,rejected:0};
  tx.forEach(t=>statusCounts[t.status]++);
  const pieCtx = document.getElementById("aChartPie");
  if(window._aPie) window._aPie.destroy();
  window._aPie = new Chart(pieCtx,{
    type:"doughnut",
    data:{labels:["Verified","Pending","Rejected"],
      datasets:[{data:Object.values(statusCounts),
        backgroundColor:["#16a34a","#f59e0b","#dc2626"],borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:"bottom",labels:{color:textColor,padding:12}}}}
  });
}

function renderPending(){
  const tx = DB.get("vu_transactions")
    .filter(t=>t.villageId===currentUser.villageId && t.status==="pending")
    .sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));
  document.querySelector("#aPendingTable tbody").innerHTML = tx.map(t=>`
    <tr>
      <td>${fmtDate(t.submittedAt)}</td>
      <td>${t.memberName}</td>
      <td>${t.type}</td>
      <td>₦ ${Number(t.amount).toLocaleString()}</td>
      <td>${t.ref}</td>
      <td>${t.proofImage?`<a href="${t.proofImage}" target="_blank" class="btn btn-ghost" style="padding:.3rem .7rem;font-size:.8rem">View</a>`:"—"}</td>
      <td><button class="btn btn-primary" style="padding:.4rem .85rem;font-size:.8rem" onclick="openVerify('${t.id}')">Review</button></td>
    </tr>`).join("") || `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2rem">🎉 No pending verifications</td></tr>`;
}

let aPage = 1;
function renderAllTx(){
  const type = document.getElementById("fType").value;
  const status = document.getElementById("fStatus").value;
  const member = document.getElementById("fMember").value.toLowerCase();
  let tx = DB.get("vu_transactions").filter(t=>t.villageId===currentUser.villageId);
  if(type) tx = tx.filter(t=>t.type===type);
  if(status) tx = tx.filter(t=>t.status===status);
  if(member) tx = tx.filter(t=>t.memberName.toLowerCase().includes(member));
  tx.sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));

  const totalPages = Math.max(1, Math.ceil(tx.length/PAGE_SIZE));
  if(aPage>totalPages) aPage=1;
  const page = tx.slice((aPage-1)*PAGE_SIZE, aPage*PAGE_SIZE);

  document.querySelector("#aAllTable tbody").innerHTML = page.map(t=>`
    <tr>
      <td>${fmtDate(t.submittedAt)}</td>
      <td>${t.memberName}</td>
      <td>${t.type}</td>
      <td>₦ ${Number(t.amount).toLocaleString()}</td>
      <td><span class="status ${t.status}">${t.status}</span></td>
      <td>${t.verifiedBy||"—"}${t.verifiedAt?`<br><small style="color:var(--muted)">${fmtDate(t.verifiedAt)}</small>`:""}</td>
      <td>${t.editedBy||"—"}${t.editedAt?`<br><small style="color:var(--muted)">${fmtDate(t.editedAt)}</small>`:""}</td>
      <td><button class="btn btn-ghost" style="padding:.4rem .85rem;font-size:.8rem" onclick="openEdit('${t.id}')">Edit</button></td>
    </tr>`).join("") || `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:2rem">No transactions</td></tr>`;

  renderPagination("aPagination", totalPages, p=>{aPage=p;renderAllTx();});
}

function renderMembers(){
  const users = DB.get("vu_users").filter(u=>u.villageId===currentUser.villageId && u.role==="member");
  const tx = DB.get("vu_transactions").filter(t=>t.villageId===currentUser.villageId && t.status==="verified");
  document.querySelector("#aMembersTable tbody").innerHTML = users.map(u=>{
    const total = tx.filter(t=>t.memberId===u.id).reduce((s,t)=>s+Number(t.amount),0);
    return `<tr><td><strong>${u.name}</strong></td><td>${u.username}</td><td>₦ ${total.toLocaleString()}</td>
      <td><button class="btn btn-ghost" style="padding:.4rem .85rem;font-size:.8rem" onclick="toast('Member: ${u.name}\\nUsername: ${u.username}')">View</button></td></tr>`;
  }).join("");
}

function renderAudit(){
  const log = DB.get("vu_audit").filter(a=>a.villageId===currentUser.villageId)
    .sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  document.querySelector("#aAuditTable tbody").innerHTML = log.map(a=>`
    <tr><td>${fmtDateTime(a.timestamp)}</td><td><strong>${a.userName}</strong></td>
    <td><span class="status verified">${a.action}</span></td><td>${a.details}</td></tr>`).join("")
    || `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:2rem">No audit entries yet</td></tr>`;
}

/* ---------- FILTER LISTENERS ---------- */
["fType","fStatus","fMember"].forEach(id=>{
  document.addEventListener("input",e=>{ if(e.target.id===id){ aPage=1; renderAllTx(); } });
  document.addEventListener("change",e=>{ if(e.target.id===id){ aPage=1; renderAllTx(); } });
});

/* ---------- VERIFY / REJECT ---------- */
let pendingTxId = null;
function openVerify(id){
  const tx = DB.get("vu_transactions").find(t=>t.id===id);
  pendingTxId = id;
  document.getElementById("vmDetails").innerHTML = `
    <p><strong>Member:</strong> ${tx.memberName}</p>
    <p><strong>Type:</strong> ${tx.type}</p>
    <p><strong>Amount:</strong> ₦ ${Number(tx.amount).toLocaleString()}</p>
    <p><strong>Reference:</strong> ${tx.ref}</p>
    <p><strong>Submitted:</strong> ${fmtDateTime(tx.submittedAt)}</p>
    ${tx.proofImage?`<img src="${tx.proofImage}" class="proof-preview"/>`:""}
    ${tx.notes?`<p><strong>Notes:</strong> ${tx.notes}</p>`:""}
  `;
  document.getElementById("vmNotes").value = "";
  document.getElementById("verifyModal").classList.add("active");
}

function verifyPayment(){
  const tx = DB.get("vu_transactions");
  const t = tx.find(x=>x.id===pendingTxId);
  t.status = "verified";
  t.verifiedBy = currentUser.name;
  t.verifiedAt = new Date().toISOString();
  const notes = document.getElementById("vmNotes").value;
  if(notes) t.notes = (t.notes? t.notes+" | ":"") + notes;
  DB.set("vu_transactions", tx);
  logAudit("VERIFY", `Verified ${t.type} ₦${t.amount} for ${t.memberName}`);
  closeModal("verifyModal");
  toast("Payment verified successfully","success");
  renderAdminOverview();
}

async function rejectPayment(){
  const ok = await confirmDialog("Reject Payment","Are you sure you want to reject this payment? The member will be notified.");
  if(!ok) return;
  const tx = DB.get("vu_transactions");
  const t = tx.find(x=>x.id===pendingTxId);
  t.status = "rejected";
  t.verifiedBy = currentUser.name;
  t.verifiedAt = new Date().toISOString();
  t.notes = (t.notes? t.notes+" | ":"") + "REJECTED: " + document.getElementById("vmNotes").value;
  DB.set("vu_transactions", tx);
  logAudit("REJECT", `Rejected ${t.type} ₦${t.amount} for ${t.memberName}`);
  closeModal("verifyModal");
  toast("Payment rejected","warning");
  renderAdminOverview();
}

/* ---------- EDIT ---------- */
function openEdit(id){
  const t = DB.get("vu_transactions").find(x=>x.id===id);
  document.getElementById("emId").value = id;
  document.getElementById("emAmount").value = t.amount;
  document.getElementById("emNotes").value = t.notes||"";
  document.getElementById("editModal").classList.add("active");
}

function saveEdit(){
  const id = document.getElementById("emId").value;
  const tx = DB.get("vu_transactions");
  const t = tx.find(x=>x.id===id);
  const oldAmount = t.amount;
  t.amount = parseFloat(document.getElementById("emAmount").value);
  t.notes = document.getElementById("emNotes").value;
  t.editedBy = currentUser.name;
  t.editedAt = new Date().toISOString();
  DB.set("vu_transactions", tx);
  logAudit("EDIT", `Edited: ₦${oldAmount} → ₦${t.amount} for ${t.memberName}`);
  closeModal("editModal");
  toast("Transaction updated","success");
  renderAdminOverview();
}

/* ---------- ADD MEMBER ---------- */
function openMemberModal(){ document.getElementById("memberModal").classList.add("active"); }
function addMember(){
  const name = document.getElementById("mmName").value.trim();
  const user = document.getElementById("mmUser").value.trim();
  const pass = document.getElementById("mmPass").value;
  if(!name||!user||!pass){ toast("Please fill all fields","error"); return; }
  const users = DB.get("vu_users");
  if(users.find(u=>u.villageId===currentUser.villageId && u.username===user)){
    toast("Username already exists in this village","error"); return;
  }
  users.push({id:`u_${Date.now()}`,villageId:currentUser.villageId,role:"member",
    username:user,password:pass,name});
  DB.set("vu_users", users);
  logAudit("ADD_MEMBER", `Added member ${name} (${user})`);
  closeModal("memberModal");
  ["mmName","mmUser","mmPass"].forEach(id=>document.getElementById(id).value="");
  toast("Member added successfully","success");
  renderAdminOverview();
}

/* ---------- AUDIT ---------- */
function logAudit(action, details){
  const log = DB.get("vu_audit");
  log.push({id:`a${Date.now()}`,villageId:currentUser.villageId,
    userId:currentUser.id,userName:currentUser.name,action,details,timestamp:new Date().toISOString()});
  DB.set("vu_audit", log);
}

/* ---------- PDF REPORTS ---------- */
function downloadReport(kind){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const villages = DB.get("vu_villages");
  const vName = villages.find(v=>v.id===currentUser.villageId).name;
  const now = new Date();
  const monthName = now.toLocaleString('default',{month:'long'});
  const year = now.getFullYear();

  let tx, title, subtitle;
  if(kind==="village-month"){
    tx = DB.get("vu_transactions").filter(t=>t.villageId===currentUser.villageId && t.status==="verified"
      && new Date(t.submittedAt).getMonth()===now.getMonth() && new Date(t.submittedAt).getFullYear()===now.getFullYear());
    title = `${vName} Village Union — Monthly Report`;
    subtitle = `${monthName} ${year}`;
  } else if(kind==="village-year"){
    tx = DB.get("vu_transactions").filter(t=>t.villageId===currentUser.villageId && t.status==="verified"
      && new Date(t.submittedAt).getFullYear()===now.getFullYear());
    title = `${vName} Village Union — Annual Report`;
    subtitle = `Year ${year}`;
  } else if(kind==="member-month"){
    tx = DB.get("vu_transactions").filter(t=>t.memberId===currentUser.id && t.status==="verified"
      && new Date(t.submittedAt).getMonth()===now.getMonth() && new Date(t.submittedAt).getFullYear()===now.getFullYear());
    title = `Personal Report — ${currentUser.name}`;
    subtitle = `${monthName} ${year}`;
  } else {
    tx = DB.get("vu_transactions").filter(t=>t.memberId===currentUser.id && t.status==="verified"
      && new Date(t.submittedAt).getFullYear()===now.getFullYear());
    title = `Personal Report — ${currentUser.name}`;
    subtitle = `Year ${year}`;
  }

  // Header
  doc.setFillColor(15,118,110); doc.rect(0,0,210,35,"F");
  doc.setTextColor(255); doc.setFontSize(18); doc.text(title, 14, 18);
  doc.setFontSize(11); doc.text(subtitle, 14, 28);
  doc.setTextColor(100); doc.setFontSize(9);
  doc.text(`Generated: ${fmtDateTime(now.toISOString())}`, 14, 45);

  // Summary
  const summary = LEVY_TYPES.map(type=>{
    const items = tx.filter(t=>t.type===type);
    return [type, items.length, `₦ ${items.reduce((s,t)=>s+Number(t.amount),0).toLocaleString()}`];
  });
  summary.push(["TOTAL", tx.length, `₦ ${tx.reduce((s,t)=>s+Number(t.amount),0).toLocaleString()}`]);

  doc.autoTable({startY:52,head:[["Levy Type","Transactions","Amount"]],body:summary,
    theme:"striped",headStyles:{fillColor:[15,118,110]},styles:{fontSize:9}});

  doc.setTextColor(15); doc.setFontSize(12);
  doc.text("Detailed Transactions", 14, doc.lastAutoTable.finalY + 12);
  doc.autoTable({startY:doc.lastAutoTable.finalY + 16,
    head:[["Date","Member","Type","Amount","Reference"]],
    body: tx.map(t=>[fmtDate(t.submittedAt),t.memberName,t.type,`₦ ${Number(t.amount).toLocaleString()}`,t.ref]),
    theme:"grid",headStyles:{fillColor:[15,118,110]},styles:{fontSize:8}});

  doc.save(`${kind}-${vName.replace(/\s/g,"_")}-${year}-${now.getMonth()+1}.pdf`);
  toast("Report downloaded","success");
}

/* ---------- UTILITIES ---------- */
function fmtDate(iso){ return new Date(iso).toLocaleDateString(); }
function fmtDateTime(iso){ return new Date(iso).toLocaleString(); }
function monthTotal(tx){
  const now = new Date();
  return tx.filter(t=>{const d=new Date(t.submittedAt);
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&t.status==="verified";
  }).reduce((s,t)=>s+Number(t.amount),0);
}

function animateCounters(){
  document.querySelectorAll("[data-count]").forEach(el=>{
    const target = parseFloat(el.dataset.count);
    const isMoney = el.textContent.includes("₦") || target > 1000;
    let cur = 0;
    const step = target / 40;
    const timer = setInterval(()=>{
      cur += step;
      if(cur >= target){ cur = target; clearInterval(timer); }
      el.textContent = isMoney ? `₦ ${Math.round(cur).toLocaleString()}` : Math.round(cur).toLocaleString();
    }, 25);
  });
}

function closeModal(id){ document.getElementById(id).classList.remove("active"); }

function bindTabSwitching(dashId){
  const dash = document.getElementById(dashId);
  dash.querySelectorAll(".side-nav a").forEach(a=>{
    a.addEventListener("click",()=>{
      dash.querySelectorAll(".side-nav a").forEach(x=>x.classList.remove("active"));
      a.classList.add("active");
      dash.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      dash.querySelector("#"+a.dataset.tab).classList.add("active");
      // Close mobile sidebar
      const sb = dash.querySelector(".sidebar");
      if(sb) sb.classList.remove("open");
    });
  });
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  seedData();
  initTheme();
  renderVillages();
  restoreSession();
  initReveal();

  // Hamburger for landing
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");
  if(hamburger && navLinks){
    hamburger.addEventListener("click",()=>navLinks.classList.toggle("open"));
  }

  // Theme toggle on landing
  const themeBtn = document.getElementById("themeToggle");
  if(themeBtn) themeBtn.addEventListener("click", toggleTheme);

  // Close modals on backdrop
  document.querySelectorAll(".modal").forEach(m=>{
    m.addEventListener("click",e=>{ if(e.target===m) m.classList.remove("active"); });
  });
});
