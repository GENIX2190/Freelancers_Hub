/* =============================================
   MISSIONS.JS — wired to MySQL via MissionController
   ============================================= */

var missions = [];
var categories = [];
var candidatures = [];
var activeFilter = 'all';
var viewingId = null;
var activeMissionTab = 'missions';

var API = '../../Controllers/MissionController.php';

function loadAll() {
    Promise.all([
        fetch(API + '?action=list_missions').then(function(r){ return r.json(); }),
        fetch(API + '?action=list_categories').then(function(r){ return r.json(); }),
        fetch(API + '?action=list_candidatures').then(function(r){ return r.json(); })
    ]).then(function(res) {
        missions = res[0]; categories = res[1]; candidatures = res[2];
        updateStats(); applyFilters(); renderCategories(); renderCandidatures();
        populateCategorySelect(); populateMissionSelect();
    }).catch(function(){ showToast('Failed to load data', true); });
}

/* ── STATS ── */
function updateStats() {
    document.getElementById('stat-total').textContent = missions.length;
    document.getElementById('stat-active').textContent = missions.filter(function(m){ return m.status==='Active'; }).length;
    document.getElementById('stat-pending').textContent = missions.filter(function(m){ return m.status==='Pending'; }).length;
    document.getElementById('stat-completed').textContent = missions.filter(function(m){ return m.status==='Completed'; }).length;
    var rev = missions.reduce(function(s,m){ return s + Number(m.budget||0); }, 0);
    document.getElementById('stat-revenue').textContent = rev.toLocaleString() + '€';
    document.getElementById('stat-categories').textContent = categories.length;
    document.getElementById('stat-applications').textContent = candidatures.length;
}

/* ── RENDER MISSIONS TABLE ── */
function renderTable(data) {
    var tbody = document.getElementById('tableBody');
    var empty = document.getElementById('emptyState');
    tbody.innerHTML = '';
    if (!data.length) { empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    var statusClass = { Active:'badge-active', Pending:'badge-pending', Completed:'badge-completed', Cancelled:'badge-cancelled' };
    data.forEach(function(m, i) {
        var deadlineStr = m.deadline ? new Date(m.deadline+'T00:00:00').toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—';
        var overdue = m.status!=='Completed' && m.deadline && new Date(m.deadline) < new Date();
        var deadlineTd = '<span style="'+(overdue?'color:#dc3545;font-weight:700;':'')+'">'+deadlineStr+(overdue?' ⚠️':'')+'</span>';
        var row = document.createElement('tr');
        row.innerHTML =
            '<td style="color:#aaa;font-size:13px;">'+(i+1)+'</td>'+
            '<td class="td-title">'+m.title+'</td>'+
            '<td><span class="category-chip">'+(m.category||'—')+'</span></td>'+
            '<td>'+(m.client||'—')+'</td>'+
            '<td><strong>'+Number(m.budget||0).toLocaleString()+'€</strong></td>'+
            '<td><span class="badge '+(statusClass[m.status]||'')+'">'+m.status+'</span></td>'+
            '<td><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill" style="width:'+m.progress+'%"></div></div><div class="prog-label">'+m.progress+'%</div></div></td>'+
            '<td>'+deadlineTd+'</td>'+
            '<td><div class="action-btns">'+
                '<button class="btn-act btn-act-view" onclick="openViewModal('+m.id+')">👁 View</button>'+
                '<button class="btn-act btn-act-edit" onclick="openEditModal('+m.id+')">✏️ Edit</button>'+
                '<button class="btn-act btn-act-delete" onclick="openDeleteModal('+m.id+')">🗑 Del</button>'+
            '</div></td>';
        tbody.appendChild(row);
    });
}

/* ── FILTERS ── */
function applyFilters() {
    var q = (document.getElementById('searchInput').value||'').toLowerCase();
    var filtered = missions.slice();
    if (activeFilter!=='all') filtered = filtered.filter(function(m){ return m.status===activeFilter; });
    if (q) filtered = filtered.filter(function(m){
        return m.title.toLowerCase().indexOf(q)>-1 || (m.client||'').toLowerCase().indexOf(q)>-1
            || (m.contact_email||'').toLowerCase().indexOf(q)>-1
            || (m.category||'').toLowerCase().indexOf(q)>-1;
    });
    renderTable(filtered);
}
function setFilter(btn) {
    document.querySelectorAll('.filter-tab').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    activeFilter = btn.dataset.status;
    applyFilters();
}

/* ── POPULATE CATEGORY DROPDOWN ── */
function populateCategorySelect() {
    var sel = document.getElementById('f_category');
    if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = '<option value="">-- Select --</option>';
    categories.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c.id; opt.textContent = c.name;
        sel.appendChild(opt);
    });
    sel.value = cur;
}

