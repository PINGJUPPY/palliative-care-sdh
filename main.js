// *** URL Web App ของคุณ (Update 02/01/2026) ***
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMhp7MKTutWhTto_XOUcl9qp7MbYmeoMMd5naMngQOXx0t3IiyPSRQxIPV2d7MolxeAQ/exec';

// --- Data Lists ---
const diseaseData = {
  "Non-Cancer": {
    "Neurological": ["Ischemic Stroke", "Hemorrhagic Stroke", "Parkinson", "Alzheimer", "Epilepsy"],
    "Kidney": ["Stage 3", "Stage 4", "ESRD on CAPD", "ESRD on HD", "ESRD no RRT"],
    "Lung/Heart": ["COPD", "Asthma", "CHF", "IHD"],
    "Infection": ["HIV", "TB", "Septicemia"],
    "Other": ["DM", "HT", "DLP", "Cirrhosis"]
  },
  "Cancer": {
    "Sites": ["Brain", "Lung", "Breast", "Colon", "Liver", "Prostate", "Lymphoma", "Leukemia"],
    "Metastasis": ["None", "Brain", "Lung", "Bone", "Liver"]
  }
};

const medList = [
  "Morphine inj (10 mg/5 mL)", "Fentanyl inj (50 mcg/mL)", "Midazolam (5 mg/mL)",
  "MST(10 mg)", "MST(30 mg)", "Morphine syr (10 mg/5 mL)", "Fentanyl patch (12 mcg/hr)",
  "Senna (มะขามแขก)", "Lactulose", "Gabapentin (300 mg)", "Paracetamol (500 mg)", "Tramadol (50 mg)",
  "Haloperidol", "Domperidone", "Metoclopramide", "Diazepam", "Baclofen"
];

const acpTopics = ["ET tube", "CPR", "Inotrope", "Hemodialysis", "NG tube", "Morphine", "Place of death"];
const esasTopics = ["Pain", "Fatigue", "Nausea", "Depression", "Anxiety", "Drowsiness", "Appetite", "Well-being", "Shortness of breath"];

// --- Global Variables ---
let allPatients = [];
let currentPhones = [];
let currentDiseases = [];
let currentMeds = [];

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  renderPPS(); 
  renderESAS(); 
  renderACP(); 
  renderMedOptions(); 
  renderDiseaseGroups(); 
  addPhoneField();
  loadData(); // Load Data from Google Sheet
});

// --- API Connect ---
function loadData() {
  fetch(SCRIPT_URL + '?op=getAll')
    .then(res => res.json())
    .then(data => {
      allPatients = data;
      renderActivePatients();
      renderSummary();
      console.log('Data Loaded:', allPatients.length);
    })
    .catch(err => console.error('Load Error:', err));
}

// --- Form Handle ---
function handleFormSubmit(e) {
  e.preventDefault();
  
  // 1. Collect Phones
  const phones = []; 
  document.querySelectorAll('.phone-input').forEach(el => { 
    if(el.value) phones.push({number: el.value, label: el.nextElementSibling.value}); 
  });

  // 2. Collect ESAS
  const esas = {}; 
  document.querySelectorAll('.esas-range').forEach(el => esas[el.dataset.topic] = el.value);
  
  // 3. Collect ACP
  const acp = {}; 
  acpTopics.forEach(t => { 
    const checked = document.querySelector(`input[name="acp_${t}"]:checked`); 
    acp[t] = checked ? checked.value : 'Undecided'; 
  });

  // 4. Build Object
  const formData = {
    hn: document.getElementById('hn').value,
    name: document.getElementById('fullname').value,
    gender: document.getElementById('gender').value,
    admitType: document.getElementById('admitType').value,
    phones: phones,
    address: { 
       house: document.getElementById('addr_house').value, 
       moo: document.getElementById('addr_moo').value, 
       sub: document.getElementById('addr_tumbon').value, 
       dist: document.getElementById('addr_amphoe').value, 
       prov: document.getElementById('addr_province').value, 
       lat: document.getElementById('lat').value, 
       long: document.getElementById('long').value 
    },
    diseases: currentDiseases,
    meds: currentMeds,
    exam: { 
      pps: document.getElementById('pps_score').value, 
      gcs: document.getElementById('gcs_score').value, 
      vitals: { 
        bp: document.getElementById('vs_bp').value, 
        pr: document.getElementById('vs_pr').value, 
        bt: document.getElementById('vs_bt').value 
      }, 
      esas: esas 
    },
    plan: document.getElementById('nursing_plan').value,
    acp: acp,
    nextVisitDate: document.getElementById('next_visit_date').value,
    nextVisitType: document.getElementById('next_visit_type').value,
    lab: { 
      cr: document.getElementById('lab_cr').value, 
      egfr: document.getElementById('lab_egfr').value 
    },
    status: document.querySelector('input[name="pt_status"]:checked').value,
    dischargeDate: document.getElementById('discharge_date').value
  };

  // 5. Send to Google Sheet
  Swal.fire({
    title: 'กำลังบันทึก...',
    text: 'กรุณารอสักครู่',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(formData)
  })
  .then(res => res.json())
  .then(res => {
    if(res.success) {
      Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
      document.getElementById('mainForm').reset();
      currentMeds = []; 
      currentDiseases = []; 
      renderMedsList(); 
      renderDiseaseBadges();
      loadData(); // Refresh Data
    } else {
      Swal.fire('เกิดข้อผิดพลาด', res.message, 'error');
    }
  })
  .catch(err => {
    Swal.fire('เชื่อมต่อล้มเหลว', 'กรุณาตรวจสอบอินเทอร์เน็ต', 'error');
    console.error(err);
  });
}

