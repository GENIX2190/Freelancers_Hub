/* =============================================
   RESOURCES.JS — Dashboard Resources Page
   Freelence Hub
   ============================================= */

// Dropdown menu toggle
(function(){
    var dds = document.querySelectorAll(".nav-dropdown");
    dds.forEach(function(dd){
        dd.querySelector(".nav-dropdown-btn").addEventListener("click", function(e){
            e.stopPropagation();
            dds.forEach(function(o){ if(o!==dd) o.classList.remove("open"); });
            dd.classList.toggle("open");
        });
    });
    document.addEventListener("click", function(){ dds.forEach(function(dd){ dd.classList.remove("open"); }); });
})();

// Smooth page transitions
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('header nav a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (!href || href === '#' || href.startsWith('javascript:')) return;
            
            e.preventDefault();
            document.body.style.opacity = '0';
            document.body.style.transform = 'translateY(-10px)';
            
            setTimeout(function() {
                window.location.href = href;
            }, 300);
        });
    });
});
