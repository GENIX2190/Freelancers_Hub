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

/* ── CUSTOM FORM VALIDATION (no HTML5 required) ── */

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