/* ── ADD MISSION ── */
function openAddModal() {
    document.getElementById('formModalTitle').textContent = '➕ Add New Mission';
    document.getElementById('missionForm').reset();
    document.getElementById('f_action').value = 'mission_create';
    document.getElementById('editId').value = '';
    document.getElementById('f_progress').value = 0;
    populateCategorySelect();
    clearValidation('missionForm');
    var dl = document.getElementById('f_deadline');
    if (dl && typeof dateInputTodayISO === 'function') dl.min = dateInputTodayISO();
    openModal('formModal');
}

/* ── EDIT MISSION ── */
function openEditModal(id) {
    var m = missions.find(function(x){ return x.id===id; });
    if (!m) return;
    document.getElementById('formModalTitle').textContent = '✏️ Edit Mission';
    document.getElementById('f_action').value = 'mission_update';
    document.getElementById('editId').value = id;
    populateCategorySelect();
    document.getElementById('f_title').value = m.title;
    document.getElementById('f_category').value = m.categorie_id;
    document.getElementById('f_client').value = m.client;
    document.getElementById('f_contact_email').value = m.contact_email || '';
    document.getElementById('f_budget').value = m.budget;
    document.getElementById('f_status').value = m.status;
    document.getElementById('f_deadline').value = m.deadline;
    document.getElementById('f_progress').value = m.progress;
    document.getElementById('f_priority').value = m.priority;
    document.getElementById('f_description').value = m.description;
    clearValidation('missionForm');
    var dlEd = document.getElementById('f_deadline');
    if (dlEd && typeof dateInputTodayISO === 'function') {
        var t0 = dateInputTodayISO();
        if (dlEd.value && dlEd.value < t0) dlEd.removeAttribute('min');
        else dlEd.min = t0;
    }
    closeModal('viewModal');
    openModal('formModal');
}
function openEditFromView() { if (viewingId) openEditModal(viewingId); }

/* ── SAVE MISSION (validate then submit) ── */
function saveMission(e) {
    var ok = true;
    ok = validateField(document.getElementById('f_title'),{minLen:3,maxLen:100}) && ok;
    ok = validateField(document.getElementById('f_category'),{}) && ok;
    ok = validateField(document.getElementById('f_client'),{minLen:2}) && ok;
    ok = validateField(document.getElementById('f_contact_email'), {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMsg: 'Enter a valid contact email.'
    }) && ok;
    ok = validateField(document.getElementById('f_budget'),{min:0}) && ok;
    ok = validateField(document.getElementById('f_status'),{}) && ok;
    ok = validateField(document.getElementById('f_deadline'),{}) && ok;
    var prog = parseInt(document.getElementById('f_progress').value);
    if (isNaN(prog)||prog<0||prog>100) { showFieldError('f_progress','0–100'); ok=false; }
    if (!ok) { e.preventDefault(); showToast('Please fix the errors.',true); return false; }
    return true;
}

