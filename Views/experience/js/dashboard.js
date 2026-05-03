/* ════════════ EXPERIENCE DASHBOARD JS (dynamic) ════════════ */

var API = '../../Controllers/ExperienceController.php';
var posts = [], replies = [];
var activeTab = 'posts';

var RX_ORDER = ['like', 'love', 'haha', 'sad', 'thanks'];
var RX_EMOJI = { like: '👍', love: '❤️', haha: '😂', sad: '😢', thanks: '🙏' };

function formatReactionsCell(p) {
    var react = p.reactions || {};
    var c = react.counts || {};
    var parts = [];
    RX_ORDER.forEach(function (k) {
        var n = c[k] || 0;
        if (n) parts.push(RX_EMOJI[k] + n);
    });
    if (!parts.length) return '—';
    return '<small style="white-space:nowrap">' + parts.join(' ') + '</small>';
}

/* ════════════ LOAD DATA ════════════ */
function loadAll() {
    Promise.all([
        fetch(API + '?action=list_posts').then(function(r){ return r.json(); }),
        fetch(API + '?action=list_replies').then(function(r){ return r.json(); })
    ]).then(function(res){
        posts   = res[0];
        replies = res[1];
        updateStats();
        renderPosts();
        renderReplies();
    });
}

/* ════════════ HELPERS ════════════ */
function openModal(id){ document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id){ document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }
function closeBg(e,id){ if(e.target===document.getElementById(id)) closeModal(id); }
function showToast(msg,err){
    var t=document.getElementById('toast');
    t.textContent=msg; t.style.background=err?'#e53e3e':'#333';
    t.classList.add('show'); setTimeout(function(){t.classList.remove('show');},3000);
}
function vld(id, rules){
    var el=document.getElementById(id), v=el.value.trim();
    var err=el.parentElement.querySelector('.field-error');
    if(!v){ el.classList.add('error'); if(err){err.textContent='Required.';err.classList.add('visible');} return false; }
    if(rules&&rules.minLen&&v.length<rules.minLen){ el.classList.add('error'); if(err){err.textContent='Min '+rules.minLen+' chars.';err.classList.add('visible');} return false; }
    if(rules&&rules.pattern&&!rules.pattern.test(v)){ el.classList.add('error'); if(err){err.textContent=rules.patternMsg||'Invalid.';err.classList.add('visible');} return false; }
    el.classList.remove('error'); if(err){err.textContent='';err.classList.remove('visible');} return true;
}
function clearForm(fid){
    document.getElementById(fid).querySelectorAll('.error').forEach(function(e){e.classList.remove('error');});
    document.getElementById(fid).querySelectorAll('.field-error').forEach(function(e){e.textContent='';e.classList.remove('visible');});
}
function getPostTitle(id){ var p=posts.find(function(x){return x.id===parseInt(id);}); return p?p.title:'—'; }
function countReplies(pid){ return replies.filter(function(r){return r.postId===pid;}).length; }

/* ════════════ TAB SWITCH ════════════ */
function switchTab(tab, btn){
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active');});
    if(btn) btn.classList.add('active');
    document.querySelectorAll('.tab-section').forEach(function(s){s.classList.remove('active-tab');});
    document.getElementById('tab-'+tab).classList.add('active-tab');
    document.getElementById('main-add-btn').textContent = tab==='posts' ? '＋ Add Post' : '＋ Add Reply';
    if(tab==='replies'){ populatePostSelect(); renderReplies(); }
}
function onMainAdd(){ if(activeTab==='posts') openAddPost(); else openAddReply(); }

/* ════════════ STATS ════════════ */
function updateStats(){
    document.getElementById('s-posts').textContent     = posts.length;
    document.getElementById('s-replies').textContent   = replies.length;
    document.getElementById('s-published').textContent = posts.filter(function(p){return p.status==='Published';}).length;
    document.getElementById('s-drafts').textContent    = posts.filter(function(p){return p.status==='Draft';}).length;
}

