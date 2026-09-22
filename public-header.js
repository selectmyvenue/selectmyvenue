(function(){"use strict";
function init(){
  var btn=document.getElementById("menuToggle"),nav=document.getElementById("mainNav");
  if(!btn||!nav)return;
  function close(){nav.classList.remove("open");btn.setAttribute("aria-expanded","false");}
  btn.addEventListener("click",function(){var open=nav.classList.toggle("open");btn.setAttribute("aria-expanded",open?"true":"false");});
  nav.addEventListener("click",function(e){if(e.target.closest("a"))close();});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")close();});
  document.addEventListener("click",function(e){if(!e.target.closest(".site-header"))close();});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();