/* ── VIEW MODAL ── */
function openViewModal(id) {
    var m = missions.find(function(x){ return x.id===id; });
    if (!m) return;
    viewingId = id;
    var statusClass = {Active:'badge-active',Pending:'badge-pending',Completed:'badge-completed',Cancelled:'badge-cancelled'};
    var dl = m.deadline ? new Date(m.deadline+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) : '—';
    document.getElementById('d_title').textContent = m.title;
    document.getElementById('d_category').textContent = m.category||'—';
    document.getElementById('d_client').textContent = m.client||'—';
    document.getElementById('d_contact_email').textContent = m.contact_email || '—';
    document.getElementById('d_budget').textContent = Number(m.budget||0).toLocaleString()+' €';
    document.getElementById('d_status').innerHTML = '<span class="badge '+(statusClass[m.status]||'')+'">'+m.status+'</span>';
    document.getElementById('d_priority').textContent = m.priority;
    document.getElementById('d_deadline').textContent = dl;
    document.getElementById('d_progress').textContent = m.progress+'%';
    document.getElementById('d_prog_fill').style.width = m.progress+'%';
    document.getElementById('d_description').textContent = m.description||'No description provided.';
    openModal('viewModal');
}

/* ── DELETE MISSION ── */
function openDeleteModal(id) {
    var m = missions.find(function(x){ return x.id===id; });
    if (!m) return;
    document.getElementById('deleteMsg').textContent = 'Delete "'+m.title+'"? This cannot be undone.';
    document.getElementById('confirmDeleteBtn').onclick = function() {
        document.getElementById('del_mission_id').value = id;
        document.getElementById('delMissionForm').submit();
    };
    openModal('deleteModal');
}

function toggleProgress() {
    var s = document.getElementById('f_status').value;
    if (s==='Completed') document.getElementById('f_progress').value = 100;
    if (s==='Pending') document.getElementById('f_progress').value = 0;
}

/* ══════════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════════ */
function switchMissionTab(tab, btn) {
    activeMissionTab = tab;
    document.querySelectorAll('.tabs-bar .tab-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    document.querySelectorAll('.tab-section').forEach(function(s){ s.classList.remove('active-tab'); });
    document.getElementById('tab-'+tab).classList.add('active-tab');
    var addBtn = document.getElementById('main-add-btn');
    if (tab==='missions') { addBtn.textContent='＋ Add New Mission'; }
    else if (tab==='categories') { addBtn.textContent='＋ Add Category'; renderCategories(); }
    else if (tab==='candidatures') { addBtn.textContent='＋ Add Application'; populateMissionSelect(); renderCandidatures(); }
}
function onMainAdd() {
    if (activeMissionTab==='missions') openAddModal();
    else if (activeMissionTab==='categories') openAddCategory();
    else if (activeMissionTab==='candidatures') openAddCandidature();
}

function populateMissionSelect() {
    var sel = document.getElementById('app_mission');
    if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = '<option value="">-- Select mission --</option>';
    missions.forEach(function(m) {
        var opt = document.createElement('option');
        opt.value = m.id; opt.textContent = m.title;
        sel.appendChild(opt);
    });
    sel.value = cur;
}

/* ══════════════════════════════════════════
   CATEGORIES
══════════════════════════════════════════ */
function countMissionsInCategory(catId) {
    return missions.filter(function(m){ return m.categorie_id===catId; }).length;
}

function renderCategories() {
    var q = (document.getElementById('search-cats').value||'').toLowerCase();
    var data = categories.filter(function(c){
        return !q || c.name.toLowerCase().indexOf(q)>-1 || (c.desc||'').toLowerCase().indexOf(q)>-1;
    });
    var tbody = document.getElementById('cats-tbody');
    document.getElementById('cats-empty').style.display = data.length ? 'none' : 'block';
    tbody.innerHTML = '';
    data.forEach(function(c, i) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td style="color:#aaa">'+(i+1)+'</td>'+
            '<td style="font-size:22px;text-align:center">'+c.icon+'</td>'+
            '<td><strong>'+c.name+'</strong></td>'+
            '<td style="color:#666;max-width:300px">'+(c.desc||'')+'</td>'+
            '<td><span class="badge-cat">'+countMissionsInCategory(c.id)+'</span></td>'+
            '<td>'+
                '<button class="btn-act btn-act-edit" onclick="openEditCategory('+c.id+')">✏️</button>'+
                '<button class="btn-act btn-act-delete" onclick="confirmDeleteCategory('+c.id+')">🗑</button>'+
            '</td>';
        tbody.appendChild(tr);
    });
}

