/* Select My Venue — customer mobile shell v3 · single navigation only */
(function(){
  "use strict";
  function phone(){return window.matchMedia("(max-width:767px)").matches}
  function cleanup(){
    document.querySelectorAll(".smv-mobile-app-nav,.smv-customer-app-nav,.smv-mobile-bottom-nav,[data-mobile-app-nav]").forEach(function(n){n.remove()});
    document.querySelectorAll(".smv-customer-app-sheet,.smv-customer-app-backdrop").forEach(function(n){n.remove()});
    document.body.classList.remove("smv-app-sheet-open");
  }
  function ensureMenu(){
    var btn=document.getElementById("menuToggle"),nav=document.getElementById("mainNav");
    if(!btn||!nav||btn.dataset.smvMenuReady==="1")return;
    btn.dataset.smvMenuReady="1";
    function close(){nav.classList.remove("open");btn.setAttribute("aria-expanded","false")}
    btn.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();var open=nav.classList.toggle("open");btn.setAttribute("aria-expanded",open?"true":"false")});
    nav.addEventListener("click",function(e){if(e.target.closest("a"))close()});
    document.addEventListener("click",function(e){if(!e.target.closest(".site-header"))close()});
    document.addEventListener("keydown",function(e){if(e.key==="Escape")close()});
  }
  function run(){
    cleanup();ensureMenu();
    document.body.classList.toggle("smv-customer-mobile",phone());
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});else run();
  window.addEventListener("resize",run,{passive:true});
})();