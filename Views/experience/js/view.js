/* ════════════ EXPERIENCE VIEW (User) JS — dynamic ════════════ */

var API = '../../Controllers/ExperienceController.php';
var posts = [], replies = [];

var REACTION_ORDER = ['like', 'love', 'haha', 'sad', 'thanks'];
var REACTION_LABELS = { like: 'Like', love: 'Love', haha: 'Haha', sad: 'Sad', thanks: 'Thanks' };

function getVisitorKey() {
    var k = localStorage.getItem('fh_exp_visitor');
    if (!k || k.length < 8) {
        k = 'v_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
        localStorage.setItem('fh_exp_visitor', k);
    }
    return k;
}

/** Small inline SVG icons (Facebook-style cues) */
function reactionIconSvg(kind, size) {
    var s = size || 20;
    var svgs = {
        like: '<svg xmlns="http://www.w3.org/2000/svg" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877f2" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>',
        love: '<svg xmlns="http://www.w3.org/2000/svg" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true"><path fill="#f02849" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
        haha: '<svg xmlns="http://www.w3.org/2000/svg" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#ffda6b"/><path fill="#050505" d="M8.5 9.5a1.25 1.25 0 1 1 0 .01v-.01zm7 0a1.25 1.25 0 1 1 0 .01v-.01zm-7.3 6.2c1.35 1.8 3.55 2.1 5.6 1.3.45-.18.65-.7.45-1.15-.2-.45-.73-.62-1.18-.45-1.5.55-3.08.35-4.05-.82-.35-.4-.95-.45-1.35-.1-.4.35-.45.95-.1 1.35.05.1.1.15.15.2l-.52-.33z"/></svg>',
        sad: '<svg xmlns="http://www.w3.org/2000/svg" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#5890ff"/><path fill="#fff" d="M8.5 9.5a1.25 1.25 0 1 1 0 .01v-.01zm7 0a1.25 1.25 0 1 1 0 .01v-.01z"/><path fill="#fff" d="M15.2 15.7c-1.85-1.2-4.55-1.2-6.4 0-.4.25-.5.78-.25 1.18.25.4.78.5 1.18.25 1.35-.85 3.12-.85 4.47 0 .4.25.93.15 1.18-.25.25-.4.15-.93-.25-1.18l.07.05z"/></svg>',
        thanks: '<svg xmlns="http://www.w3.org/2000/svg" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true"><path fill="#8b5cf6" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
    };
    return svgs[kind] || svgs.like;
}

function reactionTotal(counts) {
    var t = 0;
    REACTION_ORDER.forEach(function (k) { t += counts[k] || 0; });
    return t;
}

function buildReactionSummaryHtml(counts) {
    var parts = [];
    REACTION_ORDER.forEach(function (k) {
        var n = counts[k] || 0;
        if (n > 0) {
            parts.push('<span class="reaction-summary-item">' + reactionIconSvg(k, 16) + '<span>' + n + '</span></span>');
        }
    });
    if (!parts.length) {
        return '<span class="reaction-summary-muted">Be the first to react</span>';
    }
    return parts.join('');
}

function buildReactionPickerHtml(postId, counts, mine) {
    var html = '<div class="reaction-picker" role="group" aria-label="React to post">';
    REACTION_ORDER.forEach(function (k) {
        var active = mine === k ? ' is-active' : '';
        var label = REACTION_LABELS[k];
        html += '<button type="button" class="reaction-btn' + active + '" data-pid="' + postId + '" data-r="' + k + '" title="' + label + '" aria-label="' + label + '">' + reactionIconSvg(k, 22) + '</button>';
    });
    html += '</div>';
    return html;
}

function sendReaction(postId, kind) {
    var fd = new FormData();
    fd.append('form_action', 'post_reaction');
    fd.append('post_id', String(postId));
    fd.append('reaction', kind);
    fd.append('visitor_key', getVisitorKey());
    fetch(API, { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data.ok) {
                showToast('Could not save reaction. Try again.');
                return;
            }
            var p = posts.find(function (x) { return x.id === postId; });
            if (p) {
                p.reactions = { counts: data.counts, mine: data.mine };
            }
            renderPosts();
        })
        .catch(function () {
            showToast('Network error.');
        });
}

