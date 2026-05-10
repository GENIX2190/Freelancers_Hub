/* =============================================
   FORMATIONS.JS — Training Management CRUD
   Wired to MySQL via FormationController
   ============================================= */

var API = '../../Controllers/FormationController.php';
var courses     = [];
var evaluations = [];
window.reviewsData = evaluations;
var activeFilter = 'all';
var viewingId    = null;

var badgeMap = {
    'In Progress': 'badge-progress',
    'Completed':   'badge-completed',
    'Planned':     'badge-planned',
    'Cancelled':   'badge-cancelled',
};

/* ── LOAD ALL DATA FROM DB ── */
function loadAll() {
    Promise.all([
        fetch(API + '?action=list_formations').then(function(r){ return r.json(); }),
        fetch(API + '?action=list_avis').then(function(r){ return r.json(); })
    ]).then(function(results) {
        courses     = results[0];
        evaluations = results[1] || [];
        window.reviewsData = evaluations;
        updateStats();
        updateEvalStats();
        if (window.updateRatingDonut) window.updateRatingDonut(evaluations);
        renderStudentReviews(evaluations);
        applyFilters();
    }).catch(function() {
        document.getElementById('cardsGrid').innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load data.</p></div>';
    });
}

/* ── PROGRESS CALC ── */
function calcProgress(c) {
    if (!c.totalHours) return 0;
    if (c.status === 'Completed') return 100;
    return Math.min(100, Math.round((c.hoursDone / c.totalHours) * 100));
}

/* ── STATS ── */
function updateStats() {
    document.getElementById('s-total').textContent      = courses.length;
    document.getElementById('s-inprogress').textContent = courses.filter(function(c){ return c.status === 'In Progress'; }).length;
    document.getElementById('s-completed').textContent  = courses.filter(function(c){ return c.status === 'Completed'; }).length;
    document.getElementById('s-planned').textContent    = courses.filter(function(c){ return c.status === 'Planned'; }).length;
}

/* ── RENDER CARDS ── */
function renderCards(data) {
    var grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';

    if (!data.length) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>No courses found.</p></div>';
        return;
    }

    data.forEach(function(c) {
        var pct       = calcProgress(c);
        var badgeCls  = badgeMap[c.status] || '';
        var ratingStr = c.rating ? c.rating + '/5 ⭐' : '—';
        var certMeta  = c.status === 'Completed'
            ? '<div class="meta-item"><div class="meta-val">✓</div><div class="meta-lbl">Certificate</div></div>'
            : '<div class="meta-item"><div class="meta-val">' + (c.totalHours - c.hoursDone) + 'h</div><div class="meta-lbl">Remaining</div></div>';

        var mainBtnLabel = c.status === 'Completed' ? '🏅 Certificate' : c.status === 'Planned' ? '👁 View' : '▶ Continue';

        var card = document.createElement('div');
        card.className = 'formation-card';
        card.innerHTML =
            '<div class="card-top">' +
                '<div class="card-head">' +
                    '<div><div class="card-title">' + c.title + '</div><div class="card-instructor">By: ' + (c.instructor || '—') + '</div></div>' +
                    '<span class="badge ' + badgeCls + '">' + c.status + '</span>' +
                '</div>' +
                '<p class="card-desc">' + (c.description || 'No description.') + '</p>' +
                '<div class="prog-label-row"><span>Progress</span><span>' + pct + '%</span></div>' +
                '<div class="prog-bar"><div class="prog-fill" style="width:' + pct + '%"></div></div>' +
            '</div>' +
            '<div class="card-meta">' +
                '<div class="meta-item"><div class="meta-val">' + c.hoursDone + 'h</div><div class="meta-lbl">Done</div></div>' +
                '<div class="meta-item"><div class="meta-val">' + c.totalHours + 'h</div><div class="meta-lbl">Total</div></div>' +
                certMeta +
                '<div class="meta-item"><div class="meta-val">' + ratingStr + '</div><div class="meta-lbl">Rating</div></div>' +
            '</div>' +
            '<div class="card-actions">' +
                '<button class="card-btn card-btn-view"   onclick="openViewModal(' + c.id + ')">' + mainBtnLabel + '</button>' +
                '<button class="card-btn card-btn-edit"   onclick="openEditModal(' + c.id + ')">✏️ Edit</button>' +
                '<button class="card-btn card-btn-delete" onclick="openDeleteModal(' + c.id + ')">🗑 Delete</button>' +
            '</div>';
        grid.appendChild(card);
    });
}
/* ── FILTERS ── */
function applyFilters() {
    var q = document.getElementById('searchInput').value.toLowerCase();
    var filtered = courses.slice();
    if (activeFilter !== 'all') filtered = filtered.filter(function(c){ return c.status === activeFilter; });
    if (q) filtered = filtered.filter(function(c){
        return c.title.toLowerCase().indexOf(q) > -1 ||
               (c.instructor || '').toLowerCase().indexOf(q) > -1 ||
               (c.category || '').toLowerCase().indexOf(q) > -1;
    });
    renderCards(filtered);
}
function setFilter(btn) {
    document.querySelectorAll('.filter-tab').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    activeFilter = btn.dataset.status;
    applyFilters();
}

