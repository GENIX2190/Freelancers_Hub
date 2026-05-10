/* ════════════════════════════════
   PROJECT DASHBOARD JS
   Wired to MySQL via ProjetController
════════════════════════════════ */

var API = '../../Controllers/ProjetController.php';
var projects = [];
var tasks = [];

/* ════════════════════════════════
   LOAD DATA FROM DB
════════════════════════════════ */
function loadAll() {
    Promise.all([
        fetch(API + '?action=list_projects').then(fhJsonFromResponse),
        fetch(API + '?action=list_tasks').then(fhJsonFromResponse)
    ]).then(function(results) {
        projects = results[0];
        tasks    = results[1];
        updateStats();
        renderProjects();
        renderTasks();
        populateProjectSelects();
    }).catch(function() {
        document.getElementById('projects-empty').style.display = 'block';
    });
}

/* ════════════════════════════════
   UTILS
════════════════════════════════ */
function closeOnBg(e,id){if(e.target===document.getElementById(id))closeModal(id);}
function fmtDate(d){if(!d)return'—';try{return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});}catch(e){return d;}}
function isOverdue(d,status){return status!=='Completed'&&status!=='Cancelled'&&d&&new Date(d)<new Date();}

var V = {
    required: function(id){
        var el=document.getElementById(id), v=el.value.trim(), err=el.parentElement.querySelector('.field-error');
        if(!v){el.classList.add('error');if(err){err.textContent='This field is required.';err.classList.add('visible');}return false;}
        el.classList.remove('error');if(err){err.textContent='';err.classList.remove('visible');}return true;
    },
    clear: function(formId){
        document.getElementById(formId).querySelectorAll('.error').forEach(function(e){e.classList.remove('error');});
        document.getElementById(formId).querySelectorAll('.field-error').forEach(function(e){e.textContent='';e.classList.remove('visible');});
    }
};

document.addEventListener('input',function(e){
    if(e.target.classList.contains('error')){
        e.target.classList.remove('error');
        var er=e.target.parentElement.querySelector('.field-error');
        if(er){er.textContent='';er.classList.remove('visible');}
    }
});

/* ════════════════════════════════
   TABS
════════════════════════════════ */
function switchTab(name, btn) {
    ['projects','tasks'].forEach(function(t){document.getElementById('tab-'+t).style.display='none';});
    document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active');});
    document.getElementById('tab-'+name).style.display='block';
    btn.classList.add('active');
}

/* ════════════════════════════════
   STATS
════════════════════════════════ */
function updateStats(){
    document.getElementById('s-projects').textContent  = projects.length;
    document.getElementById('s-tasks').textContent     = tasks.length;
    document.getElementById('s-tasks-done').textContent= tasks.filter(function(t){return t.status==='Completed';}).length;
    document.getElementById('s-tasks-pending').textContent=tasks.filter(function(t){return t.status==='Pending'||t.status==='In Progress';}).length;
}

/* ════════════════════════════════
   PROJECTS TABLE
════════════════════════════════ */
var statusBadge = {
    'Planning':'badge-planning','In Progress':'badge-progress',
    'Review':'badge-review','Completed':'badge-completed','Cancelled':'badge-cancelled'
};
var priorityBadge = {'High':'badge-high','Medium':'badge-medium','Normal':'badge-medium','Low':'badge-low'};

function renderProjects(){
    var q=(document.getElementById('search-projects').value||'').toLowerCase();
    var data=projects.filter(function(p){return !q||p.title.toLowerCase().indexOf(q)>-1||(p.client||'').toLowerCase().indexOf(q)>-1||(p.category||'').toLowerCase().indexOf(q)>-1;});
    var tbody=document.getElementById('projects-tbody');
    tbody.innerHTML='';
    document.getElementById('projects-empty').style.display=data.length?'none':'block';
    data.forEach(function(p,i){
        var overdue=isOverdue(p.end,p.status);
        var row=document.createElement('tr');
        row.innerHTML=
            '<td style="color:#aaa;font-size:12px">'+(i+1)+'</td>'+
            '<td><strong style="color:#00a852">'+p.title+'</strong></td>'+
            '<td><span style="background:#f0f0f0;padding:3px 8px;border-radius:10px;font-size:12px">'+(p.category||'—')+'</span></td>'+
            '<td>'+(p.client||'—')+'</td>'+
            '<td><span class="badge '+(statusBadge[p.status]||'')+'">'+p.status+'</span></td>'+
            '<td><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill" style="width:'+p.progress+'%"></div></div><div class="prog-label">'+p.progress+'%</div></div></td>'+
            '<td>'+fmtDate(p.start)+'</td>'+
            '<td><span style="'+(overdue?'color:#dc3545;font-weight:700':'')+'">'+fmtDate(p.end)+(overdue?' ⚠️':'')+'</span></td>'+
            '<td><span class="badge '+(priorityBadge[p.priority]||'')+'">'+p.priority+'</span></td>'+
            '<td><div class="action-btns">'+
                '<button class="btn-act btn-view" onclick="viewProject('+p.id+')">👁</button>'+
                '<button class="btn-act btn-edit" onclick="openEditProject('+p.id+')">✏️</button>'+
                '<button class="btn-act btn-del"  onclick="confirmDelete(\'project\','+p.id+')">🗑</button>'+
            '</div></td>';
        tbody.appendChild(row);
    });
}

