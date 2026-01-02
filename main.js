// *** URL Web App ของคุณ ***
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMhp7MKTutWhTto_XOUcl9qp7MbYmeoMMd5naMngQOXx0t3IiyPSRQxIPV2d7MolxeAQ/exec';

// --- Data Lists ---
const diseaseData = { "Non-Cancer": { "Neurological": ["Ischemic Stroke","Hemorrhagic Stroke","Parkinson","Alzheimer","Epilepsy"], "Kidney": ["Stage 3","Stage 4","ESRD on CAPD","ESRD on HD","ESRD no RRT"], "Lung/Heart": ["COPD","Asthma","CHF","IHD"], "Infection": ["HIV","TB","Septicemia"], "Other": ["DM","HT","DLP","Cirrhosis"] }, "Cancer": { "Sites": ["Brain","Lung","Breast","Colon","Liver","Prostate","Lymphoma","Leukemia"], "Metastasis": ["None","Brain","Lung","Bone","Liver"] } };
const medList = ["Morphine inj (10 mg/5 mL)", "Fentanyl inj (50 mcg/mL)", "Midazolam (5 mg/mL)", "MST(10 mg)", "MST(30 mg)", "Morphine syr (10 mg/5 mL)", "Fentanyl patch (12 mcg/hr)", "Senna (มะขามแขก)", "Lactulose", "Gabapentin (300 mg)", "Paracetamol (500 mg)", "Tramadol (50 mg)", "Haloperidol", "Domperidone", "Metoclopramide", "Diazepam", "Baclofen"];
const acpTopics = ["ET tube", "CPR", "Inotrope", "Hemodialysis", "NG tube", "Morphine", "Place of death"];
const esasTopics = ["Pain (ปวด)", "Fatigue (เหนื่อย)", "Nausea (คลื่นไส้)", "Depression (ซึมเศร้า)", "Anxiety (วิตกกังวล)", "Drowsiness (ง่วงซึม)", "Appetite (เบื่ออาหาร)", "Well-being (สบายกายใจ)", "Shortness of breath (เหนื่อยหอบ)"];

let allPatients = [], currentPhones = [], currentDiseases = [], currentMeds = [];

document.addEventListener('DOMContentLoaded', () => {
  renderPPS(); renderESAS(); renderACP(); renderMedOptions(); renderDiseaseGroups(); 
  addPhoneField(); 
  loadData();
  showPage('menu');
});

function loadData() {
  fetch(SCRIPT_URL + '?op=getAll').then(r=>r.json()).then(d=>{ allPatients=d; renderActivePatients(); renderSummary(); }).catch(e=>console.error(e));
}

// --- Mode Switcher (New vs Edit) ---
function openNewRegistration() {
  resetForm(); // ล้างข้อมูลก่อน
  document.getElementById('formTitle').innerHTML = '<i class="fas fa-user-plus"></i> ลงทะเบียนรายใหม่';
  document.getElementById('formTitle').className = 'text-success mb-0 fw-bold'; // สีเขียว
  document.getElementById('formHeader').classList.replace('bg-warning-subtle', 'bg-light'); // พื้นหลังปกติ
  
  // ซ่อนปุ่ม Edit Mode
  document.getElementById('btnViewHistory').classList.add('d-none');
  document.getElementById('linkMap').classList.add('d-none');
  
  // เปิด HN ให้แก้ได้
  document.getElementById('hn').readOnly = false;
  
  showPage('register');
}

