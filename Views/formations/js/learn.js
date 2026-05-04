var API = '../../Controllers/FormationController.php';
var courses = [];
var currentCategory = 'tous';

/* ══════════════════════════════════════
   UTILITAIRES
══════════════════════════════════════ */
function renderStars(rating) {
    var r = Math.min(5, Math.max(0, parseInt(rating) || 0));
    var html = '<span style="color:#f5a623;font-size:1.1rem;letter-spacing:2px;">';
    for (var i = 1; i <= 5; i++) { html += i <= r ? '★' : '☆'; }
    html += '</span>';
    return html;
}

/* ══════════════════════════════════════
   DONUT CHART — Distribution des notes
══════════════════════════════════════ */
function renderRatingStats(list) {
    var counts = [0, 0, 0, 0, 0]; // index 0 = 1★ … index 4 = 5★
    list.forEach(function(r) {
        var n = parseInt(r.rating);
        if (n >= 1 && n <= 5) counts[n - 1]++;
    });

    var total = list.length;
    var avg   = total
        ? (list.reduce(function(s, r) { return s + (parseInt(r.rating) || 0); }, 0) / total).toFixed(1)
        : '—';

    var colors = ['#E24B4A', '#D85A30', '#EF9F27', '#378ADD', '#1D9E75'];
    // 1★ rouge, 2★ orange, 3★ ambre, 4★ bleu, 5★ vert

    /* ── Donut SVG ── */
    var r = 70, cx = 90, cy = 90, strokeW = 28;
    var circ = 2 * Math.PI * r;
    var offset = 0;
    var arcs = '';
    var gap = total > 0 ? 2 : 0;

    if (total === 0) {
        arcs = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r +
               '" fill="none" stroke="#e5e7eb" stroke-width="' + strokeW + '"' +
               ' stroke-dasharray="' + circ + '" stroke-dashoffset="0"/>';
    } else {
        for (var si = 4; si >= 0; si--) {
            var cnt = counts[si];
            if (cnt === 0) continue;
            var frac   = cnt / total;
            var arcLen = Math.max(0, frac * circ - gap);
            arcs += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"' +
                    ' fill="none"' +
                    ' stroke="' + colors[si] + '"' +
                    ' stroke-width="' + strokeW + '"' +
                    ' stroke-dasharray="' + arcLen + ' ' + (circ - arcLen) + '"' +
                    ' stroke-dashoffset="' + (circ - offset) + '"' +
                    ' stroke-linecap="butt"/>';
            offset += frac * circ;
        }
    }

    var svgHtml =
        '<div style="position:relative;width:180px;height:180px;flex-shrink:0;">' +
            '<svg viewBox="0 0 180 180" width="180" height="180"' +
            ' style="transform:rotate(-90deg);display:block;">' + arcs + '</svg>' +
            '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;">' +
                '<div style="font-size:28px;font-weight:700;color:#111;line-height:1;">' + avg + '</div>' +
                '<div style="font-size:12px;color:#6b7280;margin-top:2px;">' + total + ' avis</div>' +
            '</div>' +
        '</div>';

    var chartEl = document.getElementById('ratingChart');
    if (chartEl) chartEl.innerHTML = svgHtml;

    /* ── Barres latérales ── */
    var labels = ['1★', '2★', '3★', '4★', '5★'];
    var barsHtml = '';
    for (var bi = 4; bi >= 0; bi--) {
        var pct = total ? Math.round((counts[bi] / total) * 100) : 0;
        barsHtml +=
            '<div style="display:flex;align-items:center;gap:8px;">' +
                '<span style="font-size:0.85rem;width:28px;text-align:right;color:#374151;">' + labels[bi] + '</span>' +
                '<div style="flex:1;background:#f3f4f6;border-radius:99px;height:10px;">' +
                    '<div style="width:' + pct + '%;background:' + colors[bi] + ';height:10px;border-radius:99px;transition:width 0.4s;"></div>' +
                '</div>' +
                '<span style="font-size:0.8rem;color:#888;width:48px;">' + pct + '% (' + counts[bi] + ')</span>' +
            '</div>';
    }
    var barsEl = document.getElementById('ratingBars');
    if (barsEl) barsEl.innerHTML = barsHtml;
}

/* ══════════════════════════════════════
   VALIDATION FORMULAIRE AVIS
══════════════════════════════════════ */
function verif(form) {
    var input = form
        ? form.querySelector('input[name="rating"]')
        : document.querySelector('input[name="rating"]');
    if (!input) return true;
    var a = Number(input.value);
    if (!a || a < 1 || a > 5) {
        alert("La note doit être entre 1 et 5 !");
        return false;
    }
    return true;
}

/* ══════════════════════════════════════
   CHARGEMENT DONNÉES
══════════════════════════════════════ */
function loadAll() {
    fetch(API + '?action=list_formations').then(function(r) {
        return r.json();
    }).then(function(results) {
        courses = results || [];
        renderCourses(courses);
    }).catch(function() {
        document.getElementById('noCourses').style.display = 'block';
    });
}