/* ════════════ POSTS ════════════ */
var catBadge = {'Tech Tips':'badge-tech','Career Advice':'badge-career','Project Story':'badge-project','Life as Freelancer':'badge-life','Tutorial':'badge-tech'};
function renderPosts(){
    var q=(document.getElementById('search-posts').value||'').toLowerCase();
    var data=posts.filter(function(p){return !q||p.title.toLowerCase().includes(q)||(p.author||'').toLowerCase().includes(q)||(p.category||'').toLowerCase().includes(q);});
    var tbody=document.getElementById('posts-tbody');
    document.getElementById('posts-empty').style.display=data.length?'none':'block';
    tbody.innerHTML='';
    data.forEach(function(p,i){
        var tr=document.createElement('tr');
        var statusBadge=p.status==='Published'?'badge-pub':'badge-draft';
        tr.innerHTML=
            '<td style="color:#aaa">'+(i+1)+'</td>'+
            '<td style="max-width:220px"><strong>'+p.title+'</strong>'+(p.tags?'<br><small style="color:#aaa">'+p.tags+'</small>':'')+'</td>'+
            '<td><span class="badge '+(catBadge[p.category]||'')+'">'+p.category+'</span></td>'+
            '<td>'+(p.author||'—')+'</td>'+
            '<td><span class="badge '+statusBadge+'">'+p.status+'</span></td>'+
            '<td><span class="badge reply-badge">'+countReplies(p.id)+'</span></td>'+
            '<td>'+formatReactionsCell(p)+'</td>'+
            '<td>'+p.date+'</td>'+
            '<td>'+
                '<button class="btn-act" onclick="viewPost('+p.id+')" title="View" style="color:#0066cc">👁</button>'+
                '<button class="btn-act" onclick="openEditPost('+p.id+')" title="Edit" style="color:#e65100">✏️</button>'+
                '<button class="btn-act" onclick="confirmDel(\'post\','+p.id+')" title="Delete" style="color:#cc0000">🗑</button>'+
            '</td>';
        tbody.appendChild(tr);
    });
}
function openAddPost(){
    document.getElementById('postModalTitle').textContent='➕ Add Post';
    document.getElementById('p_action').value='post_create';
    document.getElementById('p_id').value='';
    document.getElementById('postForm').reset();
    document.getElementById('p_action').value='post_create';
    clearForm('postForm');
    openModal('postModal');
}
function openEditPost(id){
    var p=posts.find(function(x){return x.id===id;});
    if(!p) return;
    document.getElementById('postModalTitle').textContent='✏️ Edit Post';
    document.getElementById('p_action').value='post_update';
    document.getElementById('p_id').value=p.id;
    document.getElementById('p_title').value=p.title;
    document.getElementById('p_category').value=p.category;
    document.getElementById('p_author').value=p.author||'';
    document.getElementById('p_status').value=p.status;
    document.getElementById('p_date').value=p.date;
    document.getElementById('p_tags').value=p.tags||'';
    document.getElementById('p_content').value=p.content;
    clearForm('postForm');
    openModal('postModal');
}
function savePost(e){
    var ok=vld('p_title',{minLen:3})&&vld('p_category',{})&&vld('p_author',{minLen:2})&&vld('p_status',{})&&vld('p_date',{})&&vld('p_content',{minLen:10});
    if(!ok){e.preventDefault();showToast('Please fix errors.',true);return false;}
    return true;
}