document.addEventListener('click', function (e) {
    var btn = e.target.closest('.reaction-btn');
    if (!btn || !btn.getAttribute('data-r')) return;
    var pid = parseInt(btn.getAttribute('data-pid'), 10);
    var r = btn.getAttribute('data-r');
    if (pid && r) sendReaction(pid, r);
});

var catBadge = {'Tech Tips':'badge-tech','Career Advice':'badge-career','Project Story':'badge-project','Life as Freelancer':'badge-life','Tutorial':'badge-tutorial'};

function getInitials(name){ return (name||'?').split(' ').map(function(w){return w[0];}).join('').toUpperCase(); }
function getPostReplies(pid){ return replies.filter(function(r){return r.postId===pid;}); }

function showToast(msg){
    var t=document.getElementById('toast');
    t.textContent=msg; t.classList.add('show');
    setTimeout(function(){t.classList.remove('show');},3000);
}

/* ════════════ MODAL FUNCTIONS ════════════ */
function openModal(modalId) {
    var modal = document.getElementById(modalId);
    modal.classList.add('open');
    if (modalId === 'postModal') {
        resetPostForm();
        setDefaultDate();
    }
}

function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    modal.classList.remove('open');
}

function setDefaultDate() {
    var dateInput = document.getElementById('p_date');
    if (!dateInput.value) {
        var today = new Date();
        var year = today.getFullYear();
        var month = String(today.getMonth() + 1).padStart(2, '0');
        var day = String(today.getDate()).padStart(2, '0');
        dateInput.value = year + '-' + month + '-' + day;
    }
}

function resetPostForm() {
    document.getElementById('postForm').reset();
    document.getElementById('p_action').value = 'post_create';
    document.getElementById('p_id').value = '';
    document.getElementById('postModalTitle').textContent = '➕ Add Post';
    clearPostErrors();
}

function clearPostErrors() {
    var form = document.getElementById('postForm');
    var errors = form.querySelectorAll('.field-error');
    errors.forEach(function(err) { err.textContent = ''; });
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function(inp) { inp.classList.remove('error'); });
}

function savePost(e) {
    e.preventDefault();
    clearPostErrors();
    
    var title = document.getElementById('p_title').value.trim();
    var category = document.getElementById('p_category').value.trim();
    var author = document.getElementById('p_author').value.trim();
    var status = document.getElementById('p_status').value.trim();
    var date = document.getElementById('p_date').value.trim();
    var content = document.getElementById('p_content').value.trim();
    var tags = document.getElementById('p_tags').value.trim();
    
    var hasError = false;
    
    if (!title || title.length < 3) {
        showFieldError('p_title', 'Title is required (min 3 chars).');
        hasError = true;
    }
    if (!category) {
        showFieldError('p_category', 'Category is required.');
        hasError = true;
    }
    if (!author || author.length < 2) {
        showFieldError('p_author', 'Author name is required (min 2 chars).');
        hasError = true;
    }
    if (!status) {
        showFieldError('p_status', 'Status is required.');
        hasError = true;
    }
    if (!date) {
        showFieldError('p_date', 'Date is required.');
        hasError = true;
    }
    if (!content || content.length < 10) {
        showFieldError('p_content', 'Content is required (min 10 chars).');
        hasError = true;
    }
    
    if (hasError) return false;

    if (typeof ContentPolicy !== 'undefined') {
        var pol = ContentPolicy.scan(title + '\n' + content + '\n' + tags + '\n' + author + '\n' + category);
        if (pol.blocked) {
            showFieldError('p_content', pol.block[0] || 'Blocked by spam & policy check.');
            showToast('Fix spam / policy issues before saving.');
            return false;
        }
        if (pol.warnings.length) {
            showToast('Heads-up: ' + pol.warnings[0]);
        }
    }

    document.getElementById('postForm').submit();
    return true;
}

function showFieldError(fieldId, message) {
    var field = document.getElementById(fieldId);
    var errorSpan = field.nextElementSibling;
    if (errorSpan && errorSpan.classList.contains('field-error')) {
        errorSpan.textContent = message;
    }
    field.classList.add('error');
}