function openAddProject(){
    document.getElementById('projectModalTitle').textContent='➕ Add Project';
    document.getElementById('p_action').value='project_create';
    document.getElementById('p_id').value='';
    document.getElementById('projectForm').reset();
    document.getElementById('p_action').value='project_create';
    document.getElementById('p_progress').value=0;
    V.clear('projectForm');
    openModal('projectModal');
}
function openEditProject(id){
    var p=projects.find(function(x){return x.id===id;});
    if(!p)return;
    document.getElementById('projectModalTitle').textContent='✏️ Edit Project';
    document.getElementById('p_action').value='project_update';
    document.getElementById('p_id').value=id;
    document.getElementById('p_title').value=p.title;
    document.getElementById('p_category').value=p.category||'';
    document.getElementById('p_client').value=p.client||'';
    document.getElementById('p_priority').value=p.priority||'Normal';
    document.getElementById('p_status').value=p.status;
    document.getElementById('p_progress').value=p.progress;
    document.getElementById('p_start').value=p.start||'';
    document.getElementById('p_end').value=p.end||'';
    document.getElementById('p_desc').value=p.desc||'';
    V.clear('projectForm');
    openModal('projectModal');
}
function viewProject(id){
    var p=projects.find(function(x){return x.id===id;});
    if(!p)return;
    var tasksOfProject=tasks.filter(function(t){return t.projectId===id;});
    var done=tasksOfProject.filter(function(t){return t.status==='Completed';}).length;
    alert('📁 '+p.title+'\n\nClient: '+(p.client||'—')+'\nCategory: '+(p.category||'—')+'\nStatus: '+p.status+'\nProgress: '+p.progress+'%\nPriority: '+(p.priority||'—')+'\nStart: '+fmtDate(p.start)+' → End: '+fmtDate(p.end)+'\n\nTasks: '+tasksOfProject.length+' total ('+done+' done)\n\nDescription:\n'+(p.desc||'—'));
}
function saveProject(e){
    var ok=V.required('p_title')&V.required('p_category')&V.required('p_client')&V.required('p_status')&V.required('p_start')&V.required('p_end');
    if(!ok){e.preventDefault();showToast('Please fill in required fields.',true);return false;}
    if(document.getElementById('p_status').value==='Completed') document.getElementById('p_progress').value=100;
    return true;
}

/* ════════════════════════════════
   TASKS TABLE
════════════════════════════════ */
function populateProjectSelects(){
    ['t_project'].forEach(function(selId){
        var sel=document.getElementById(selId);
        var cur=sel.value;
        sel.innerHTML='<option value="">-- Select project --</option>';
        projects.forEach(function(p){sel.innerHTML+='<option value="'+p.id+'">'+p.title+'</option>';});
        if(cur)sel.value=cur;
    });
}
function getProjectTitle(id){var p=projects.find(function(x){return x.id===id;});return p?p.title:'—';}

