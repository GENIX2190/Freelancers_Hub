/* =============================================
   CANDIDATURE.JS — Public missions + apply form
   Wired to MySQL via MissionController
   ============================================= */

var missions = [];
var categories = [];
var currentMissionId = null;
var API = '../../Controllers/MissionController.php';

function activateFilterButton(btn) {
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
}

/* ── CATEGORY FILTER BUTTONS (same API as missions dashboard) ── */
function renderCategoryFilterButtons() {
    var wrap = document.getElementById('categoryFilterBtns');
    if (!wrap) return;
    wrap.innerHTML = '';
    var sorted = categories.slice().sort(function(a, b) {
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    });
    sorted.forEach(function(c) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-btn';
        var label = (c.icon ? c.icon + ' ' : '🏷️ ') + (c.name || '');
        btn.textContent = label;
        btn.addEventListener('click', function() {
            filterMissionsByCategoryId(c.id, btn);
        });
        wrap.appendChild(btn);
    });
}

/* ── LOAD MISSIONS + CATEGORIES FROM DB ── */
function loadMissions() {
    fetch(API + '?action=list_missions')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            missions = data;
            renderMissionCards(missions);
            return fetch(API + '?action=list_categories')
                .then(function(r) { return r.json(); })
                .then(function(catData) {
                    categories = Array.isArray(catData) ? catData : [];
                    renderCategoryFilterButtons();
                })
                .catch(function() {
                    categories = [];
                    renderCategoryFilterButtons();
                });
        })
        .catch(function() {
            document.getElementById('noMissions').style.display = 'block';
        });
}

/* ── RENDER MISSION CARDS ── */
function renderMissionCards(list) {
    var grid = document.getElementById('missionsGrid');
    var noMsg = document.getElementById('noMissions');
    grid.innerHTML = '';

    if (!list.length) {
        grid.appendChild(noMsg);
        noMsg.style.display = 'block';
        return;
    }
    noMsg.style.display = 'none';

    list.forEach(function(m) {
        var isUrgent = m.priority === 'Urgent';
        var card = document.createElement('div');
        card.className = 'mission-card';
        card.dataset.category = (m.category || '').toLowerCase().replace(/[^a-z]/g, '');

        card.innerHTML =
            '<div class="card-top">' +
                '<span class="category-badge">' + (m.category || 'Other') + '</span>' +
                '<span class="status-badge ' + (isUrgent ? 'urgent' : 'open') + '">' + (isUrgent ? '🔥 Urgent' : '📋 ' + m.status) + '</span>' +
            '</div>' +
            '<div class="mission-title">' + m.title + '</div>' +
            '<p class="mission-desc">' + (m.description || 'No description.') + '</p>' +
            '<div class="mission-meta">' +
                '<div class="meta-item"><span class="icon">💰</span><strong>' + Number(m.budget || 0).toLocaleString() + ' €</strong></div>' +
                (m.deadline ? '<div class="meta-item"><span class="icon">⏳</span><strong>' + m.deadline + '</strong></div>' : '') +
                (m.client ? '<div class="meta-item"><span class="icon">👤</span>' + m.client + '</div>' : '') +
            '</div>' +
            '<button class="btn-postuler" onclick="openModal(' + m.id + ')">Apply to this mission</button>';

        grid.appendChild(card);
    });
}

/* ── MODAL ── */
function openModal(missionId) {
    var m = missions.find(function(x) { return x.id === missionId; });
    if (!m) return;
    currentMissionId = missionId;
    document.getElementById('modalMissionTitle').textContent = 'Mission: ' + m.title;
    document.getElementById('h_mission_id').value = missionId;
    document.getElementById('formView').style.display = 'block';
    document.getElementById('successView').style.display = 'none';
    document.getElementById('candidatureForm').reset();
    document.getElementById('h_mission_id').value = missionId;
    document.getElementById('charCount').textContent = '0';
    clearAllErrors();

    var submitBtn = document.querySelector('#candidatureForm .btn-submit-form');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send my application →';
    }

    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function closeModalOnOverlay(e) {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
}

/* ── CHAR COUNT ── */
function updateCharCount(el) {
    document.getElementById('charCount').textContent = el.value.length;
}

/* ── FILTER / SEARCH ── */
function filterMissions(category, btn) {
    activateFilterButton(btn);
    if (category === 'tous') {
        renderMissionCards(missions);
    } else {
        var needle = (category || '').toLowerCase();
        var filtered = missions.filter(function(m) {
            return (m.category || '').toLowerCase().indexOf(needle) > -1;
        });
        renderMissionCards(filtered);
    }
}

function filterMissionsByCategoryId(catId, btn) {
    activateFilterButton(btn);
    var id = Number(catId);
    var filtered = missions.filter(function(m) {
        return Number(m.categorie_id) === id;
    });
    renderMissionCards(filtered);
}

