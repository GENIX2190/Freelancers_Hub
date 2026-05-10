/* =============================================
   FORMATION-CREATE.JS — Create Course form validation
   Wired to MySQL via FormationController
   ============================================= */

function validateCourseCreateForm() {
    var ok = true;

    ok = validateField(document.getElementById('titre'), {
        minLen: 5,
        maxLen: 150
    }) && ok;

    ok = validateField(document.getElementById('description'), {
        minLen: 50,
        patternMsg: 'Description must be at least 50 characters.'
    }) && ok;

    ok = validateField(document.getElementById('duree'), {
        min: 1
    }) && ok;

    ok = validateField(document.getElementById('prix'), {
        min: 0
    }) && ok;

    ok = validateField(document.getElementById('niveau'), {}) && ok;

    ok = validateField(document.getElementById('categorie'), {}) && ok;

    var imageInput = document.getElementById('image');
    if (imageInput.files && imageInput.files.length > 0) {
        var file     = imageInput.files[0];
        var allowed  = ['image/jpeg', 'image/jpg', 'image/png'];
        var maxBytes = 2 * 1024 * 1024;

        if (allowed.indexOf(file.type) === -1) {
            showFieldError('image', 'Only JPG, JPEG or PNG files are accepted.');
            ok = false;
        } else if (file.size > maxBytes) {
            showFieldError('image', 'File must be smaller than 2 MB.');
            ok = false;
        } else {
            var img = document.getElementById('image');
            img.classList.remove('error');
            var err = img.parentElement.querySelector('.field-error');
            if (err) { err.textContent = ''; err.classList.remove('visible'); }
        }
    }

    return ok;
}

document.getElementById('formationForm').addEventListener('submit', function(e) {
    if (!validateCourseCreateForm()) {
        e.preventDefault();
        return false;
    }
});

/* ── TOAST FROM URL ── */
(function() {
    var p = new URLSearchParams(window.location.search);
    var msg = p.get('msg');
    if (msg === 'course_created') {
        document.getElementById('successBanner').classList.add('show');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(function() {
            window.location.href = 'learn.html';
        }, 1200);
    }
})();