/* ════════════ REPLIES ════════════ */
function populatePostSelect(){
    var sel=document.getElementById('r_post');
    var cur=sel.value;
    sel.innerHTML='<option value="">-- Select post --</option>';
    posts.forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.title;sel.appendChild(o);});
    sel.value=cur;
}
function renderReplies(){
    var q=(document.getElementById('search-replies').value||'').toLowerCase();
    var data=replies.filter(function(r){return !q||getPostTitle(r.postId).toLowerCase().includes(q)||(r.author||'').toLowerCase().includes(q)||(r.content||'').toLowerCase().includes(q);});
    var tbody=document.getElementById('replies-tbody');
    document.getElementById('replies-empty').style.display=data.length?'none':'block';
    tbody.innerHTML='';
    data.forEach(function(r,i){
        var tr=document.createElement('tr');
        tr.innerHTML=
            '<td style="color:#aaa">'+(i+1)+'</td>'+
            '<td style="max-width:200px">'+(r.postTitle||getPostTitle(r.postId))+'</td>'+
            '<td>'+r.author+'<br><small style="color:#aaa">'+(r.email||'')+'</small></td>'+
            '<td style="max-width:280px">'+r.content+'</td>'+
            '<td>'+r.date+'</td>'+
            '<td>'+
                '<button class="btn-act" onclick="openEditReply('+r.id+')" title="Edit" style="color:#e65100">✏️</button>'+
                '<button class="btn-act" onclick="confirmDel(\'reply\','+r.id+')" title="Delete" style="color:#cc0000">🗑</button>'+
            '</td>';
        tbody.appendChild(tr);
    });
}
function openAddReply(){
    populatePostSelect();
    document.getElementById('replyModalTitle').textContent='➕ Add Reply';
    document.getElementById('r_action').value='reply_create';
    document.getElementById('r_id').value='';
    document.getElementById('replyForm').reset();
    document.getElementById('r_action').value='reply_create';
    clearForm('replyForm');
    openModal('replyModal');
}
function openEditReply(id){
    var r=replies.find(function(x){return x.id===id;});
    if(!r) return;
    populatePostSelect();
    document.getElementById('replyModalTitle').textContent='✏️ Edit Reply';
    document.getElementById('r_action').value='reply_update';
    document.getElementById('r_id').value=r.id;
    document.getElementById('r_post').value=r.postId;
    document.getElementById('r_author').value=r.author;
    document.getElementById('r_date').value=r.date;
    document.getElementById('r_email').value=r.email||'';
    document.getElementById('r_content').value=r.content;
    clearForm('replyForm');
    openModal('replyModal');
}
function saveReply(e){
    var ok=vld('r_post',{})&&vld('r_author',{minLen:2})&&vld('r_date',{})&&vld('r_content',{minLen:5});
    if(!ok){e.preventDefault();showToast('Please fix errors.',true);return false;}
    var email=document.getElementById('r_email').value.trim();
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        e.preventDefault();
        document.getElementById('r_email').classList.add('error');
        var er=document.getElementById('r_email').parentElement.querySelector('.field-error');
        if(er){er.textContent='Invalid email.';er.classList.add('visible');}
        showToast('Please fix errors.',true);
        return false;
    }
    return true;
}

/* ════════════ DELETE ════════════ */
function confirmDel(type,id){
    var label;
    if(type==='post'){
        var p=posts.find(function(x){return x.id===id;});
        label=p?p.title:'Post';
    } else {
        var r=replies.find(function(x){return x.id===id;});
        label=r?r.author:'Reply';
    }
    document.getElementById('del-msg').textContent='Delete "'+label+'"? This cannot be undone.';
    document.getElementById('del-confirm-btn').onclick=function(){
        if(type==='post'){
            document.getElementById('del_post_id').value=id;
            document.getElementById('delPostForm').submit();
        } else {
            document.getElementById('del_reply_id').value=id;
            document.getElementById('delReplyForm').submit();
        }
    };
    openModal('deleteModal');
}

/* ── Escape key ── */
document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelectorAll('.modal-overlay.open').forEach(function(m){m.classList.remove('open');document.body.style.overflow='';});});

function viewPost(id){
    var p=posts.find(function(x){return x.id===id;});
    if(!p)return;
    var rc=countReplies(p.id);
    alert('📝 '+p.title+'\n\nAuthor: '+(p.author||'—')+'\nCategory: '+p.category+'\nStatus: '+p.status+'\nDate: '+p.date+'\nTags: '+(p.tags||'—')+'\nReplies: '+rc+'\n\nContent:\n'+p.content);
}