function searchMissions(query) {
    var q = query.toLowerCase();
    if (!q) { renderMissionCards(missions); return; }
    var filtered = missions.filter(function(m) {
        return m.title.toLowerCase().indexOf(q) > -1 ||
               (m.description || '').toLowerCase().indexOf(q) > -1 ||
               (m.client || '').toLowerCase().indexOf(q) > -1 ||
               (m.category || '').toLowerCase().indexOf(q) > -1;
    });
    renderMissionCards(filtered);
}

/* ── CLEAR INLINE ERRORS ── */
function clearAllErrors() {
    document.querySelectorAll('#candidatureForm .field-error').forEach(function(el) {
        el.textContent = ''; el.classList.remove('visible');
    });
    document.querySelectorAll('#candidatureForm input, #candidatureForm select, #candidatureForm textarea').forEach(function(el) {
        el.classList.remove('error');
    });
}

/* ── CUSTOM VALIDATION ── */
function validateCandidatureForm() {
    var ok = true;
    ok = validateField(document.getElementById('prenom'), { minLen:2, maxLen:50 }) && ok;
    ok = validateField(document.getElementById('nom'), { minLen:2, maxLen:50 }) && ok;
    ok = validateField(document.getElementById('email'), { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg: 'Please enter a valid email address.' }) && ok;
    ok = validateField(document.getElementById('tarif'), { min: 1 }) && ok;
    ok = validateField(document.getElementById('delai'), { min: 1 }) && ok;
    ok = validateField(document.getElementById('experience'), {}) && ok;

    var portfolio = document.getElementById('portfolio');
    if (portfolio.value.trim()) {
        ok = validateField(portfolio, { pattern: /^https?:\/\/.+/, patternMsg: 'Must start with http:// or https://', required: false }) && ok;
    }

    var lettre = document.getElementById('lettre');
    var minLettre = 15;
    if (!lettre.value.trim()) { showFieldError('lettre', 'Cover letter is required.'); ok = false; }
    else if (lettre.value.trim().length < minLettre) {
        showFieldError('lettre', 'At least ' + minLettre + ' characters (short text blocks submit — no email is sent).');
        ok = false;
    }
    else if (lettre.value.length > 800) { showFieldError('lettre', 'Max 800 characters.'); ok = false; }

    return ok;
}

/* ── SUBMIT ── */
function submitCandidature(e) {
    if (!validateCandidatureForm()) { e.preventDefault(); return false; }

    var prenom = document.getElementById('prenom').value.trim();
    var nom = document.getElementById('nom').value.trim();
    var email = document.getElementById('email').value.trim();
    var tarif = document.getElementById('tarif').value.trim();
    var delai = document.getElementById('delai').value.trim();
    var exp = document.getElementById('experience').value;
    var portfolio = document.getElementById('portfolio').value.trim();
    var lettre = document.getElementById('lettre').value.trim();

    document.getElementById('h_name').value = prenom + ' ' + nom;
    document.getElementById('h_email').value = email;
    document.getElementById('h_experience').value = exp;
    document.getElementById('h_rate').value = tarif;
    document.getElementById('h_message').value = lettre + (portfolio ? '\n\nPortfolio: ' + portfolio : '') + '\nDelivery: ' + delai + ' days';
    document.getElementById('h_mission_id').value = currentMissionId;

    var submitBtn = document.querySelector('#candidatureForm .btn-submit-form');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
    }

    return true;
}

/* ── ESC KEY ── */
document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    var embed = document.getElementById('missionEmbedOverlay');
    if (embed && embed.classList.contains('open')) {
        closeAddMissionIframe();
        return;
    }
    closeModal();
});

/* ── ADD MISSION IFRAME (backend form) ── */
function openAddMissionIframe() {
    var overlay = document.getElementById('missionEmbedOverlay');
    var frame = document.getElementById('missionEmbedFrame');
    if (!overlay || !frame) return;
    frame.src = 'mission-embed.html?t=' + Date.now();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeAddMissionIframe() {
    var overlay = document.getElementById('missionEmbedOverlay');
    var frame = document.getElementById('missionEmbedFrame');
    if (overlay) overlay.classList.remove('open');
    if (frame) frame.src = 'about:blank';
    document.body.style.overflow = '';
}

function closeMissionEmbedOnOverlay(e) {
    if (e.target === document.getElementById('missionEmbedOverlay')) closeAddMissionIframe();
}

window.addEventListener('message', function(ev) {
    if (!ev.data || ev.data.type !== 'fh-mission-created') return;
    showToast('Mission published — list updated.');
    loadMissions();
    setTimeout(function() { closeAddMissionIframe(); }, 900);
});

loadMissions();
