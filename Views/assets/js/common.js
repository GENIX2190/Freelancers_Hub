/* =============================================
   COMMON.JS — Shared utilities across all pages
   Freelence Hub
   ============================================= */

/* ── MODAL UTILITIES ── */
function openModal(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
}
function closeOnOverlay(e, id) {
    if (e.target === document.getElementById(id)) closeModal(id);
}

/* Close any open modal on ESC key */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(function(m) {
            m.classList.remove('open');
        });
        document.body.style.overflow = '';
    }
});

/* ── TOAST NOTIFICATION ── */
function showToast(msg, isError) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = 'toast' + (isError ? ' error' : '');
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3200);
}

/* ── DATE INPUTS: minimum = today (local date, YYYY-MM-DD) ── */
function dateInputTodayISO() {
    var t = new Date();
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}

/**
 * Sets min=today on all date inputs.
 * Use data-allow-past on a field to skip (e.g. historical registration / application dates in admin edit).
 */
function initDateInputsMinToday(root) {
    var r = root || document;
    var iso = dateInputTodayISO();
    r.querySelectorAll('input[type="date"]:not([data-allow-past]):not([data-up-to-today])').forEach(function(el) {
        el.min = iso;
    });
}

/** Registration-style dates: any day up to today (no min), max=today, default today if empty. */
function initDateInputsUpToToday(root) {
    var r = root || document;
    var iso = dateInputTodayISO();
    r.querySelectorAll('input[type="date"][data-up-to-today]').forEach(function(el) {
        el.removeAttribute('min');
        el.max = iso;
        if (!el.value.trim()) el.value = iso;
    });
}

function runAllDateInputInits() {
    initDateInputsMinToday();
    initDateInputsUpToToday();
}

function scheduleInitDateInputsMinToday() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllDateInputInits);
    } else {
        runAllDateInputInits();
    }
}
scheduleInitDateInputsMinToday();

window.dateInputTodayISO = dateInputTodayISO;
window.initDateInputsMinToday = initDateInputsMinToday;
window.initDateInputsUpToToday = initDateInputsUpToToday;

/* ── CUSTOM FORM VALIDATION (no HTML5 required) ── */

/** Shown when value &lt; input.min (same styling as other field errors). */
var DATE_EXPIRED_MSG = 'This date has expired. Choose today or a future date.';
/** Shown when value &gt; input.max (e.g. registration date in the future). */
var DATE_FUTURE_MSG = 'This date cannot be in the future.';

/**
 * Live check for date inputs (change/blur). Uses .error + .field-error like validateField.
 */
function validateDateInputLive(input) {
    if (!input || input.type !== 'date') return;
    var v = input.value.trim();
    var dmin = input.getAttribute('min');
    var dmax = input.getAttribute('max');
    var errorEl = input.parentElement && input.parentElement.querySelector('.field-error');
    if (!dmin && !dmax) return;
    if (!v) {
        if (errorEl && (errorEl.textContent === DATE_EXPIRED_MSG || errorEl.textContent === DATE_FUTURE_MSG)) {
            errorEl.textContent = '';
            errorEl.classList.remove('visible');
            input.classList.remove('error');
        }
        return;
    }
    var msg = '';
    if (dmin && v < dmin) msg = DATE_EXPIRED_MSG;
    else if (dmax && v > dmax) msg = DATE_FUTURE_MSG;
    if (msg) {
        input.classList.add('error');
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.add('visible');
        }
    } else {
        if (errorEl && (errorEl.textContent === DATE_EXPIRED_MSG || errorEl.textContent === DATE_FUTURE_MSG)) {
            errorEl.textContent = '';
            errorEl.classList.remove('visible');
        }
        input.classList.remove('error');
    }
}

document.addEventListener('change', function(e) {
    var t = e.target;
    if (t && t.matches && t.matches('input[type="date"]')) validateDateInputLive(t);
});
document.addEventListener('blur', function(e) {
    var t = e.target;
    if (t && t.matches && t.matches('input[type="date"]')) validateDateInputLive(t);
}, true);

window.DATE_EXPIRED_MSG = DATE_EXPIRED_MSG;
window.DATE_FUTURE_MSG = DATE_FUTURE_MSG;
window.validateDateInputLive = validateDateInputLive;

/**
 * Validate a single field.
 * Rules object: { minLen, maxLen, pattern, patternMsg, match, matchLabel }
 */