/* ── URL params: toast + tab ── */
(function(){
    var params = new URLSearchParams(window.location.search);
    var msg = params.get('msg');
    var msgs = {
        post_created:'Post created ✅', post_updated:'Post updated ✅', post_deleted:'Post deleted 🗑️',
        reply_created:'Reply created ✅', reply_updated:'Reply updated ✅', reply_deleted:'Reply deleted 🗑️',
        post_error:'Post error ❌', reply_error:'Reply error ❌'
    };
    if(msg === 'policy_block') {
        var reason = params.get('reason');
        showToast(reason ? ('Blocked: ' + reason) : 'Blocked by spam & policy check.', true);
    } else if(msg === 'post_moderated') {
        showToast('Post not saved — spam or policy filters.', true);
    } else if(msg === 'reply_moderated') {
        showToast('Reply not saved — spam or policy filters.', true);
    } else if(msg && msgs[msg]) showToast(msgs[msg], msg.includes('error'));
    if(params.get('tab')==='replies'){
        var btn = document.querySelectorAll('.tab-btn')[1];
        switchTab('replies', btn);
    }
    if(msg) window.history.replaceState({}, '', window.location.pathname);
})();

/* ════════════ PDF EXPORT ════════════ */
function exportPostsPDF() {
    var { jsPDF } = window.jspdf;
    var doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 168, 82);
    doc.text('Freelance Hub - Posts Report', 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Generated: ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(), 14, 30);
    
    // Stats
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('Total Posts: ' + posts.length + '  |  Published: ' + posts.filter(function(p){return p.status==='Published';}).length + '  |  Drafts: ' + posts.filter(function(p){return p.status==='Draft';}).length, 14, 38);
    
    // Table data
    var tableData = posts.map(function(p, i) {
        return [
            i + 1,
            p.title.substring(0, 30) + (p.title.length > 30 ? '...' : ''),
            p.category || '-',
            p.author || '-',
            p.status,
            countReplies(p.id),
            p.date
        ];
    });
    
    // Generate table
    doc.autoTable({
        startY: 45,
        head: [['#', 'Title', 'Category', 'Author', 'Status', 'Replies', 'Date']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
            fillColor: [0, 168, 82],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 50 },
            2: { cellWidth: 30 },
            3: { cellWidth: 25 },
            4: { cellWidth: 22 },
            5: { cellWidth: 15 },
            6: { cellWidth: 25 }
        }
    });
    
    // Footer
    var pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Freelance Hub - Experience Module | Page ' + i + ' of ' + pageCount, 14, doc.internal.pageSize.height - 10);
    }
    
    // Save
    doc.save('posts_report_' + new Date().toISOString().slice(0,10) + '.pdf');
    showToast('Posts exported to PDF! 📄');
}

function exportRepliesPDF() {
    var { jsPDF } = window.jspdf;
    var doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 168, 82);
    doc.text('Freelance Hub - Replies Report', 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Generated: ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(), 14, 30);
    
    // Stats
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('Total Replies: ' + replies.length, 14, 38);
    
    // Table data
    var tableData = replies.map(function(r, i) {
        return [
            i + 1,
            (r.postTitle || getPostTitle(r.postId)).substring(0, 25) + ((r.postTitle || getPostTitle(r.postId)).length > 25 ? '...' : ''),
            r.author || '-',
            r.email || '-',
            r.content.substring(0, 40) + (r.content.length > 40 ? '...' : ''),
            r.date
        ];
    });
    
    // Generate table
    doc.autoTable({
        startY: 45,
        head: [['#', 'Post', 'Author', 'Email', 'Reply', 'Date']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
            fillColor: [0, 168, 82],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 35 },
            2: { cellWidth: 25 },
            3: { cellWidth: 35 },
            4: { cellWidth: 50 },
            5: { cellWidth: 22 }
        }
    });
    
    // Footer
    var pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Freelance Hub - Experience Module | Page ' + i + ' of ' + pageCount, 14, doc.internal.pageSize.height - 10);
    }
    
    // Save
    doc.save('replies_report_' + new Date().toISOString().slice(0,10) + '.pdf');
    showToast('Replies exported to PDF! 📄');
}

/* ── INIT ── */
loadAll();
