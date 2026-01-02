// *** ลิงก์เชื่อมต่อฐานข้อมูลของคุณ ***
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLFaXwU6hQ2y95K2Hp_n4r9qAhI0yPQd1BPnRUjGvH-7OrLmvwyig8KeArr5rGtEh--Q/exec';

const diseaseData = { "Non-Cancer": { "Neurological": ["Ischemic Stroke", "Hemorrhagic Stroke", "Parkinson", "Alzheimer", "Epilepsy"], "Kidney": ["Stage 3", "Stage 4", "ESRD on CAPD", "ESRD on HD"], "Lung/Heart": ["COPD", "Asthma", "CHF", "IHD"], "Infection": ["HIV", "TB"], "Other": ["DM", "HT", "DLP"] }, "Cancer": { "Sites": ["Brain", "Lung", "Breast", "Colon", "Liver"], "Metastasis": ["None", "Brain", "Lung", "Bone", "Liver"] } };
const medList = ["Morphine inj", "Fentanyl inj", "Midazolam", "MST(10)", "MST(30)", "Morphine syr", "Fentanyl patch", "Senna", "Lactulose", "Gabapentin", "Paracetamol", "Tramadol"];
const acpTopics = ["ET tube", "CPR", "Inotrope", "Hemodialysis", "NG tube", "Morphine", "Place of death"];
const esasTopics = ["Pain", "Fatigue", "Nausea", "Depression", "Anxiety", "Drowsiness", "Appetite", "Well-being", "Shortness of breath"];

let allPatients = [];
let currentPhones = [];
let currentDiseases = [];
let currentMeds = [];

document.addEventListener('DOMContentLoaded', () => {
  renderPPS(); renderESAS(); renderACP(); renderMedOptions(); renderDiseaseGroups(); addPhoneField();

  // ดึงข้อมูลจาก Google Sheet ผ่าน API
  fetch(SCRIPT_URL + '?op=getAll')
    .then(res => res.json())
    .then(data => {
      allPatients = data;
      renderActivePatients();
      renderSummary();
    })
    .catch(err => console.error('Error loading data:', err));
});

// --- ส่วนการบันทึกข้อมูล ---
function handleFormSubmit(e) {
  e.preventDefault();
  // (Collecting data logic - ย่อเพื่อความกระชับ แต่ใช้ Logic เดิมได้เลย)
  const phones = []; document.querySelectorAll('.phone-input').forEach(el => { if(el.value) phones.push({number: el.value, label: el.nextElementSibling.value}); });
  const esas = {}; document.querySelectorAll('.esas-range').forEach(el => esas[el.dataset.topic] = el.value);
  const acp = {}; acpTopics.forEach(t => { const c = document.querySelector(`input[name="acp_${t}"]:checked`); acp[t] = c ? c.value : 'Undecided'; });

  const formData = {
    hn: document.getElementById('hn').value,
    name: document.getElementById('fullname').value,
    gender: document.getElementById('gender').value,
    admitType: document.getElementById('admitType').value,
    phones: phones,
    address: { house: document.getElementById('addr_house').value, moo: document.getElementById('addr_moo').value, sub: document.getElementById('addr_tumbon').value, dist: document.getElementById('addr_amphoe').value, prov: document.getElementById('addr_province').value, lat: document.getElementById('lat').value, long: document.getElementById('long').value },
    diseases: currentDiseases,
    meds: currentMeds,
    exam: { pps: document.getElementById('pps_score').value, gcs: document.getElementById('gcs_score').value, vitals: { bp: document.getElementById('vs_bp').value, pr: document.getElementById('vs_pr').value, bt: document.getElementById('vs_bt').value }, esas: esas },
    plan: document.getElementById('nursing_plan').value,
    acp: acp,
    nextVisitDate: document.getElementById('next_visit_date').value,
    nextVisitType: document.getElementById('next_visit_type').value,
    lab: { cr: document.getElementById('lab_cr').value, egfr: document.getElementById('lab_egfr').value },
    status: document.querySelector('input[name="pt_status"]:checked').value,
    dischargeDate: document.getElementById('discharge_date').value
  };

  Swal.fire({title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading()});

  // ส่งข้อมูลไป Google Sheet
  fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(formData)
  })
  .then(res => res.json())
  .then(res => {
    if(res.success) {
      Swal.fire('สำเร็จ', 'บันทึกข้อมูลลง Google Sheet แล้ว', 'success');
      document.getElementById('mainForm').reset();
      currentMeds = []; currentDiseases = []; renderMedsList(); renderDiseaseBadges();
      // Refresh Data
      fetch(SCRIPT_URL + '?op=getAll').then(r => r.json()).then(d => { allPatients = d; renderActivePatients(); renderSummary(); });
    } else {
      Swal.fire('Error', res.message, 'error');
    }
  })
  .catch(err => Swal.fire('Error', 'การเชื่อมต่อขัดข้อง', 'error'));
}