function openAddCategory() {
    document.getElementById('catModalTitle').textContent = '➕ Add Category';
    document.getElementById('catForm').reset();
    document.getElementById('cat_action').value = 'cat_create';
    document.getElementById('cat_id').value = '';
    clearValidation('catForm');
    openModal('catModal');
}
function openEditCategory(id) {
    var c = categories.find(function(x){ return x.id===id; });
    if (!c) return;
    document.getElementById('catModalTitle').textContent = '✏️ Edit Category';
    document.getElementById('cat_action').value = 'cat_update';
    document.getElementById('cat_id').value = c.id;
    document.getElementById('cat_name').value = c.name;
    document.getElementById('cat_icon').value = c.icon;
    document.getElementById('cat_desc').value = c.desc||'';
    clearValidation('catForm');
    openModal('catModal');
}
function saveCategory(e) {
    var ok = validateField(document.getElementById('cat_name'),{minLen:2,maxLen:60});
    if (!ok) { e.preventDefault(); showToast('Please fix the errors.',true); return false; }
    return true;
}
function confirmDeleteCategory(id) {
    var c = categories.find(function(x){ return x.id===id; });
    if (!c) return;
    document.getElementById('deleteMsg').textContent = 'Delete category "'+c.name+'"?';
    document.getElementById('confirmDeleteBtn').onclick = function() {
        document.getElementById('del_cat_id').value = id;
        document.getElementById('delCatForm').submit();
    };
    openModal('deleteModal');
}

/* ══════════════════════════════════════════
   CANDIDATURES
══════════════════════════════════════════ */
var appStatusClass = { Pending:'app-pending', Reviewing:'app-reviewing', Accepted:'app-accepted', Rejected:'app-rejected' };

function renderCandidatures() {
    var q = (document.getElementById('search-apps').value||'').toLowerCase();
    var data = candidatures.filter(function(a){
        return !q || (a.missionTitle||'').toLowerCase().indexOf(q)>-1 || a.name.toLowerCase().indexOf(q)>-1 || a.email.toLowerCase().indexOf(q)>-1;
    });
    var tbody = document.getElementById('apps-tbody');
    document.getElementById('apps-empty').style.display = data.length ? 'none' : 'block';
    tbody.innerHTML = '';
    data.forEach(function(a, i) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td style="color:#aaa">'+(i+1)+'</td>'+
            '<td style="max-width:200px"><strong>'+(a.missionTitle||'—')+'</strong></td>'+
            '<td>'+a.name+'</td>'+
            '<td style="color:#0066cc"><a href="mailto:'+a.email+'" style="color:inherit">'+a.email+'</a></td>'+
            '<td>'+a.experience+'</td>'+
            '<td><span class="badge-status-app '+(appStatusClass[a.status]||'')+'">'+a.status+'</span></td>'+
            '<td>'+a.date+'</td>'+
            '<td>'+
                '<button class="btn-act btn-act-edit" onclick="openEditCandidature('+a.id+')">✏️</button>'+
                '<button class="btn-act btn-act-delete" onclick="confirmDeleteCandidature('+a.id+')">🗑</button>'+
            '</td>';
        tbody.appendChild(tr);
    });
}