function renderTasks(){
    var q=(document.getElementById('search-tasks').value||'').toLowerCase();
    var data=tasks.filter(function(t){return !q||t.name.toLowerCase().indexOf(q)>-1||(t.assigned||'').toLowerCase().indexOf(q)>-1||(t.projectTitle||getProjectTitle(t.projectId)).toLowerCase().indexOf(q)>-1;});
    var tbody=document.getElementById('tasks-tbody');
    tbody.innerHTML='';
    document.getElementById('tasks-empty').style.display=data.length?'none':'block';
    data.forEach(function(t,i){
        var overdue=isOverdue(t.due,t.status);
        var row=document.createElement('tr');
        row.innerHTML=
            '<td style="color:#aaa;font-size:12px">'+(i+1)+'</td>'+
            '<td><strong>'+t.name+'</strong></td>'+
            '<td><span style="background:#e8f7ed;color:#00853f;padding:3px 8px;border-radius:10px;font-size:12px">'+(t.projectTitle||getProjectTitle(t.projectId))+'</span></td>'+
            '<td>👤 '+(t.assigned||'—')+'</td>'+
            '<td><span class="badge '+(priorityBadge[t.priority]||'')+'">'+t.priority+'</span></td>'+
            '<td><span class="badge '+(statusBadge[t.status]||'')+'">'+t.status+'</span></td>'+
            '<td><span style="'+(overdue?'color:#dc3545;font-weight:700':'')+'">'+fmtDate(t.due)+(overdue?' ⚠️':'')+'</span></td>'+
            '<td><div class="action-btns">'+
                '<button class="btn-act btn-edit" onclick="openEditTask('+t.id+')">✏️</button>'+
                '<button class="btn-act btn-del"  onclick="confirmDelete(\'task\','+t.id+')">🗑</button>'+
            '</div></td>';
        tbody.appendChild(row);
    });
}
function openAddTask(){
    document.getElementById('taskModalTitle').textContent='➕ Add Task';
    document.getElementById('t_action').value='task_create';
    document.getElementById('t_id').value='';
    document.getElementById('taskForm').reset();
    document.getElementById('t_action').value='task_create';
    V.clear('taskForm');
    populateProjectSelects();
    openModal('taskModal');
}
function openEditTask(id){
    var t=tasks.find(function(x){return x.id===id;});
    if(!t)return;
    document.getElementById('taskModalTitle').textContent='✏️ Edit Task';
    document.getElementById('t_action').value='task_update';
    document.getElementById('t_id').value=id;
    populateProjectSelects();
    document.getElementById('t_name').value=t.name;
    document.getElementById('t_project').value=t.projectId;
    document.getElementById('t_assigned').value=t.assigned||'';
    document.getElementById('t_priority').value=t.priority||'Medium';
    document.getElementById('t_status').value=t.status;
    document.getElementById('t_due').value=t.due||'';
    document.getElementById('t_notes').value=t.notes||'';
    V.clear('taskForm');
    openModal('taskModal');
}
function saveTask(e){
    var ok=V.required('t_name')&V.required('t_project')&V.required('t_assigned')&V.required('t_status')&V.required('t_due');
    if(!ok){e.preventDefault();showToast('Please fill in required fields.',true);return false;}
    return true;
}

/* ════════════════════════════════
   DELETE
════════════════════════════════ */
function confirmDelete(type,id){
    document.getElementById('del-msg').textContent='Delete this '+type+'? Cannot be undone.';
    document.getElementById('del-confirm-btn').onclick=function(){
        if(type==='project'){
            document.getElementById('del_project_id').value=id;
            document.getElementById('delProjectForm').submit();
        } else {
            document.getElementById('del_task_id').value=id;
            document.getElementById('delTaskForm').submit();
        }
    };
    openModal('deleteModal');
}

document.addEventListener('keydown',function(e){
    if(e.key==='Escape')document.querySelectorAll('.modal-overlay.open').forEach(function(m){m.classList.remove('open');document.body.style.overflow='';});
});

/* ── TOAST FROM URL ── */
(function() {
    var p = new URLSearchParams(window.location.search);
    var msg = p.get('msg');
    var tab = p.get('tab');

    if (tab === 'tasks') {
        var btns = document.querySelectorAll('.tab-btn');
        if (btns[1]) switchTab('tasks', btns[1]);
    }

    var toasts = {
        'project_created': 'Project added successfully!',
        'project_updated': 'Project updated successfully!',
        'project_deleted': 'Project deleted!',
        'project_error':   'Failed to save project.',
        'task_created':    'Task added successfully!',
        'task_updated':    'Task updated successfully!',
        'task_deleted':    'Task deleted!',
        'task_error':      'Failed to save task.',
    };
    if (msg && toasts[msg]) {
        showToast(toasts[msg], msg.indexOf('error') > -1);
        history.replaceState(null, '', window.location.pathname);
    }
})();

/* ── INIT ── */
loadAll();
