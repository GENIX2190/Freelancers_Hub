/* ════════════ EXPERIENCE VIEW (User) JS — dynamic ════════════ */

var API = '../../Controllers/ExperienceController.php';
var posts = [], replies = [];

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
    resetPostForm();
    setDefaultDate();
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
    Promise.all([
        fetch(API + '?action=list_posts').then(function(r){ return r.json(); }),
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
            '<div class="post-footer">'+
                '<div class="post-stats">'+
                    '<span>💬 '+pReplies.length+' replies</span>'+
                '</div>'+
                '<button class="btn-reply" onclick="toggleReplyForm('+p.id+')">💬 Reply</button>'+
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
    if(msg) window.history.replaceState({}, '', window.location.pathname);
})();

/* ── INIT ── */
loadAll();