function submitReport() {
    var reason = document.getElementById('report_reason').value.trim();
    var note = document.getElementById('report_note').value.trim();
    if (!reason) {
        showToast('Choose a reason for the report.');
        return;
    }
    if (typeof ContentPolicy !== 'undefined') {
        var pol = ContentPolicy.scan(note);
        if (pol.blocked) {
            showToast(pol.block[0] || 'Note blocked by spam check.');
            return;
        }
    }
    document.getElementById('reportForm').submit();
}

function openReportModal(postId) {
    var p = posts.find(function (x) { return x.id === postId; });
    if (!p) return;
    document.getElementById('report_post_id').value = String(postId);
    document.getElementById('reportPostTitle').textContent = p.title;
    document.getElementById('report_reason').value = '';
    document.getElementById('report_note').value = '';
    openModal('reportModal');
}

/* Close modal when clicking outside */
document.addEventListener('click', function(e) {
    var modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(function(modal) {
        if (e.target === modal) {
            modal.classList.remove('open');
        }
    });
});

/* ════════════ LOAD ════════════ */
function loadAll(){
    var vk = encodeURIComponent(getVisitorKey());
    Promise.all([
        fetch(API + '?action=list_posts&visitor_key=' + vk).then(function(r){ return r.json(); }),
        fetch(API + '?action=list_replies').then(function(r){ return r.json(); })
    ]).then(function(res){
        posts   = res[0].filter(function(p){ return p.status === 'Published'; });
        replies = res[1];
        renderPosts();
    });
}

/* ════════════ RENDER ════════════ */
function renderPosts(){
    var q=(document.getElementById('searchInput').value||'').toLowerCase();
    var data=posts.filter(function(p){
        return !q || p.title.toLowerCase().includes(q) || (p.author||'').toLowerCase().includes(q) || (p.tags||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q);
    });
    var container=document.getElementById('postsContainer');
    document.getElementById('emptyState').style.display=data.length?'none':'block';
    container.innerHTML='';

    data.forEach(function(p){
        var pReplies=getPostReplies(p.id);
        var tagsArr=(p.tags||'').split(',').filter(function(t){return t.trim();});
        var tags=tagsArr.map(function(t){return '<span>'+t.trim()+'</span>';}).join(' ');
        var repliesHtml='';
        pReplies.forEach(function(r){
            repliesHtml+=
                '<div class="reply-item">'+
                    '<div class="reply-avatar">'+getInitials(r.author)+'</div>'+
                    '<div class="reply-content">'+
                        '<span class="reply-author">'+r.author+'</span>'+
                        '<span class="reply-date">'+r.date+'</span>'+
                        '<div class="reply-text">'+r.content+'</div>'+
                    '</div>'+
                '</div>';
        });

        var react = p.reactions || { counts: {}, mine: null };
        var rc = react.counts || {};
        var summary = buildReactionSummaryHtml(rc);
        var picker = buildReactionPickerHtml(p.id, rc, react.mine || null);

        var card=document.createElement('div');
        card.className='post-card';
        card.innerHTML=
            '<div class="post-header">'+
                '<div class="post-meta">'+
                    '<div class="avatar">'+getInitials(p.author)+'</div>'+
                    '<div><div class="post-author">'+(p.author||'Anonymous')+'</div><div class="post-date">'+p.date+'</div></div>'+
                    '<span class="post-badge '+(catBadge[p.category]||'')+'">'+p.category+'</span>'+
                '</div>'+
                '<div class="post-title">'+p.title+'</div>'+
                (tags?'<div class="post-tags">'+tags+'</div>':'')+
            '</div>'+
            '<div class="post-body">'+(p.content||'').replace(/\n/g,'<br>')+'</div>'+
            '<div class="post-reaction-bar">'+
                '<div class="reaction-summary">'+summary+'</div>'+
                picker+
            '</div>'+
            '<div class="post-footer">'+
                '<div class="post-stats">'+
                    '<span>💬 '+pReplies.length+' replies</span>'+
                    (reactionTotal(rc) ? '<span aria-hidden="true"> · </span><span>'+reactionTotal(rc)+' reactions</span>' : '')+
                '</div>'+
                '<div class="post-actions">'+
                    '<button type="button" class="btn-reply" onclick="toggleReplyForm('+p.id+')">💬 Reply</button>'+
                    '<button type="button" class="btn-report" onclick="openReportModal('+p.id+')">🚩 Report</button>'+
                '</div>'+
            '</div>'+
            (pReplies.length?'<div class="replies-section"><div class="replies-title">💬 Replies ('+pReplies.length+')</div>'+repliesHtml+'</div>':'')+
            '<div class="reply-form" id="reply-form-'+p.id+'">'+
                '<form method="POST" action="../../Controllers/ExperienceController.php" id="rf-form-'+p.id+'" onsubmit="return submitReply('+p.id+')">'+
                    '<input type="hidden" name="form_action" value="reply_create">'+
                    '<input type="hidden" name="redirect" value="view">'+
                    '<input type="hidden" name="post_id" value="'+p.id+'">'+
                    '<div class="reply-form-row">'+
                        '<input type="text" name="author" id="rf-name-'+p.id+'" placeholder="Your name *">'+
                        '<input type="text" name="email" id="rf-email-'+p.id+'" placeholder="Email (optional)">'+
                    '</div>'+
                    '<textarea name="content" id="rf-content-'+p.id+'" placeholder="Write your reply..."></textarea>'+
                    '<div class="field-error" id="rf-error-'+p.id+'"></div>'+
                    '<div class="reply-form-actions">'+
                        '<button type="button" class="btn-cancel-reply" onclick="toggleReplyForm('+p.id+')">Cancel</button>'+
                        '<button type="submit" class="btn-send">Send Reply</button>'+
                    '</div>'+
                '</form>'+
            '</div>';
        container.appendChild(card);
    });
}