// --- Helper Functions ---
function showPage(pid) { 
  document.querySelectorAll('.page-section').forEach(e=>e.classList.add('d-none')); 
  document.getElementById('page-'+pid).classList.remove('d-none'); 
  document.querySelectorAll('.nav-link').forEach(e=>e.classList.remove('active')); 
  // Highlight Menu (Logic simplified)
  if(pid==='appoint') initSlider(); 
}

function addPhoneField() { 
  const d=document.createElement('div'); 
  d.className='input-group mb-2'; 
  d.innerHTML=`<input type="tel" class="form-control phone-input" placeholder="เบอร์โทร"><input type="text" class="form-control" placeholder="ความสัมพันธ์"><button class="btn btn-outline-danger" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`; 
  document.getElementById('phoneContainer').appendChild(d); 
}

function renderPPS() { 
  const s=document.getElementById('pps_score'); 
  for(let i=0;i<=100;i+=10) s.add(new Option(i+'%',i)); 
}

function renderESAS() { 
  const c=document.getElementById('esasContainer'); 
  esasTopics.forEach((t,i)=> {
    c.innerHTML+=`
    <div class="mb-2">
      <label class="d-flex justify-content-between small">${t} <span id="v${i}" class="fw-bold text-primary">0</span></label>
      <input type="range" class="form-range esas-range" min="0" max="10" value="0" oninput="document.getElementById('v${i}').innerText=this.value" data-topic="${t}">
    </div>`; 
  }); 
}

function renderACP() { 
  const b=document.getElementById('acpTableBody'); 
  acpTopics.forEach(t=> {
    b.innerHTML+=`
    <tr>
      <td>${t}</td>
      <td class="text-center"><input type="radio" name="acp_${t}" value="Want"></td>
      <td class="text-center"><input type="radio" name="acp_${t}" value="Dont"></td>
      <td class="text-center"><input type="radio" name="acp_${t}" value="Undecided" checked></td>
    </tr>`; 
  }); 
}

function renderDiseaseGroups() { 
  const s=document.getElementById('disease_group'); 
  s.add(new Option('-- เลือกกลุ่มโรค --',''));
  Object.keys(diseaseData).forEach(k=>s.add(new Option(k,k))); 
}

function updateDiseaseSub() { 
  const g=document.getElementById('disease_group').value, s=document.getElementById('disease_sub'); 
  s.innerHTML='<option value="">-- เลือกย่อย --</option>'; 
  if(g==='Non-Cancer') Object.keys(diseaseData[g]).forEach(k=>s.add(new Option(k,k))); 
  else if(g==='Cancer') { s.add(new Option('Primary Site','Sites')); s.add(new Option('Metastasis','Metastasis')); } 
}

function addDisease() { 
  const g=document.getElementById('disease_group').value, s=document.getElementById('disease_sub').value, d=document.getElementById('disease_specific').value; 
  if(g && s){ 
    currentDiseases.push({group:g,sub:s,detail:d}); 
    renderDiseaseBadges(); 
    document.getElementById('disease_specific').value='';
  } 
}

function renderDiseaseBadges() { 
  document.getElementById('diseaseList').innerHTML=currentDiseases.map((d,i)=>`<span class="badge bg-secondary m-1">${d.group} > ${d.sub} ${d.detail?': '+d.detail:''} <i class="fas fa-times ms-1" style="cursor:pointer" onclick="currentDiseases.splice(${i},1);renderDiseaseBadges()"></i></span>`).join(''); 
}

function renderMedOptions() { 
  const s=document.getElementById('med_name'); 
  s.add(new Option('-- เลือกยา --',''));
  medList.forEach(m=>s.add(new Option(m,m))); 
}