/* ── ADD MODAL ── */
function openAddModal() {
    document.getElementById('formModalTitle').textContent = '➕ Add New Course';
    document.getElementById('f_action').value = 'course_create';
    document.getElementById('editId').value = '';
    document.getElementById('courseForm').reset();
    document.getElementById('f_action').value = 'course_create';
    document.getElementById('f_hours_done').value = 0;
    clearValidation('courseForm');
    openModal('formModal');
}

/* ── EDIT MODAL ── */
function openEditModal(id) {
    var c = courses.find(function(x){ return x.id === id; });
    if (!c) return;
    document.getElementById('formModalTitle').textContent = '✏️ Edit Course';
    document.getElementById('f_action').value      = 'course_update';
    document.getElementById('editId').value         = id;
    document.getElementById('f_title').value        = c.title;
    document.getElementById('f_category').value     = c.category;
    document.getElementById('f_instructor').value   = c.instructor || '';
    document.getElementById('f_total_hours').value  = c.totalHours;
    document.getElementById('f_status').value       = c.status;
    document.getElementById('f_hours_done').value   = c.hoursDone;
    document.getElementById('f_rating').value       = c.rating || '';
    document.getElementById('f_start_date').value   = c.startDate || '';
    document.getElementById('f_description').value  = c.description || '';
    clearValidation('courseForm');
    closeModal('viewModal');
    openModal('formModal');
}
function openEditFromView() { if (viewingId) openEditModal(viewingId); }

/* ── CUSTOM VALIDATION ── */
function validateCourseForm() {
    var ok = true;
    ok = validateField(document.getElementById('f_title'),       { minLen:3, maxLen:120 }) && ok;
    ok = validateField(document.getElementById('f_category'),    {}) && ok;
    ok = validateField(document.getElementById('f_instructor'),  { minLen:2 }) && ok;
    ok = validateField(document.getElementById('f_total_hours'), { min:1 }) && ok;
    ok = validateField(document.getElementById('f_status'),      {}) && ok;

    var rating = document.getElementById('f_rating').value;
    if (rating !== '' && (parseFloat(rating) < 0 || parseFloat(rating) > 5)) {
        showFieldError('f_rating', 'Rating must be between 0 and 5.');
        ok = false;
    }
    return ok;
}

/* ── SAVE (validate then allow native form submit) ── */
function saveCourse(e) {
    if (!validateCourseForm()) {
        e.preventDefault();
        showToast('Please fix the errors before saving.', true);
        return false;
    }
    return true;
}

/* ── VIEW MODAL ── */
function openViewModal(id) {
    var c = courses.find(function(x){ return x.id === id; });
    if (!c) return;
    viewingId = id;
    var pct      = calcProgress(c);
    var badgeCls = badgeMap[c.status] || '';
    var dateStr  = c.startDate ? new Date(c.startDate).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '—';
    document.getElementById('d_title').textContent        = c.title;
    document.getElementById('d_category').textContent    = c.category;
    document.getElementById('d_instructor').textContent  = c.instructor || '—';
    document.getElementById('d_status').innerHTML        = '<span class="badge ' + badgeCls + '">' + c.status + '</span>';
    document.getElementById('d_hours').textContent       = c.hoursDone + 'h / ' + c.totalHours + 'h';
    document.getElementById('d_rating').textContent      = c.rating ? c.rating + ' / 5 ⭐' : 'Not rated yet';
    document.getElementById('d_start_date').textContent  = dateStr;
    document.getElementById('d_progress_text').textContent = pct + '%';
    document.getElementById('d_prog_fill').style.width   = pct + '%';
    document.getElementById('d_description').textContent = c.description || 'No description provided.';
    openModal('viewModal');
}

