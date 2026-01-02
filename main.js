<details><summary>
  // --- DATA DEFINITIONS ---
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
  "MST(10)", "MST(30)", "Morphine syr(10 mg/5 mL)", "Fentanyl patch (12 mcg/hr)",
  "Senna (มะขามแขก)", "Lactulose", "Gabapentin(300)", "Paracetamol(500)", "Tramadol(50)"
];

const acpTopics = ["ET tube", "CPR", "Inotrope", "Hemodialysis", "NG tube", "Morphine", "Place of death"];
const esasTopics = ["Pain", "Fatigue", "Nausea", "Depression", "Anxiety", "Drowsiness", "Appetite", "Well-being", "Shortness of breath"];

// --- GLOBAL STATE ---
let allPatients = [];
let currentPhones = [];
let currentDiseases = [];
let currentMeds = [];

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  renderPPS();
  renderESAS();
  renderACP();
  renderMedOptions();
  renderDiseaseGroups();
  addPhoneField();
  
  // Load data
  google.script.run.withSuccessHandler(data => {
    allPatients = data;
    renderActivePatients();
    renderSummary();
  }).getAllPatients();
});

// --- NAVIGATION ---
function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(el => el.classList.add('d-none'));
  document.getElementById('page-' + pageId).classList.remove('d-none');
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  if(pageId === 'appoint') initAppointmentSlider();
}

// --- DYNAMIC FORMS ---
function addPhoneField(val = '', label = '') {
  const div = document.createElement('div');
  div.className = 'input-group mb-2';
  div.innerHTML = `
    <input type="tel" class="form-control phone-input" placeholder="เบอร์โทร" value="${val}">
    <input type="text" class="form-control" placeholder="ผู้เกี่ยวข้อง (เช่น ลูก)" value="${label}">
    <button class="btn btn-outline-danger" type="button" onclick="this.parentElement.remove()">ลบ</button>
  `;
  document.getElementById('phoneContainer').appendChild(div);
}

function renderPPS() {
  const sel = document.getElementById('pps_score');
  for(let i=0; i<=100; i+=10) {
    let opt = document.createElement('option');
    opt.value = i;
    opt.text = i + '%';
    sel.appendChild(opt);
  }
}

function renderESAS() {
  const container = document.getElementById('esasContainer');
  esasTopics.forEach((topic, idx) => {
    container.innerHTML += `
      <div class="mb-3">
        <label class="form-label d-flex justify-content-between">
           <span>${topic}</span> <span id="val_esas_${idx}" class="fw-bold text-primary">0</span>
        </label>
        <input type="range" class="form-range esas-range" min="0" max="10" value="0" 
         oninput="document.getElementById('val_esas_${idx}').innerText = this.value" data-topic="${topic}">
      </div>
    `;
  });
}

function renderACP() {
  const tbody = document.getElementById('acpTableBody');
  acpTopics.forEach(topic => {
    tbody.innerHTML += `
      <tr>
        <td>${topic}</td>
        <td class="text-center"><input type="radio" name="acp_${topic}" value="Want"></td>
        <td class="text-center"><input type="radio" name="acp_${topic}" value="DontWant"></td>
        <td class="text-center"><input type="radio" name="acp_${topic}" value="Undecided" checked></td>
      </tr>
    `;
  });
}

// --- DISEASE LOGIC ---
function renderDiseaseGroups() {
  const sel = document.getElementById('disease_group');
  Object.keys(diseaseData).forEach(k => {
    sel.add(new Option(k, k));
  });
}

function updateDiseaseSub() {
  const group = document.getElementById('disease_group').value;
  const subSel = document.getElementById('disease_sub');
  subSel.innerHTML = '<option value="">-- เลือก --</option>';
  
  if(group === 'Non-Cancer') {
     Object.keys(diseaseData['Non-Cancer']).forEach(k => subSel.add(new Option(k, k)));
  } else if (group === 'Cancer') {
     subSel.add(new Option('Primary Site', 'Sites'));
     subSel.add(new Option('Metastasis', 'Metastasis'));
  }
}

function updateDiseaseSpecific() {
   // Logic populated specifically
}

function addDisease() {
  const g = document.getElementById('disease_group').value;
  const s = document.getElementById('disease_sub').value;
  const spec = document.getElementById('disease_specific').value;
  
  if(!g) return;
  currentDiseases.push({group: g, sub: s, detail: spec});
  renderDiseaseBadges();
}

function renderDiseaseBadges() {
  const div = document.getElementById('diseaseList');
  div.innerHTML = '';
  currentDiseases.forEach((d, i) => {
    div.innerHTML += `<span class="badge bg-secondary rounded-pill p-2">${d.group}-${d.sub} <i class="fas fa-times ms-2" onclick="currentDiseases.splice(${i},1);renderDiseaseBadges()"></i></span>`;
  });
}

// --- MEDS LOGIC ---
function renderMedOptions() {
  const sel = document.getElementById('med_name');
  medList.forEach(m => sel.add(new Option(m, m)));
}

function addMed() {
  const name = document.getElementById('med_name').value;
  const dose = document.getElementById('med_dose').value;
  currentMeds.push({name, dose, date: new Date().toLocaleDateString()});
  renderMedsList();
}