function toggleReplyForm(pid){
    var form=document.getElementById('reply-form-'+pid);
    form.classList.toggle('open');
}

function submitReply(pid){
    var name=document.getElementById('rf-name-'+pid).value.trim();
    var email=document.getElementById('rf-email-'+pid).value.trim();
    var content=document.getElementById('rf-content-'+pid).value.trim();
    var errEl=document.getElementById('rf-error-'+pid);

    if(!name||name.length<2){errEl.textContent='Name is required (min 2 chars).';return false;}
    if(!content||content.length<3){errEl.textContent='Reply content is required.';return false;}
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){errEl.textContent='Invalid email format.';return false;}

    if (typeof ContentPolicy !== 'undefined') {
        var pol = ContentPolicy.scan(name + '\n' + email + '\n' + content);
        if (pol.blocked) {
            errEl.textContent = pol.block[0] || 'Blocked by spam & policy check.';
            return false;
        }
    }

    errEl.textContent='';
    return true;
}

/* ── URL params: toast ── */
(function(){
    var params = new URLSearchParams(window.location.search);
    var msg = params.get('msg');
    if(msg === 'reply_created') showToast('Reply posted! ✅');
    if(msg === 'post_created') showToast('Post created successfully! ✅');
    if(msg === 'post_error') showToast('Error creating post. Please try again. ❌');
    if(msg === 'policy_block') {
        var reason = params.get('reason');
        showToast(reason ? ('Blocked: ' + reason) : 'Blocked by spam & policy check.');
    }
    if(msg === 'post_moderated') showToast('That post was not saved — it matched spam or policy filters.');
    if(msg === 'reply_moderated') showToast('That reply was not saved — it matched spam or policy filters.');
    if(msg === 'report_ok') {
        var lv = params.get('level');
        var sm = params.get('sum');
        try { if(sm) sm = decodeURIComponent(sm); } catch(e) {}
        showToast('Report received — thanks.' + (lv ? ' Auto-check: ' + lv + '.' : '') + (sm ? ' ' + sm : ''));
    }
    if(msg === 'report_err') showToast('Could not save report. Try again.');
    if(msg) window.history.replaceState({}, '', window.location.pathname);
})();

/* ── INIT ── */
loadAll();