function openAddCandidature() {
    populateMissionSelect();
    document.getElementById('appModalTitle').textContent = '➕ Add Application';
    document.getElementById('appForm').reset();
    document.getElementById('app_action').value = 'cand_create';
    document.getElementById('app_id').value = '';
    clearValidation('appForm');
    var ad = document.getElementById('app_date');
    if (ad && typeof dateInputTodayISO === 'function') ad.min = dateInputTodayISO();
    openModal('appModal');
}
function openEditCandidature(id) {
    var a = candidatures.find(function(x){ return x.id===id; });
    if (!a) return;
    populateMissionSelect();
    document.getElementById('appModalTitle').textContent = '✏️ Edit Application';
    document.getElementById('app_action').value = 'cand_update';
    document.getElementById('app_id').value = a.id;
    document.getElementById('app_mission').value = a.missionId;
    document.getElementById('app_name').value = a.name;
    document.getElementById('app_email').value = a.email;
    document.getElementById('app_phone').value = a.phone||'';
    document.getElementById('app_experience').value = a.experience;
    document.getElementById('app_status').value = a.status;
    document.getElementById('app_date').value = a.date;
    document.getElementById('app_rate').value = a.rate||'';
    document.getElementById('app_message').value = a.message||'';
    clearValidation('appForm');
    var adEd = document.getElementById('app_date');
    if (adEd) adEd.removeAttribute('min');
    openModal('appModal');
}
function saveCandidature(e) {
    var ok = true;
    ok = validateField(document.getElementById('app_mission'),{}) && ok;
    ok = validateField(document.getElementById('app_name'),{minLen:2,maxLen:80}) && ok;
    ok = validateField(document.getElementById('app_email'),{pattern:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,patternMsg:'Invalid email.'}) && ok;
    ok = validateField(document.getElementById('app_experience'),{}) && ok;
    ok = validateField(document.getElementById('app_status'),{}) && ok;
    ok = validateField(document.getElementById('app_date'),{}) && ok;
    if (!ok) { e.preventDefault(); showToast('Please fix the errors.',true); return false; }
    return true;
}
function confirmDeleteCandidature(id) {
    var a = candidatures.find(function(x){ return x.id===id; });
    if (!a) return;
    document.getElementById('deleteMsg').textContent = 'Delete application from "'+a.name+'"?';
    document.getElementById('confirmDeleteBtn').onclick = function() {
        document.getElementById('del_cand_id').value = id;
        document.getElementById('delCandForm').submit();
    };
    openModal('deleteModal');
}

