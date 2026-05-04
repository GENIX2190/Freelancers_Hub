<<<<<<< HEAD
/* =============================================
   CONNEXION.JS — Sign Up form validation
   Freelence Hub
   ============================================= */

function validateSignUpForm() {
    var ok = true;

    /* ID Number — 8 digits */
    ok = validateField(document.getElementById('cin'), {
        minLen: 5,
        maxLen: 20,
        pattern: /^[A-Za-z0-9]+$/,
        patternMsg: 'ID must contain only letters and numbers.'
    }) && ok;

    /* Email */
    ok = validateField(document.getElementById('email'), {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMsg: 'Please enter a valid email address.'
    }) && ok;

    /* Password */
    ok = validateField(document.getElementById('password'), {
        minLen: 6,
        patternMsg: 'Password must be at least 6 characters.'
    }) && ok;

    /* Registration Date — must not be in the future */
    var dateInput = document.getElementById('date_ins');
    if (!dateInput.value) {
        showFieldError('date_ins', 'Registration date is required.');
        ok = false;
    } else if (new Date(dateInput.value) > new Date()) {
        showFieldError('date_ins', 'Date cannot be in the future.');
        ok = false;
    } else {
        dateInput.classList.remove('error');
        var err = dateInput.parentElement.querySelector('.field-error');
        if (err) { err.textContent = ''; err.classList.remove('visible'); }
    }

    /* Role */
    ok = validateField(document.getElementById('role'), {}) && ok;

    /* Photo URL — optional, but if filled must be a URL */
    var photoInput = document.getElementById('photo');
    if (photoInput.value.trim()) {
        ok = validateField(photoInput, {
            pattern: /^https?:\/\/.+/,
            patternMsg: 'Please enter a valid URL starting with http:// or https://',
            required: false
        }) && ok;
    }

    /* Biography — optional, max 500 chars */
    var bioInput = document.getElementById('bio');
    if (bioInput.value.trim().length > 500) {
        showFieldError('bio', 'Biography cannot exceed 500 characters.');
        ok = false;
    }

    return ok;
}

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (validateSignUpForm()) {
        /* Show success — in real app: send to PHP controller via AJAX / form POST */
        document.getElementById('successBanner').classList.add('show');
        this.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
=======
/* =============================================
   CONNEXION.JS — Sign Up form validation
   Freelence Hub
   ============================================= */

function validateSignUpForm() {
    var ok = true;

    /* ID Number — 8 digits */
    ok = validateField(document.getElementById('cin'), {
        minLen: 5,
        maxLen: 20,
        pattern: /^[A-Za-z0-9]+$/,
        patternMsg: 'ID must contain only letters and numbers.'
    }) && ok;

    /* Email */
    ok = validateField(document.getElementById('email'), {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMsg: 'Please enter a valid email address.'
    }) && ok;

    /* Password */
    ok = validateField(document.getElementById('password'), {
        minLen: 6,
        patternMsg: 'Password must be at least 6 characters.'
    }) && ok;

    /* Registration Date — must not be in the future */
    var dateInput = document.getElementById('date_ins');
    if (!dateInput.value) {
        showFieldError('date_ins', 'Registration date is required.');
        ok = false;
    } else if (new Date(dateInput.value) > new Date()) {
        showFieldError('date_ins', 'Date cannot be in the future.');
        ok = false;
    } else {
        dateInput.classList.remove('error');
        var err = dateInput.parentElement.querySelector('.field-error');
        if (err) { err.textContent = ''; err.classList.remove('visible'); }
    }

    /* Role */
    ok = validateField(document.getElementById('role'), {}) && ok;

    /* Photo URL — optional, but if filled must be a URL */
    var photoInput = document.getElementById('photo');
    if (photoInput.value.trim()) {
        ok = validateField(photoInput, {
            pattern: /^https?:\/\/.+/,
            patternMsg: 'Please enter a valid URL starting with http:// or https://',
            required: false
        }) && ok;
    }

    /* Biography — optional, max 500 chars */
    var bioInput = document.getElementById('bio');
    if (bioInput.value.trim().length > 500) {
        showFieldError('bio', 'Biography cannot exceed 500 characters.');
        ok = false;
    }

    return ok;
}

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (validateSignUpForm()) {
        /* Show success — in real app: send to PHP controller via AJAX / form POST */
        document.getElementById('successBanner').classList.add('show');
        this.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
>>>>>>> d5de04e9ab209ea6c5dba55f089ac39e6bc41f9e