/* ── DELETE MODAL ── */
function openDeleteModal(id) {
    var c = courses.find(function(x){ return x.id === id; });
    if (!c) return;
    document.getElementById('deleteMsg').textContent = 'You are about to delete: "' + c.title + '". This cannot be undone.';
    document.getElementById('confirmDeleteBtn').onclick = function() {
        document.getElementById('del_course_id').value = id;
        document.getElementById('delCourseForm').submit();
    };
    openModal('deleteModal');
}

/* ── STATUS CHANGE ── */
function onStatusChange() {
    var s      = document.getElementById('f_status').value;
    var totalH = parseInt(document.getElementById('f_total_hours').value) || 0;
    if (s === 'Completed') document.getElementById('f_hours_done').value = totalH;
    if (s === 'Planned')   document.getElementById('f_hours_done').value = 0;
}

/* ══════════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════════ */
var activeFormTab = 'courses';
function switchFormTab(tab, btn) {
    activeFormTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    document.querySelectorAll('.tab-section').forEach(function(s){ s.classList.remove('active-tab'); });
    document.getElementById('tab-' + tab).classList.add('active-tab');
    var addBtn = document.getElementById('main-add-btn');
    if (tab === 'courses') {
        addBtn.textContent = '＋ Add New Course';
    } else {
        addBtn.textContent = '＋ Add Evaluation';
        populateCourseSelect();
        if (window.updateRatingDonut) window.updateRatingDonut(evaluations);
        renderEvals();
    }
}
function onMainAdd() {
    if (activeFormTab === 'courses') openAddModal();
    else openAddEval();
}

/* ══════════════════════════════════════════
   EVALUATIONS
══════════════════════════════════════════ */

function populateCourseSelect() {
    var sel = document.getElementById('e_course');
    var current = sel.value;
    sel.innerHTML = '<option value="">-- Select course --</option>';
    courses.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.title;
        sel.appendChild(opt);
    });
    sel.value = current;
}

function getCourseTitle(id) {
    var c = courses.find(function(x){ return x.id === parseInt(id); });
    return c ? c.title : '—';
}