/* ── PDF EXPORT (missions + categories + candidatures) ── */
function pdfSafeText(str, maxLen) {
    maxLen = maxLen || 72;
    if (str == null || str === undefined) return '';
    var s = String(str).replace(/\r\n|\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
    if (s.length > maxLen) s = s.slice(0, maxLen - 1) + '…';
    return s;
}

function exportMissionsFullPdf() {
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
        showToast('PDF library failed to load. Check your internet connection.', true);
        return;
    }
    var JsPDF = window.jspdf.jsPDF;
    var doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    if (typeof doc.autoTable !== 'function') {
        showToast('PDF table plugin not loaded.', true);
        return;
    }

    var margin = 10;
    var title = 'Freelence Hub — Missions export';
    var stamp = 'Generated: ' + new Date().toLocaleString();

    doc.setFontSize(15);
    doc.setTextColor(0, 120, 70);
    doc.text(title, margin, 14);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(stamp, margin, 20);

    /* — Missions — */
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Missions (' + missions.length + ')', margin, 28);

    var missionRows = missions.map(function(m, i) {
        return [
            String(i + 1),
            pdfSafeText(m.title, 36),
            pdfSafeText(m.category, 14),
            pdfSafeText(m.client, 18),
            pdfSafeText(m.contact_email, 28),
            m.budget != null ? Number(m.budget).toLocaleString() : '—',
            pdfSafeText(m.status, 11),
            m.progress != null ? String(m.progress) + '%' : '—',
            pdfSafeText(m.deadline, 12)
        ];
    });
    if (!missionRows.length) missionRows = [['—', 'No missions', '', '', '', '', '', '', '']];

    doc.autoTable({
        startY: 31,
        head: [['#', 'Title', 'Category', 'Client', 'Contact email', 'Budget (€)', 'Status', 'Progress', 'Deadline']],
        body: missionRows,
        styles: { fontSize: 8, cellPadding: 1.2, overflow: 'linebreak' },
        headStyles: { fillColor: [0, 168, 82], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 252, 248] },
        margin: { left: margin, right: margin }
    });

    /* — Categories — */
    doc.addPage();
    doc.setFontSize(15);
    doc.setTextColor(0, 120, 70);
    doc.text(title, margin, 14);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Categories (' + categories.length + ')', margin, 24);

    var catRows = categories.map(function(c, i) {
        return [
            String(i + 1),
            pdfSafeText(c.icon, 8),
            pdfSafeText(c.name, 24),
            pdfSafeText(c.desc, 55),
            String(countMissionsInCategory(c.id))
        ];
    });
    if (!catRows.length) catRows = [['—', '', 'No categories', '', '']];

    doc.autoTable({
        startY: 27,
        head: [['#', 'Icon', 'Name', 'Description', 'Missions #']],
        body: catRows,
        styles: { fontSize: 8, cellPadding: 1.2, overflow: 'linebreak' },
        headStyles: { fillColor: [0, 168, 82], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 252, 248] },
        margin: { left: margin, right: margin }
    });

    /* — Candidatures — */
    doc.addPage();
    doc.setFontSize(15);
    doc.setTextColor(0, 120, 70);
    doc.text(title, margin, 14);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Candidatures / Applications (' + candidatures.length + ')', margin, 24);

    var candRows = candidatures.map(function(a, i) {
        return [
            String(i + 1),
            pdfSafeText(a.missionTitle, 36),
            pdfSafeText(a.name, 22),
            pdfSafeText(a.email, 32),
            pdfSafeText(a.experience, 14),
            pdfSafeText(a.status, 12),
            pdfSafeText(a.date, 11),
            pdfSafeText(a.message, 40)
        ];
    });
    if (!candRows.length) candRows = [['—', 'No applications', '', '', '', '', '', '']];

    doc.autoTable({
        startY: 27,
        head: [['#', 'Mission', 'Freelancer', 'Email', 'Experience', 'Status', 'Date', 'Message']],
        body: candRows,
        styles: { fontSize: 7, cellPadding: 1.2, overflow: 'linebreak' },
        headStyles: { fillColor: [0, 168, 82], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 252, 248] },
        margin: { left: margin, right: margin }
    });

    var fname = 'freelence-missions-export-' + new Date().toISOString().slice(0, 10) + '.pdf';
    doc.save(fname);
    showToast('PDF downloaded.');
}

/* ── TOAST FROM URL ── */
(function(){
    var p = new URLSearchParams(window.location.search);
    var msg = p.get('msg');
    var tab = p.get('tab');
    if (msg) {
        var msgs = {created:'Mission added',updated:'Mission updated',deleted:'Mission deleted',error:'Failed to save mission',cat_created:'Category added',cat_updated:'Category updated',cat_deleted:'Category deleted',cand_created:'Application added',cand_updated:'Application updated',cand_deleted:'Application deleted',cand_error:'Failed to save application - check data',invalid:'Invalid request'};
        var errors = ['invalid','error','cand_error'];
        showToast(msgs[msg]||msg, errors.indexOf(msg)!==-1);
        history.replaceState(null,'',window.location.pathname);
    }
    if (tab) {
        setTimeout(function(){
            var btn = document.querySelector('.tab-btn[onclick*="'+tab+'"]');
            if (btn) switchMissionTab(tab, btn);
        }, 100);
    }
})();

loadAll();