function openEditRegistration(hn) {
  const p = allPatients.find(x => String(x.hn) === String(hn));
  if(!p) return;

  resetForm(); // ล้างของเก่าก่อนเติมของใหม่
  
  // ปรับ Header เป็นโหมดแก้ไข
  document.getElementById('formTitle').innerHTML = `<i class="fas fa-edit"></i> แก้ไขข้อมูล: ${p.name}`;
  document.getElementById('formTitle').className = 'text-warning-emphasis mb-0 fw-bold'; // สีส้มเข้ม
  
  // เปิดปุ่มพิเศษ
  document.getElementById('btnViewHistory').classList.remove('d-none');
  const linkMap = document.getElementById('linkMap');
  if(p.address && p.address.lat && p.address.long) {
     linkMap.classList.remove('d-none');
     linkMap.onclick = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.address.lat},${p.address.long}`, '_blank');
     updateMapBtnStatus(true);
  }
  
  // เติมข้อมูล
  document.getElementById('hn').value = p.hn;
  document.getElementById('hn').readOnly = true; // ล็อก HN ห้ามแก้
  document.getElementById('fullname').value = p.name;
  document.getElementById('gender').value = p.gender;
  document.getElementById('admitType').value = p.type_admit;
  
  if(p.address) {
     ['house','moo','tumbon','amphoe','province','lat','long'].forEach(k=>{
        const key = (k==='tumbon')?'sub':(k==='amphoe')?'dist':(k==='province')?'prov':k;
        if(document.getElementById('addr_'+k)) document.getElementById('addr_'+k).value = p.address[key]||'';
        else document.getElementById(k).value = p.address[key]||'';
     });
  }

  document.getElementById('phoneContainer').innerHTML=''; 
  (p.phones||[]).forEach(ph=>addPhoneField(ph.number, ph.label)); if(!(p.phones||[]).length) addPhoneField();
  
  currentDiseases = p.diseases||[]; renderDiseaseBadges();
  currentMeds = p.meds||[]; renderMedsList();
  
  if(p.acp) Object.keys(p.acp).forEach(k=>{ const r=document.getElementsByName('acp_'+k); r.forEach(el=>{ if(el.value===p.acp[k]) el.checked=true; }); });
  document.getElementsByName('pt_status').forEach(el=>{ if(el.value===p.status) el.checked=true; });
  
  document.getElementById('next_visit_date').value = p.next_visit_date ? p.next_visit_date.substring(0,10) : '';
  document.getElementById('next_visit_type').value = p.visit_type || 'OPD';
  document.getElementById('discharge_date').value = p.discharge_date ? p.discharge_date.substring(0,10) : '';

  showPage('register');
  
  Swal.fire({
    title: 'โหมดแก้ไข',
    text: `กำลังแก้ไขข้อมูลของ ${p.name}`,
    icon: 'info',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
  });
}

function resetForm() {
  document.getElementById('mainForm').reset();
  currentMeds=[]; currentDiseases=[]; renderMedsList(); renderDiseaseBadges();
  document.getElementById('phoneContainer').innerHTML=''; addPhoneField();
  updateMapBtnStatus(false);
  document.querySelectorAll('input[type=checkbox], input[type=radio]').forEach(el => el.checked = false);
  // Default Status Alive
  document.querySelector('input[name="pt_status"][value="Alive"]').checked = true;
}

// --- Form Submit ---
function handleFormSubmit(e) {
  e.preventDefault();
  const phones=[]; document.querySelectorAll('.phone-input').forEach(el=>{ if(el.value) phones.push({number:el.value, label:el.nextElementSibling.value}); });
  const esas={}; document.querySelectorAll('.esas-range').forEach(el=>esas[el.dataset.topic]=el.value);
  const acp={}; acpTopics.forEach(t=>{ const c=document.querySelector(`input[name="acp_${t}"]:checked`); acp[t]=c?c.value:'Undecided'; });

  const formData = {
    hn: document.getElementById('hn').value,
    name: document.getElementById('fullname').value,
    gender: document.getElementById('gender').value,
    admitType: document.getElementById('admitType').value,
    phones: phones,
    address: { 
      house:document.getElementById('addr_house').value, moo:document.getElementById('addr_moo').value, 
      sub:document.getElementById('addr_tumbon').value, dist:document.getElementById('addr_amphoe').value, 
      prov:document.getElementById('addr_province').value, lat:document.getElementById('lat').value, long:document.getElementById('long').value 
    },
    diseases: currentDiseases, meds: currentMeds,
    exam: { pps:document.getElementById('pps_score').value, gcs:document.getElementById('gcs_score').value, vitals:{ bp:document.getElementById('vs_bp').value, pr:document.getElementById('vs_pr').value, bt:document.getElementById('vs_bt').value }, esas:esas },
    plan: document.getElementById('nursing_plan').value, acp: acp,
    nextVisitDate: document.getElementById('next_visit_date').value, nextVisitType: document.getElementById('next_visit_type').value,
    lab: { cr:document.getElementById('lab_cr').value, egfr:document.getElementById('lab_egfr').value },
    status: document.querySelector('input[name="pt_status"]:checked').value, dischargeDate: document.getElementById('discharge_date').value
  };

  Swal.fire({title:'กำลังบันทึก...', didOpen:()=>Swal.showLoading()});
  fetch(SCRIPT_URL, { method:'POST', body:JSON.stringify(formData) }).then(r=>r.json()).then(res=>{
     if(res.success){ 
       Swal.fire({title:'บันทึกสำเร็จ', icon:'success', timer:1500, showConfirmButton:false});
       resetForm();
       loadData(); showPage('menu');
     } else Swal.fire('Error',res.message,'error');
  });
}

// --- Other Logic (Same as before) ---
function showPage(pid) { 
  document.querySelectorAll('.page-section').forEach(e=>e.classList.add('d-none')); document.getElementById('page-'+pid).classList.remove('d-none'); document.querySelectorAll('.nav-link').forEach(e=>e.classList.remove('active')); 
  if(pid==='appoint') initSlider(); 
  if(pid==='register') document.getElementById('nav-reg').classList.add('active');
}
// (ใช้โค้ด Helper เดิมต่อได้เลยครับ เช่น renderPPS, addPhoneField, etc... ไม่มีการเปลี่ยนแปลง)
function formatDateTH(d){if(!d)return'-';const s=d.substring(0,10).split('-');if(s.length!==3)return'-';return`${s[2]}/${s[1]}/${parseInt(s[0])+543}`;}
function getTypeClass(t){if(!t)return'';t=t.toLowerCase();if(t.includes('opd'))return'card-opd';if(t.includes('home'))return'card-home';if(t.includes('tele'))return'card-telemed';if(t.includes('ipd'))return'card-ipd';return'';}
function updateMapBtnStatus(h){const b=document.getElementById('btnGeo');if(h){b.className='btn btn-sm btn-success text-white ms-2';b.innerHTML='<i class="fas fa-check-circle"></i> ปักหมุดแล้ว';}else{b.className='btn btn-sm btn-info text-white ms-2';b.innerHTML='<i class="fas fa-map-marker-alt"></i> ปักหมุดปัจจุบัน';}}
function getLocation(){if(navigator.geolocation){Swal.fire({title:'ระบุพิกัด...',didOpen:()=>Swal.showLoading()});navigator.geolocation.getCurrentPosition(p=>{document.getElementById('lat').value=p.coords.latitude;document.getElementById('long').value=p.coords.longitude;updateMapBtnStatus(true);Swal.close();window.open(`https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`);});}}
function showHistoryModal(){const hn=document.getElementById('hn').value,name=document.getElementById('fullname').value;if(!hn)return;const modal=new bootstrap.Modal(document.getElementById('historyModal'));document.getElementById('historyPatientName').innerText=name;document.getElementById('historyLoading').classList.remove('d-none');document.getElementById('historyContent').classList.add('d-none');modal.show();const lat=document.getElementById('lat').value,long=document.getElementById('long').value,btn=document.getElementById('btnMapHistory');if(lat&&long){btn.classList.remove('d-none');btn.onclick=()=>window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${long}`,'_blank');}else btn.classList.add('d-none');fetch(SCRIPT_URL+'?op=getHistory&hn='+hn).then(r=>r.json()).then(d=>{renderHistoryItems(d);document.getElementById('historyLoading').classList.add('d-none');document.getElementById('historyContent').classList.remove('d-none');});}
function renderHistoryItems(l){const c=document.getElementById('historyContent');if(!l.length){c.innerHTML='<div class="alert alert-warning">ไม่พบประวัติ</div>';return;}c.innerHTML=l.map(h=>{const d=formatDateTH(h.date);const p=(h.pps&&h.pps>0)?h.pps+'%':'ไม่ระบุ';let lh='';if(h.lab_cr||h.lab_egfr)lh=`<div class="alert alert-light border p-2 mb-2 small"><i class="fas fa-flask text-danger"></i> <b>Lab:</b> Cr:${h.lab_cr||'-'} eGFR:${h.lab_egfr||'-'}</div>`;let mh='-';if(h.meds&&h.meds.length)mh='<ul class="mb-0 ps-3 small text-muted">'+h.meds.map(m=>`<li>${m.name}</li>`).join('')+'</ul>';let eh='';if(h.esas)Object.entries(h.esas).forEach(([k,v])=>{if(v>0)eh+=`<span class="badge bg-warning text-dark me-1 border">${k}:${v}</span>`;});let ah='';if(h.acp&&Object.keys(h.acp).length>0){ah=`<div class="mt-2 small border-top pt-2"><i class="fas fa-file-contract"></i> <b>ACP:</b> `;Object.entries(h.acp).forEach(([k,v])=>{if(v!=='Undecided')ah+=`<span class="me-2">${k}:<u>${v}</u></span>`;});ah+='</div>';}return`<div class="card mb-3 shadow-sm history-card"><div class="card-header bg-white d-flex justify-content-between"><span class="history-date">${d}</span><span class="badge bg-light text-dark border">PPS: ${p}</span></div><div class="card-body">${lh}<div class="mb-2">${eh}</div><div class="row"><div class="col-6 border-end"><p class="mb-1 small"><b>Vitals:</b> BP:${h.vitals?.bp||'-'} P:${h.vitals?.pr||'-'} T:${h.vitals?.bt||'-'}</p><p class="mb-1 small"><b>GCS:</b> ${h.gcs||'-'}</p><p class="mb-1 small"><b>Plan:</b> ${h.plan||'-'}</p>${ah}</div><div class="col-6"><p class="mb-1 small fw-bold text-success">ยา:</p>${mh}</div></div></div></div>`;}).join('');}
function addPhoneField(v='',l=''){const d=document.createElement('div');d.className='input-group mb-2';d.innerHTML=`<input type="tel" class="form-control phone-input" placeholder="เบอร์โทร" value="${v}" maxlength="10"><select class="form-select" style="max-width:130px"><option value="">ความสัมพันธ์</option><option value="คนไข้" ${l==='คนไข้'?'selected':''}>คนไข้</option><option value="พ่อ" ${l==='พ่อ'?'selected':''}>พ่อ</option><option value="แม่" ${l==='แม่'?'selected':''}>แม่</option><option value="ลูก" ${l==='ลูก'?'selected':''}>ลูก</option><option value="ผู้ดูแล" ${l==='ผู้ดูแล'?'selected':''}>ผู้ดูแล</option><option value="ญาติ" ${l==='ญาติ'?'selected':''}>ญาติ</option></select><button class="btn btn-outline-danger" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;document.getElementById('phoneContainer').appendChild(d);}
function formatLab(el,dec){if(el.value)el.value=parseFloat(el.value).toFixed(dec);}
function renderPPS(){const s=document.getElementById('pps_score');s.innerHTML='';s.add(new Option('ไม่ระบุ',''));for(let i=0;i<=100;i+=10)s.add(new Option(i+'%',i));}
function renderESAS(){const c=document.getElementById('esasContainer');esasTopics.forEach((t,i)=>c.innerHTML+=`<div class="mb-2"><label class="d-flex justify-content-between small">${t} <span id="v${i}">0</span></label><input type="range" class="form-range esas-range" min="0" max="10" value="0" oninput="document.getElementById('v${i}').innerText=this.value" data-topic="${t}"></div>`);}
function renderACP(){const b=document.getElementById('acpTableBody');acpTopics.forEach(t=>b.innerHTML+=`<tr><td>${t}</td><td class="text-center"><input type="radio" name="acp_${t}" value="Want"></td><td class="text-center"><input type="radio" name="acp_${t}" value="Dont"></td><td class="text-center"><input type="radio" name="acp_${t}" value="Undecided" checked></td></tr>`);}
function renderDiseaseGroups(){const s=document.getElementById('disease_group');s.add(new Option('--Group--',''));Object.keys(diseaseData).forEach(k=>s.add(new Option(k,k)));}
function updateDiseaseSub(){const g=document.getElementById('disease_group').value,s=document.getElementById('disease_sub');s.innerHTML='<option value="">--Sub--</option>';if(g==='Non-Cancer')Object.keys(diseaseData[g]).forEach(k=>s.add(new Option(k,k)));else if(g==='Cancer'){s.add(new Option('Site','Sites'));s.add(new Option('Meta','Metastasis'));}}
function addDisease(){const g=document.getElementById('disease_group').value,s=document.getElementById('disease_sub').value,d=document.getElementById('disease_specific').value;if(g&&s){currentDiseases.push({group:g,sub:s,detail:d});renderDiseaseBadges();document.getElementById('disease_specific').value='';}}
function renderDiseaseBadges(){document.getElementById('diseaseList').innerHTML=currentDiseases.map((d,i)=>`<span class="badge bg-secondary m-1">${d.group}>${d.sub} <i class="fas fa-times" onclick="currentDiseases.splice(${i},1);renderDiseaseBadges()"></i></span>`).join('');}
function renderMedOptions(){const s=document.getElementById('med_name');s.add(new Option('--Drug--',''));medList.forEach(m=>s.add(new Option(m,m)));}
function addMed(){const n=document.getElementById('med_name').value,d=document.getElementById('med_dose').value;if(n){currentMeds.push({name:n,dose:d});renderMedsList();document.getElementById('med_dose').value='';}}
function renderMedsList(){document.getElementById('medList').innerHTML=currentMeds.map((m,i)=>`<li class="list-group-item d-flex justify-content-between p-2 small">${m.name} (${m.dose}) <button class="btn btn-sm btn-outline-danger border-0" onclick="currentMeds.splice(${i},1);renderMedsList()"><i class="fas fa-times"></i></button></li>`).join('');}
function renderActivePatients(){const t=document.getElementById('searchActive').value.toLowerCase();const f=allPatients.filter(p=>p.status==='Alive'&&(p.name.includes(t)||p.hn.includes(t)));document.getElementById('activePatientList').innerHTML=f.length?f.map(p=>{const c=getTypeClass(p.type_admit);return`<div class="col-md-4 col-sm-6"><div class="card p-3 shadow-sm patient-card ${c}" onclick="openEditRegistration('${p.hn}')"><div class="d-flex justify-content-between"><div><h5 class="mb-1 fw-bold text-dark">${p.name}</h5><p class="mb-0 text-secondary small">HN: ${p.hn}</p></div><span class="status-badge">${p.type_admit}</span></div><hr class="my-2" style="opacity:0.1"><small class="text-muted"><i class="far fa-calendar-check"></i> นัด: ${formatDateTH(p.next_visit_date)}</small></div></div>`;}).join(''):'<div class="col-12 text-center text-muted mt-5">ไม่พบข้อมูล</div>';}
function renderApptList(s){const l=document.getElementById('appointList');const p=allPatients.filter(x=>x.next_visit_date&&x.next_visit_date.substring(0,10)===s);l.innerHTML=p.length?p.map(x=>{const c=getTypeClass(x.visit_type);return`<div class="col-md-6"><div class="card p-3 shadow-sm ${c}" onclick="openEditRegistration('${x.hn}')" style="cursor:pointer; border-left-width:8px;"><div class="d-flex justify-content-between"><h5 class="mb-1 fw-bold">${x.name}</h5><span class="badge bg-white text-dark border">${x.visit_type}</span></div><small class="text-secondary">HN: ${x.hn}</small></div></div>`;}).join(''):'<div class="col-12 text-center text-muted py-5">ไม่มีนัด</div>';}
function renderSummary(){document.getElementById('summaryContainer').innerHTML=`<div class="col-6 col-md-3"><div class="card p-3 bg-primary text-white"><h3>${allPatients.length}</h3>Total</div></div><div class="col-6 col-md-3"><div class="card p-3 bg-success text-white"><h3>${allPatients.filter(p=>p.status==='Alive').length}</h3>Active</div></div><div class="col-6 col-md-3"><div class="card p-3 bg-dark text-white"><h3>${allPatients.filter(p=>p.status!=='Alive').length}</h3>Death</div></div>`;}
function initSlider(){const c=document.getElementById('dateSlider');c.innerHTML='';const d=new Date();const th=['อา','จ','อ','พ','พฤ','ศ','ส'];for(let i=0;i<14;i++){const t=new Date(d);t.setDate(d.getDate()+i);const y=t.getFullYear(),m=String(t.getMonth()+1).padStart(2,'0'),day=String(t.getDate()).padStart(2,'0'),s=`${y}-${m}-${day}`;c.innerHTML+=`<div class="date-card ${i===0?'active':''}" onclick="document.querySelectorAll('.date-card').forEach(e=>e.classList.remove('active'));this.classList.add('active');renderApptList('${s}')"><div class="date-day">${th[t.getDay()]}</div><div class="date-num">${t.getDate()}</div></div>`;}const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');renderApptList(`${y}-${m}-${day}`);}