function renderStars(r) {
    return '<span class="stars">' + '⭐'.repeat(r) + '</span> <small>(' + r + '/5)</small>';
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderReviewStars(rating) {
    var r = Math.min(5, Math.max(0, parseInt(rating) || 0));
    var stars = '';
    for (var i = 1; i <= 5; i++) {
        stars += i <= r ? '&#9733;' : '&#9734;';
    }
    return stars;
}

function renderStudentReviews(list) {
    var container = document.getElementById('studentReviewsList');
    var empty = document.getElementById('studentReviewsEmpty');
    if (!container || !empty) return;

    container.innerHTML = '';
    empty.style.display = list.length ? 'none' : 'block';

    list.forEach(function(review) {
        var card = document.createElement('article');
        card.className = 'student-review-card';
        card.innerHTML =
            '<div class="student-review-head">' +
                '<div class="student-review-name">' + escapeHtml(review.student || 'Anonymous') + '</div>' +
                '<div class="student-review-date">' + escapeHtml(review.date || '') + '</div>' +
            '</div>' +
            '<div class="student-review-rating">' + renderReviewStars(review.rating) + ' <small>(' + escapeHtml(review.rating || 0) + '/5)</small></div>' +
            '<div class="student-review-comment">' + escapeHtml(review.comment || '') + '</div>' +
            '<div class="student-review-course">Course: ' + escapeHtml(review.courseTitle || getCourseTitle(review.courseId)) + '</div>';
        container.appendChild(card);
    });
}

function updateEvalStats() {
    document.getElementById('s-evals').textContent = evaluations.length;
    var avg = evaluations.length
        ? (evaluations.reduce(function(s,e){ return s + e.rating; }, 0) / evaluations.length).toFixed(1)
        : '—';
    document.getElementById('s-avg-rating').textContent = avg !== '—' ? avg + '/5' : '—';
}

function renderEvals() {
    var q = (document.getElementById('search-evals').value || '').toLowerCase();
    var data = evaluations.filter(function(e) {
        return !q ||
            (e.courseTitle || '').toLowerCase().indexOf(q) > -1 ||
            e.student.toLowerCase().indexOf(q) > -1 ||
            e.comment.toLowerCase().indexOf(q) > -1;
    });
    var tbody = document.getElementById('evals-tbody');
    document.getElementById('evals-empty').style.display = data.length ? 'none' : 'block';
    tbody.innerHTML = '';
    data.forEach(function(ev, i) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + (i + 1) + '</td>' +
            '<td>' + (ev.courseTitle || getCourseTitle(ev.courseId)) + '</td>' +
            '<td>' + ev.student + '</td>' +
            '<td>' + renderStars(ev.rating) + '</td>' +
            '<td style="max-width:260px">' + ev.comment + '</td>' +
            '<td>' + ev.date + '</td>' +
            '<td>' +
                '<button class="btn-act" onclick="openEditEval(' + ev.id + ')" title="Edit">✏️</button>' +
                '<button class="btn-act" onclick="confirmDeleteEval(' + ev.id + ')" title="Delete">🗑</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function openAddEval() {
    populateCourseSelect();
    document.getElementById('evalModalTitle').textContent = '➕ Add Evaluation';
    document.getElementById('e_action').value = 'avis_create';
    document.getElementById('e_id').value = '';
    document.getElementById('evalForm').reset();
    document.getElementById('e_action').value = 'avis_create';
    clearValidation('evalForm');
    openModal('evalModal');
}

function openEditEval(id) {
    var ev = evaluations.find(function(x){ return x.id === id; });
    if (!ev) return;
    populateCourseSelect();
    document.getElementById('evalModalTitle').textContent = '✏️ Edit Evaluation';
    document.getElementById('e_action').value   = 'avis_update';
    document.getElementById('e_id').value       = ev.id;
    document.getElementById('e_course').value   = ev.courseId;
    document.getElementById('e_student').value  = ev.student;
    document.getElementById('e_rating').value   = ev.rating;
    document.getElementById('e_date').value     = ev.date;
    document.getElementById('e_comment').value  = ev.comment;
    clearValidation('evalForm');
    openModal('evalModal');
}

function saveEval(e) {
    var ok = true;
    ok = validateField(document.getElementById('e_course'),  {}) && ok;
    ok = validateField(document.getElementById('e_student'), { minLen:2, maxLen:80 }) && ok;
    ok = validateField(document.getElementById('e_rating'),  {}) && ok;
    ok = validateField(document.getElementById('e_date'),    {}) && ok;
    ok = validateField(document.getElementById('e_comment'), { minLen:5 }) && ok;
    if (!ok) { e.preventDefault(); showToast('Please fix the errors before saving.', true); return false; }
    return true;
}

function confirmDeleteEval(id) {
    var ev = evaluations.find(function(x){ return x.id === id; });
    if (!ev) return;
    document.getElementById('deleteMsg').textContent = 'Delete this evaluation by "' + ev.student + '"? This cannot be undone.';
    document.getElementById('confirmDeleteBtn').onclick = function() {
        document.getElementById('del_avis_id').value = id;
        document.getElementById('delAvisForm').submit();
    };
    openModal('deleteModal');
}

/* ── TOAST FROM URL ── */
(function() {
    var p = new URLSearchParams(window.location.search);
    var msg = p.get('msg');
    var tab = p.get('tab');

    if (tab === 'evaluations') {
        var tabBtn = document.getElementById('tab-btn-evaluations');
        if (tabBtn) switchFormTab('evaluations', tabBtn);
    }

    var toasts = {
        'course_created': 'Course added successfully!',
        'course_updated': 'Course updated successfully!',
        'course_deleted': 'Course deleted!',
        'course_error':   'Failed to save course.',
        'avis_created':   'Evaluation added successfully!',
        'avis_updated':   'Evaluation updated successfully!',
        'avis_deleted':   'Evaluation deleted!',
        'avis_error':     'Failed to save evaluation.',
    };
    if (msg && toasts[msg]) {
        showToast(toasts[msg], msg.indexOf('error') > -1);
        history.replaceState(null, '', window.location.pathname);
    }
})();

/* ── INIT ── */
loadAll();