function validateField(input, rules) {
    var errorEl = input.parentElement.querySelector('.field-error');
    var value   = input.value.trim();
    var msg     = '';

    rules = rules || {};

    if (!value && rules.required !== false) {
        msg = 'This field is required.';
    } else if (value && rules.minLen && value.length < rules.minLen) {
        msg = 'Minimum ' + rules.minLen + ' characters required.';
    } else if (value && rules.maxLen && value.length > rules.maxLen) {
        msg = 'Maximum ' + rules.maxLen + ' characters allowed.';
    } else if (value && rules.pattern && !rules.pattern.test(value)) {
        msg = rules.patternMsg || 'Invalid format.';
    } else if (value && rules.min !== undefined && parseFloat(value) < rules.min) {
        msg = 'Minimum value is ' + rules.min + '.';
    } else if (value && rules.max !== undefined && parseFloat(value) > rules.max) {
        msg = 'Maximum value is ' + rules.max + '.';
    } else if (rules.match && value !== rules.match) {
        msg = rules.matchLabel || 'Fields do not match.';
    } else if (value && input.type === 'date') {
        var dmin = input.getAttribute('min');
        var dmax = input.getAttribute('max');
        if (dmin && value < dmin) msg = DATE_EXPIRED_MSG;
        else if (dmax && value > dmax) msg = DATE_FUTURE_MSG;
    }

    if (msg) {
        input.classList.add('error');
        if (errorEl) { errorEl.textContent = msg; errorEl.classList.add('visible'); }
        return false;
    } else {
        input.classList.remove('error');
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
        return true;
    }
}

/**
 * Clear all validation errors inside a container (form or modal).
 */
function clearValidation(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.error').forEach(function(el) { el.classList.remove('error'); });
    container.querySelectorAll('.field-error').forEach(function(el) {
        el.textContent = '';
        el.classList.remove('visible');
    });
}

/**
 * Show a field-level error programmatically.
 */
function showFieldError(inputId, message) {
    var input   = document.getElementById(inputId);
    var errorEl = input ? input.parentElement.querySelector('.field-error') : null;
    if (input)   input.classList.add('error');
    if (errorEl) { errorEl.textContent = message; errorEl.classList.add('visible'); }
}

/* ── NAV DROPDOWN TOGGLE ── */
document.addEventListener('DOMContentLoaded', function() {
    var dropdowns = document.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(function(dd) {
        var btn = dd.querySelector('.nav-dropdown-btn');
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                dropdowns.forEach(function(other) {
                    if (other !== dd) other.classList.remove('open');
                });
                dd.classList.toggle('open');
            });
        }
    });
    document.addEventListener('click', function() {
        dropdowns.forEach(function(dd) { dd.classList.remove('open'); });
    });
    /* Mark active nav link */
    var currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('nav a, .nav-dropdown-menu a').forEach(function(a) {
        if (a.getAttribute('href') === currentPage) a.classList.add('active');
    });
});

/* ── CLEAR ERRORS ON INPUT ── */
document.addEventListener('input', function(e) {
    var input = e.target;
    if (input.classList.contains('error')) {
        input.classList.remove('error');
        var errorEl = input.parentElement.querySelector('.field-error');
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
    }
});
document.addEventListener('change', function(e) {
    var input = e.target;
    if (input.classList.contains('error')) {
        input.classList.remove('error');
        var errorEl = input.parentElement.querySelector('.field-error');
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
    }
});

/* ── Session idle timeout (server): JSON API helper ── */
function fhSessionExpiredUrl() {
    var m = document.querySelector('meta[name="fh-session-expired"]');
    if (m && m.content) return m.content;
    return '../users/session_expired.html';
}

/** Use with fetch(): returns parsed JSON, or redirects to session-expired page on 401. */
function fhJsonFromResponse(r) {
    if (r.status === 401) {
        return r.json().catch(function () { return {}; }).then(function () {
            window.location.href = fhSessionExpiredUrl();
            return Promise.reject(new Error('session_expired'));
        });
    }
    if (!r.ok) {
        return Promise.reject(new Error('http_' + r.status));
    }
    return r.json();
}

/* ── SMOOTH PAGE TRANSITIONS ── */
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('header nav a, .sidebar-nav a, .side-nav a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (!href || href === '#' || href.startsWith('javascript:')) return;
            
            e.preventDefault();
            document.body.style.opacity = '0';
            document.body.style.transform = 'translateY(-10px)';
            document.body.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            
            setTimeout(function() {
                window.location.href = href;
            }, 300);
        });
    });
});