/* ══════════════════════════════════════
   RENDU COURS
══════════════════════════════════════ */
function renderCourses(list) {
    var grid  = document.getElementById('videosContainer');
    var noMsg = document.getElementById('noCourses');
    grid.innerHTML = '';

    if (!list.length) {
        grid.appendChild(noMsg);
        noMsg.style.display = 'block';
        return;
    }
    noMsg.style.display = 'none';

    list.forEach(function(c) {
        var levelMap = { 'debutant': 'Beginner', 'intermediaire': 'Intermediate', 'avance': 'Advanced' };
        var level    = levelMap[c.niveau] || c.niveau || c.status || '—';
        var pct      = c.totalHours ? Math.min(100, Math.round((c.hoursDone / c.totalHours) * 100)) : 0;
        if (c.status === 'Completed') pct = 100;
        var ratingStr = c.rating ? '⭐ ' + c.rating + '/5' : '';

        var card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.category = (c.category || '').toLowerCase();
        card.innerHTML =
            '<div class="video-thumbnail">📚<div class="play-button">' + pct + '%</div></div>' +
            '<div class="video-content">' +
                '<span class="video-category">' + (c.category || 'Other') + '</span>' +
                '<div class="video-title">' + c.title + '</div>' +
                '<p class="video-description">' + (c.description || 'No description.') + '</p>' +
                '<div class="video-meta">' +
                    '<span class="video-duration">⏱️ ' + c.totalHours + 'h</span>' +
                    '<span class="video-level">' + level + '</span>' +
                    (c.prix ? '<span class="video-level">💰 ' + Number(c.prix).toLocaleString() + ' €</span>' : '') +
                    (ratingStr ? '<span class="video-level">' + ratingStr + '</span>' : '') +
                '</div>' +
                (c.instructor ? '<div style="margin-top:6px;font-size:0.85rem;color:#666;">By: ' + c.instructor + '</div>' : '') +
                '<form class="course-review-form" method="POST" action="../../Controllers/FormationController.php" onsubmit="return verif(this)" onclick="event.stopPropagation()">' +
                    '<input type="hidden" name="form_action" value="avis_create">' +
                    '<input type="hidden" name="student" value="">' +
                    '<input type="hidden" name="formation_id" value="' + c.id + '">' +
                    '<div class="review-form-title">Leave a review for this course</div>' +
                    '<label>Rating (1-5)</label>' +
                    '<input type="number" name="rating" min="1" max="5" placeholder="Example: 5">' +
                    '<label>Comment</label>' +
                    '<textarea name="comment" rows="3" placeholder="Share your experience..."></textarea>' +
                    '<button type="submit">Submit Review</button>' +
                '</form>' +
            '</div>';
        card.addEventListener('click', function() {
            document.querySelectorAll('.video-card.review-open').forEach(function(openCard) {
                if (openCard !== card) openCard.classList.remove('review-open');
            });
            card.classList.toggle('review-open');
        });
        grid.appendChild(card);
    });
}

/* ══════════════════════════════════════
   RENDU AVIS
══════════════════════════════════════ */
function renderReviews(list) {
    var container = document.getElementById('reviewsContainer');
    var noMsg     = document.getElementById('noReviews');
    container.innerHTML = '';

    if (!list.length) {
        container.appendChild(noMsg);
        noMsg.style.display = 'block';
        return;
    }
    noMsg.style.display = 'none';

    list.forEach(function(r) {
        var stars = renderStars(r.rating);
        var div   = document.createElement('div');
        div.style.cssText = 'background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.06);';
        div.innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                '<strong>' + (r.student || 'Anonymous') + '</strong>' +
                '<span style="font-size:0.85rem;color:#888;">' + r.date + '</span>' +
            '</div>' +
            '<div style="margin-bottom:6px;">' + stars + ' <small>(' + r.rating + '/5)</small></div>' +
            '<div style="font-size:0.9rem;color:#555;margin-bottom:6px;">' + (r.comment || '') + '</div>' +
            '<div style="font-size:0.82rem;color:#999;">Course: ' + (r.courseTitle || '—') + '</div>';
        container.appendChild(div);
    });
}

/* ══════════════════════════════════════
   FILTRES CATÉGORIES
══════════════════════════════════════ */
function filterCourses(category, btn) {
    currentCategory = category;
    document.querySelectorAll('.category-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');

    if (category === 'tous') {
        renderCourses(courses);
    } else {
        var filtered = courses.filter(function(c) {
            return (c.category || '').toLowerCase().indexOf(category.toLowerCase()) > -1;
        });
        renderCourses(filtered);
    }
}

function goToQuiz() {
    window.location.href = 'quiz.html?category=' + encodeURIComponent(currentCategory);
}

/* ══════════════════════════════════════
   INIT CATÉGORIE DEPUIS URL
══════════════════════════════════════ */
(function() {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('category');
    if (cat && cat !== 'tous') {
        var btns    = document.querySelectorAll('.category-btn');
        var matched = null;
        btns.forEach(function(b) {
            var onclick = b.getAttribute('onclick');
            if (onclick && onclick.indexOf("'" + cat + "'") !== -1) matched = b;
        });
        if (matched) {
            currentCategory = cat;
            document.querySelectorAll('.category-btn').forEach(function(b) { b.classList.remove('active'); });
            matched.classList.add('active');
        }
    }
})();

loadAll();
