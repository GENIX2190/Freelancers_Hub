/* ════════════ PROJECTS VIEW (User) JS ════════════
   Wired to MySQL via ProjetController
   ════════════════════════════════════════════════ */

var API = '../../Controllers/ProjetController.php';
var projects = [];

function loadProjects() {
    fetch(API + '?action=list_projects')
        .then(fhJsonFromResponse)
        .then(function(data) {
            projects = data;
            renderProjects(projects);
        })
        .catch(function() {
            document.getElementById('projectsGrid').innerHTML = '<p style="text-align:center;color:#aaa;grid-column:1/-1;padding:40px">Failed to load projects.</p>';
        });
}

function badgeClass(s){ return s==='In Progress'||s==='Active'?'badge-active':s==='Completed'?'badge-completed':'badge-planning'; }

function renderProjects(list){
    list = list || projects;
    var g = document.getElementById('projectsGrid');
    if(!list.length){ g.innerHTML='<p style="text-align:center;color:#aaa;grid-column:1/-1;padding:40px">No projects found.</p>'; return; }
    g.innerHTML = list.map(function(p){
        var tags = [];
        if (p.category) tags.push(p.category);
        if (p.priority && p.priority !== 'Normal') tags.push(p.priority + ' Priority');
        return '<div class="project-card">'+
            '<div class="card-top">'+
                '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">'+
                    '<h3>'+p.title+'</h3>'+
                    '<span class="badge '+badgeClass(p.status)+'">'+p.status+'</span>'+
                '</div>'+
                '<div class="card-meta">'+
                    (p.client ? '<span>👤 '+p.client+'</span>' : '')+
                    (p.start ? '<span>📅 '+p.start+'</span>' : '')+
                '</div>'+
                '<p class="card-desc">'+(p.desc || 'No description.')+'</p>'+
                '<div class="progress-row">'+
                    '<div class="progress-bar"><div class="progress-fill" style="width:'+p.progress+'%"></div></div>'+
                    '<span class="progress-pct">'+p.progress+'%</span>'+
                '</div>'+
            '</div>'+
            '<div class="card-tags">'+tags.map(function(t){return '<span class="tag">'+t+'</span>';}).join('')+'</div>'+
        '</div>';
    }).join('');
}

function filterProjects(){
    var q = document.getElementById('searchInput').value.toLowerCase();
    renderProjects(projects.filter(function(p){
        return p.title.toLowerCase().indexOf(q)!==-1 || (p.client||'').toLowerCase().indexOf(q)!==-1 || (p.category||'').toLowerCase().indexOf(q)!==-1;
    }));
}

loadProjects();
