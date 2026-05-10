/* Mission form loaded inside an iframe (candidature page) or standalone */
var API = '../../Controllers/MissionController.php';

function toggleEmbedProgress() {
    var s = document.getElementById('f_status').value;
    var prog = document.getElementById('f_progress');
    if (!prog) return;
    if (s === 'Completed') prog.value = 100;
    if (s === 'Pending') prog.value = 0;
}

function populateEmbedCategories() {
    var sel = document.getElementById('f_category');
    if (!sel) return;
    fetch(API + '?action=list_categories')
        .then(function(r) { return r.json(); })
        .then(function(list) {
            var cur = sel.value;
            sel.innerHTML = '<option value="">-- Select --</option>';
            (Array.isArray(list) ? list : []).forEach(function(c) {
                var opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = (c.icon ? c.icon + ' ' : '') + c.name;
                sel.appendChild(opt);
            });
            sel.value = cur;
        })
        .catch(function() {
            sel.innerHTML = '<option value="">-- Categories unavailable --</option>';
        });
}

function saveEmbedMission(e) {
    var ok = true;
    ok = validateField(document.getElementById('f_title'), { minLen: 3, maxLen: 100 }) && ok;
    ok = validateField(document.getElementById('f_category'), {}) && ok;
    ok = validateField(document.getElementById('f_client'), { minLen: 2 }) && ok;
    ok = validateField(document.getElementById('f_contact_email'), {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMsg: 'Enter a valid contact email.'
    }) && ok;
    ok = validateField(document.getElementById('f_budget'), { min: 0 }) && ok;
    ok = validateField(document.getElementById('f_status'), {}) && ok;
    ok = validateField(document.getElementById('f_deadline'), {}) && ok;
    var prog = parseInt(document.getElementById('f_progress').value, 10);
    if (isNaN(prog) || prog < 0 || prog > 100) {
        showFieldError('f_progress', 'Enter a value from 0 to 100.');
        ok = false;
    }
    if (!ok) {
        e.preventDefault();
        showToast('Please fix the errors.', true);
        return false;
    }
    return true;
}

(function initEmbed() {
    populateEmbedCategories();
    if (typeof initDateInputsMinToday === 'function') {
        initDateInputsMinToday();
    } else if (typeof dateInputTodayISO === 'function') {
        var fd0 = document.getElementById('f_deadline');
        if (fd0) fd0.min = dateInputTodayISO();
    }

    var params = new URLSearchParams(window.location.search);
    var msg = params.get('msg');
    if (msg === 'created') {
        var s = document.getElementById('embedSuccess');
        var err = document.getElementById('embedError');
        if (err) err.style.display = 'none';
        if (s) s.style.display = 'block';
        var form = document.getElementById('missionEmbedForm');
        if (form) {
            form.reset();
            document.getElementById('f_progress').value = 0;
            populateEmbedCategories();
        }
        try {
            window.parent.postMessage({ type: 'fh-mission-created' }, '*');
        } catch (ignore) {}
        history.replaceState(null, '', window.location.pathname);
    } else if (msg === 'error') {
        var s2 = document.getElementById('embedSuccess');
        var e2 = document.getElementById('embedError');
        if (s2) s2.style.display = 'none';
        if (e2) e2.style.display = 'block';
        showToast('Could not save mission.', true);
        history.replaceState(null, '', window.location.pathname);
    }
})();