// --- Helper Functions (เหมือนเดิม) ---
function showPage(pageId) { document.querySelectorAll('.page-section').forEach(el => el.classList.add('d-none')); document.getElementById('page-' + pageId).classList.remove('d-none'); document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active')); if(pageId==='appoint') initAppointmentSlider(); }
function addPhoneField(val='', label='') { const d=document.createElement('div'); d.className='input-group mb-2'; d.innerHTML=`<input type="tel" class="form-control phone-input" placeholder="เบอร์โทร" value="${val}"><input type="text" class="form-control" placeholder="ญาติ" value="${label}"><button class="btn btn-outline-danger" onclick="this.parentElement.remove()">ลบ</button>`; document.getElementById('phoneContainer').appendChild(d); }
function renderPPS() { const s=document.getElementById('pps_score'); for(let i=0;i<=100;i+=10) s.add(new Option(i+'%',i)); }
function renderESAS() { const c=document.getElementById('esasContainer'); esasTopics.forEach((t,i)=> c.innerHTML+=`<div class="mb-3"><label class="d-flex justify-content-between"><span>${t}</span><span id="ve_${i}" class="fw-bold text-primary">0</span></label><input type="range" class="form-range esas-range" min="0" max="10" value="0" oninput="document.getElementById('ve_${i}').innerText=this.value" data-topic="${t}"></div>`); }
function renderACP() { const b=document.getElementById('acpTableBody'); acpTopics.forEach(t=> b.innerHTML+=`<tr><td>${t}</td><td class="text-center"><input type="radio" name="acp_${t}" value="Want"></td><td class="text-center"><input type="radio" name="acp_${t}" value="DontWant"></td><td class="text-center"><input type="radio" name="acp_${t}" value="Undecided" checked></td></tr>`); }
function renderDiseaseGroups() { const s=document.getElementById('disease_group'); Object.keys(diseaseData).forEach(k=>s.add(new Option(k,k))); }
function updateDiseaseSub() { const g=document.getElementById('disease_group').value, s=document.getElementById('disease_sub'); s.innerHTML='<option>--เลือก--</option>'; if(g==='Non-Cancer') Object.keys(diseaseData[g]).forEach(k=>s.add(new Option(k,k))); else if(g==='Cancer') { s.add(new Option('Site','Sites')); s.add(new Option('Meta','Metastasis')); } }
function updateDiseaseSpecific() {}
function addDisease() { const g=document.getElementById('disease_group').value, s=document.getElementById('disease_sub').value, d=document.getElementById('disease_specific').value; if(g) { currentDiseases.push({group:g, sub:s, detail:d}); renderDiseaseBadges(); } }
function renderDiseaseBadges() { document.getElementById('diseaseList').innerHTML = currentDiseases.map((d,i)=>`<span class="badge bg-secondary rounded-pill p-2 m-1">${d.group}-${d.sub} <i class="fas fa-times" onclick="currentDiseases.splice(${i},1);renderDiseaseBadges()"></i></span>`).join(''); }
function renderMedOptions() { const s=document.getElementById('med_name'); medList.forEach(m=>s.add(new Option(m,m))); }
function addMed() { currentMeds.push({name:document.getElementById('med_name').value, dose:document.getElementById('med_dose').value}); renderMedsList(); }
function renderMedsList() { document.getElementById('medList').innerHTML = currentMeds.map((m,i)=>`<li class="list-group-item d-flex justify-content-between">${m.name} (${m.dose}) <button class="btn btn-sm btn-danger" onclick="currentMeds.splice(${i},1);renderMedsList()">x</button></li>`).join(''); }
function getLocation() { if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p=>{ document.getElementById('lat').value=p.coords.latitude; document.getElementById('long').value=p.coords.longitude; window.open(`http://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`); }); }
function renderActivePatients() { const term=document.getElementById('searchActive').value.toLowerCase(); document.getElementById('activePatientList').innerHTML = allPatients.filter(p=>p.status==='Alive'&&(p.name.includes(term)||p.hn.includes(term))).map(p=>`<div class="col-md-4"><div class="card patient-card p-3 shadow-sm" onclick="editPatient('${p.hn}')"><span class="badge bg-success status-badge">${p.type_admit}</span><h5>${p.name}</h5><small>HN: ${p.hn}</small></div></div>`).join(''); }
function editPatient(hn) { Swal.fire('Info', 'Edit HN: '+hn, 'info'); }
function initAppointmentSlider() { const c=document.getElementById('dateSlider'); c.innerHTML=''; const t=new Date(); const th=['อา','จ','อ','พ','พฤ','ศ','ส']; for(let i=0;i<14;i++){ const d=new Date(t); d.setDate(t.getDate()+i); c.innerHTML+=`<div class="date-card ${i===0?'active':''}" onclick="document.querySelectorAll('.date-card').forEach(e=>e.classList.remove('active'));this.classList.add('active');renderApptList(new Date('${d.toISOString()}'))"><div class="date-day">${th[d.getDay()]}</div><div class="date-num">${d.getDate()}</div></div>`; } renderApptList(t); }
function renderApptList(d) { const ds=d.toISOString().split('T')[0]; const l=document.getElementById('appointList'); const p=allPatients.filter(x=>x.next_visit_date&&x.next_visit_date.includes(ds)); l.innerHTML = p.length? p.map(x=>`<div class="col-md-6"><div class="card p-3 border-warning border-start border-3"><h5>${x.name}</h5>Type: ${x.visit_type}</div></div>`).join('') : '<div class="text-center text-muted col-12 py-5">ไม่มีนัดหมาย</div>'; }
function renderSummary() { const total=allPatients.length, alive=allPatients.filter(p=>p.status==='Alive').length; document.getElementById('summaryContainer').innerHTML=`<div class="col-6 col-md-3"><div class="card p-3 bg-primary text-white"><h3>${total}</h3><small>Total</small></div></div><div class="col-6 col-md-3"><div class="card p-3 bg-success text-white"><h3>${alive}</h3><small>Active</small></div></div>`; }
