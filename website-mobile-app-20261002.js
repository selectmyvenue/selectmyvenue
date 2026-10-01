/* Select My Venue — customer mobile shell v4 · app-like navigation */
(function(){
  "use strict";

  function phone(){ return window.matchMedia("(max-width:767px)").matches; }

  function isHome(){
    var p=(location.pathname.split("/").pop()||"index.html").toLowerCase();
    return p==="" || p==="index.html";
  }

  function cleanup(){
    document.querySelectorAll(".smv-mobile-bottom-nav,.smv-customer-app-nav,.smv-mobile-app-nav,[data-mobile-app-nav]").forEach(function(n){n.remove()});
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

  function arrangeVenueBadges(){
    var badges=document.querySelector(".venue-profile-badges");
    var media=document.querySelector(".venue-profile-media");
    var titleCopy=document.querySelector(".venue-title-copy");
    if(!badges||!media||!titleCopy)return;

    if(phone()){
      if(!titleCopy.contains(badges)){
        badges.classList.add("smv-mobile-profile-badges");
        titleCopy.insertBefore(badges,titleCopy.firstChild);
      }
    }else{
      if(!media.contains(badges)){
        badges.classList.remove("smv-mobile-profile-badges");
        media.appendChild(badges);
      }
    }
  }

  function createBottomNav(){
    if(!phone() || document.querySelector(".smv-mobile-bottom-nav")) return;

    var venuePage=document.body.classList.contains("venue-profile-page");
    var nav=document.createElement("nav");
    nav.className="smv-mobile-bottom-nav";
    nav.setAttribute("aria-label","Mobile navigation");

    nav.innerHTML =
      '<a class="smv-mobile-nav-item smv-nav-home" href="index.html#home" aria-label="Home">'+
        '<span class="smv-mobile-nav-icon">⌂</span><span>Home</span>'+
      '</a>'+
      '<a class="smv-mobile-nav-item smv-nav-venues" href="venues.html" aria-label="Browse venues">'+
        '<span class="smv-mobile-nav-icon">◇</span><span>Venues</span>'+
      '</a>'+
      '<button class="smv-mobile-nav-find" type="button" aria-label="'+(venuePage?'Check availability':'Find my venue')+'">'+
        '<span class="smv-mobile-find-icon">✦</span><span>'+(venuePage?'Check':'Find')+'</span>'+
      '</button>'+
      '<a class="smv-mobile-nav-item smv-nav-call" href="tel:+918368322256" aria-label="Call Select My Venue">'+
        '<span class="smv-mobile-nav-icon">☎</span><span>Call</span>'+
      '</a>'+
      '<button class="smv-mobile-nav-item smv-nav-more" type="button" aria-label="More navigation">'+
        '<span class="smv-mobile-nav-icon">•••</span><span>More</span>'+
      '</button>';

    document.body.appendChild(nav);

    var find=nav.querySelector(".smv-mobile-nav-find");
    find.addEventListener("click",function(e){
      e.preventDefault();
      if(venuePage){
        var trigger=document.querySelector(".venue-quote-trigger");
        if(trigger){ trigger.click(); return; }
        var availability=document.querySelector("[data-venue-availability],#checkAvailability");
        if(availability){ availability.click(); return; }
      }
      var tab=document.getElementById("smvHomeEnquiryTab");
      if(tab){ tab.click(); return; }
      var enquiry=document.querySelector("#enquiry,#customerEnquiryForm");
      if(enquiry){ enquiry.scrollIntoView({behavior:"smooth",block:"start"}); }
    });

    nav.querySelector(".smv-nav-more").addEventListener("click",function(){
      var btn=document.getElementById("menuToggle");
      if(btn) btn.click();
      else window.scrollTo({top:0,behavior:"smooth"});
    });

    var path=(location.pathname.split("/").pop()||"index.html").toLowerCase();
    if(isHome()) nav.querySelector(".smv-nav-home").classList.add("active");
    if(path==="venues.html" || path==="delhi-ncr-venues.html" || path.indexOf("venues-in-")===0)
      nav.querySelector(".smv-nav-venues").classList.add("active");
    if(venuePage) nav.querySelector(".smv-mobile-nav-find").classList.add("active");
  }

  function run(){
    cleanup();
    ensureMenu();
    document.body.classList.toggle("smv-customer-mobile",phone());
    document.body.classList.toggle("smv-home-mobile",phone() && isHome());
    arrangeVenueBadges();\n    if(phone()) createBottomNav();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();

  window.addEventListener("resize",run,{passive:true});
})();