function renderMedsList() {
  const div = document.getElementById('medList');
  div.innerHTML = '';
  currentMeds.forEach((m, i) => {
    div.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center">
      ${m.name} (${m.dose})
      <button class="btn btn-sm btn-danger" onclick="currentMeds.splice(${i},1);renderMedsList()">x</button>
    </li>`;
  });
}

// --- MAP & LOCATION ---
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      document.getElementById('lat').value = position.coords.latitude;
      document.getElementById('long').value = position.coords.longitude;
      window.open(`https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`, '_blank');
      Swal.fire('พิกัดบันทึกแล้ว', 'Lat/Long updated', 'success');
    });
  } else { 
    alert("Geolocation is not supported by this browser.");
  }
}

// --- SUBMIT ---
function handleFormSubmit(e) {
  e.preventDefault();
  
  const phones = [];
  document.querySelectorAll('.phone-input').forEach((el, idx) => {
     if(el.value) phones.push({number: el.value, label: el.nextElementSibling.value});
  });

  const esas = {};
  document.querySelectorAll('.esas-range').forEach(el => {
    esas[el.dataset.topic] = el.value;
  });
  
  const acp = {};
  acpTopics.forEach(t => {
    const checked = document.querySelector(`input[name="acp_${t}"]:checked`);
    acp[t] = checked ? checked.value : 'Undecided';
  });

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

  Swal.fire({title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading()});
  
  google.script.run.withSuccessHandler(res => {
    Swal.fire('สำเร็จ', res.message, 'success');
    document.getElementById('mainForm').reset();
    currentMeds = []; currentDiseases = [];
    renderMedsList(); renderDiseaseBadges();
    google.script.run.withSuccessHandler(d => {allPatients = d;}).getAllPatients();
  }).savePatientData({jsonData: JSON.stringify(formData)});
}

// --- ACTIVE PATIENTS ---
function renderActivePatients() {
  const container = document.getElementById('activePatientList');
  const term = document.getElementById('searchActive').value.toLowerCase();
  
  const filtered = allPatients.filter(p => p.status === 'Alive' && (p.name.includes(term) || p.hn.includes(term)));
  
  container.innerHTML = filtered.map(p => `
    <div class="col-md-4">
      <div class="card patient-card p-3 shadow-sm" onclick="editPatient('${p.hn}')">
         <span class="badge bg-success status-badge">${p.type_admit}</span>
         <h5>${p.gender === 'Male' ? '<i class="fas fa-male text-primary"></i>' : '<i class="fas fa-female text-danger"></i>'} ${p.name}</h5>
         <p class="mb-1 text-muted">HN: ${p.hn}</p>
         <small>นัดถัดไป: ${p.next_visit_date ? new Date(p.next_visit_date).toLocaleDateString() : '-'}</small>
      </div>
    </div>
  `).join('');
}

function editPatient(hn) {
  Swal.fire('Feature', 'ระบบจะดึงข้อมูลคนไข้ ' + hn + ' มาแก้ไข', 'info');
}

// --- APPOINTMENT SLIDER ---
function initAppointmentSlider() {
  const container = document.getElementById('dateSlider');
  container.innerHTML = '';
  const today = new Date();
  const daysTh = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
  
  for(let i=0; i<14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    const div = document.createElement('div');
    div.className = `date-card ${i===0 ? 'active' : ''}`;
    div.innerHTML = `
      <div class="date-day">${daysTh[d.getDay()]}</div>
      <div class="date-num">${d.getDate()}</div>
    `;
    div.onclick = () => {
       document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
       div.classList.add('active');
       renderApptList(d);
    };
    container.appendChild(div);
  }
  renderApptList(today);
}

function renderApptList(dateObj) {
  const list = document.getElementById('appointList');
  const dateStr = dateObj.toISOString().split('T')[0];
  
  const patients = allPatients.filter(p => p.next_visit_date && p.next_visit_date.includes(dateStr));
  
  if(patients.length === 0) {
    list.innerHTML = `<div class="col-12 text-center text-muted py-5">ไม่มีนัดหมายในวันนี้</div>`;
    return;
  }
  
  list.innerHTML = patients.map(p => `
    <div class="col-md-6">
       <div class="card p-3 border-start border-3 border-warning">
          <h5>${p.name}</h5>
          <span>ประเภท: ${p.visit_type}</span>
       </div>
    </div>
  `).join('');
}

function renderSummary() {
  const div = document.getElementById('summaryContainer');
  const total = allPatients.length;
  const alive = allPatients.filter(p => p.status === 'Alive').length;
  const dead = total - alive;
  const morphineCount = allPatients.filter(p => JSON.stringify(p.meds).toLowerCase().includes('morphine')).length;

  div.innerHTML = `
    <div class="col-md-3"><div class="card p-3 bg-primary text-white"><h3>${total}</h3><small>ผู้ป่วยทั้งหมด</small></div></div>
    <div class="col-md-3"><div class="card p-3 bg-success text-white"><h3>${alive}</h3><small>กำลังรักษา</small></div></div>
    <div class="col-md-3"><div class="card p-3 bg-dark text-white"><h3>${dead}</h3><small>จำหน่าย/เสียชีวิต</small></div></div>
    <div class="col-md-3"><div class="card p-3 bg-warning"><h3>${morphineCount}</h3><small>ใช้ Morphine</small></div></div>
  `;
}
<summary></details>