function addMed() { 
  const name=document.getElementById('med_name').value;
  const dose=document.getElementById('med_dose').value;
  if(name) {
    currentMeds.push({name, dose}); 
    renderMedsList(); 
    document.getElementById('med_dose').value='';
  }
}

function renderMedsList() { 
  document.getElementById('medList').innerHTML=currentMeds.map((m,i)=>`<li class="list-group-item d-flex justify-content-between p-2 small">${m.name} (${m.dose}) <button class="btn btn-sm btn-outline-danger border-0" onclick="currentMeds.splice(${i},1);renderMedsList()"><i class="fas fa-times"></i></button></li>`).join(''); 
}

function getLocation() { 
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(p=>{ 
      document.getElementById('lat').value=p.coords.latitude; 
      document.getElementById('long').value=p.coords.longitude; 
      window.open(`https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`);
    }); 
  } else {
    Swal.fire('Error','Browser not support GPS','error');
  }
}

function renderActivePatients() { 
  const t=document.getElementById('searchActive').value.toLowerCase(); 
  const filtered = allPatients.filter(p=>p.status==='Alive'&&(p.name.toString().toLowerCase().includes(t)||p.hn.toString().includes(t)));
  
  document.getElementById('activePatientList').innerHTML = filtered.length ? filtered.map(p=>`
    <div class="col-md-4 col-sm-6">
      <div class="card p-3 shadow-sm patient-card" onclick="editPatient('${p.hn}')">
         <div class="d-flex justify-content-between">
            <h5 class="mb-1">${p.name}</h5>
            <span class="badge bg-success">${p.type_admit}</span>
         </div>
         <p class="mb-0 text-muted small">HN: ${p.hn}</p>
         <small class="text-primary"><i class="fas fa-calendar-alt"></i> นัด: ${p.next_visit_date ? new Date(p.next_visit_date).toLocaleDateString('th-TH') : '-'}</small>
      </div>
    </div>`).join('') : '<div class="col-12 text-center text-muted mt-3">ไม่พบข้อมูล</div>'; 
}

function editPatient(hn) { 
  Swal.fire('Info', 'ฟังก์ชันแก้ไขข้อมูล HN: '+hn+' (รอพัฒนาต่อ)', 'info'); 
}

function initSlider() { 
  const c=document.getElementById('dateSlider'); 
  c.innerHTML=''; 
  const d=new Date(); 
  const thDays=['อา','จ','อ','พ','พฤ','ศ','ส'];
  
  for(let i=0;i<14;i++){ 
    const t=new Date(d); 
    t.setDate(d.getDate()+i); 
    const dateStr = t.toISOString().split('T')[0];
    
    c.innerHTML+=`
      <div class="date-card ${i===0?'active':''}" onclick="document.querySelectorAll('.date-card').forEach(e=>e.classList.remove('active'));this.classList.add('active');renderApptList('${dateStr}')">
         <div class="date-day">${thDays[t.getDay()]}</div>
         <div class="date-num">${t.getDate()}</div>
      </div>`; 
  } 
  renderApptList(d.toISOString().split('T')[0]); 
}

function renderApptList(dateStr) { 
  const l=document.getElementById('appointList'); 
  const p=allPatients.filter(x=>x.next_visit_date && x.next_visit_date.includes(dateStr)); 
  
  l.innerHTML = p.length ? p.map(x=>`
    <div class="col-md-6">
       <div class="card p-3 border-start border-3 border-warning shadow-sm">
          <h5 class="mb-1">${x.name}</h5>
          <span class="badge bg-warning text-dark w-auto" style="width:fit-content">${x.visit_type}</span>
       </div>
    </div>`).join('') : '<div class="col-12 text-center text-muted py-5">ไม่มีนัดหมายในวันนี้</div>'; 
}

function renderSummary() { 
  const total=allPatients.length;
  const alive=allPatients.filter(p=>p.status==='Alive').length;
  const dead=total-alive;
  const morphine=allPatients.filter(p=>JSON.stringify(p.meds).toLowerCase().includes('morphine')).length;

  document.getElementById('summaryContainer').innerHTML=`
    <div class="col-6 col-md-3"><div class="card p-3 bg-primary text-white h-100"><h3>${total}</h3><small>ผู้ป่วยทั้งหมด</small></div></div>
    <div class="col-6 col-md-3"><div class="card p-3 bg-success text-white h-100"><h3>${alive}</h3><small>กำลังรักษา</small></div></div>
    <div class="col-6 col-md-3"><div class="card p-3 bg-dark text-white h-100"><h3>${dead}</h3><small>จำหน่าย/เสียชีวิต</small></div></div>
    <div class="col-6 col-md-3"><div class="card p-3 bg-warning text-dark h-100"><h3>${morphine}</h3><small>ใช้ Morphine</small></div></div>`; 
}
