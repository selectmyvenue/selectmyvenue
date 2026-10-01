/* Select My Venue — shared customer mobile app navigation · 2026-10-02 */
(function(){
  "use strict";

  function isPhone(){return window.matchMedia("(max-width:767px)").matches}

  function path(){return (location.pathname.split("/").pop()||"index.html").toLowerCase()}

  function removeLegacy(){
    document.querySelectorAll(".smv-mobile-app-nav").forEach(function(n){n.remove()});
  }

  function goFind(){
    var form=document.getElementById("enquiry");
    if(form){form.scrollIntoView({behavior:"smooth",block:"start"});return}
    var trigger=document.querySelector("#venueEnquiryTrigger,.venue-enquiry-trigger");
    if(trigger){trigger.click();return}
    var quote=document.querySelector("#venueProfileQuote,.venue-quote-trigger");
    if(quote){quote.click();return}
    location.href="index.html#enquiry";
  }

  function goCall(){
    location.href="tel:+918368322256";
  }

  function goWhatsapp(){
    var link=document.querySelector("#venueProfileWhatsapp,#venueMobileWhatsapp,.venue-profile-whatsapp");
    if(link&&link.href){location.href=link.href;return}
    location.href="https://wa.me/918368322256";
  }

  function buildNav(){
    if(!isPhone()||document.querySelector(".smv-customer-app-nav"))return;
    removeLegacy();

    var p=path();
    var isHome=p==="index.html"||p==="";
    var isVenues=p==="venues.html";
    var isProfile=p==="venue.html";
    var isList=p==="list-your-venue.html";

    var primaryLabel=isProfile?"Check":isList?"List Free":"Find";
    var primaryIcon=isProfile?"✓":isList?"+":"✦";

    var nav=document.createElement("nav");
    nav.className="smv-customer-app-nav";
    nav.setAttribute("aria-label","Select My Venue mobile app navigation");
    nav.innerHTML=
      '<a href="'+(isHome?"#home":"index.html#home")+'" data-app-route="home"><span class="smv-app-icon">⌂</span><small>Home</small></a>'+
      '<a href="venues.html" data-app-route="venues"'+(isVenues?' class="is-active"':'')+'><span class="smv-app-icon">◇</span><small>Venues</small></a>'+
      '<button type="button" class="smv-app-primary" data-app-route="primary"><span class="smv-app-icon">'+primaryIcon+'</span><small>'+primaryLabel+'</small></button>'+
      '<button type="button" data-app-route="call"><span class="smv-app-icon">☎</span><small>Call</small></button>'+
      '<button type="button" data-app-route="more"><span class="smv-app-icon">•••</span><small>More</small></button>';
    document.body.appendChild(nav);

    nav.querySelector('[data-app-route="primary"]').addEventListener("click",function(){
      if(isProfile){document.querySelector("#venueProfileQuote,.venue-quote-trigger")?.click();return}
      if(isList){document.getElementById("venueApplication")?.scrollIntoView({behavior:"smooth",block:"start"});return}
      goFind();
    });
    nav.querySelector('[data-app-route="call"]').addEventListener("click",goCall);
    nav.querySelector('[data-app-route="more"]').addEventListener("click",openMore);
  }

  function openMore(){
    if(document.querySelector(".smv-customer-app-sheet"))return;
    var back=document.createElement("div");
    back.className="smv-customer-app-backdrop";
    var sheet=document.createElement("section");
    sheet.className="smv-customer-app-sheet";
    sheet.setAttribute("role","dialog");
    sheet.setAttribute("aria-label","More Select My Venue options");
    sheet.innerHTML=
      '<div class="smv-customer-app-sheet-head"><strong>Select My Venue</strong><button type="button" class="smv-customer-app-sheet-close" aria-label="Close">×</button></div>'+
      '<div class="smv-customer-app-sheet-grid">'+
      '<a class="primary" href="index.html#enquiry">Find My Venue</a>'+
      '<a href="venues.html">Browse All Venues</a>'+
      '<a href="index.html#how">How It Works</a>'+
      '<a href="index.html#smart">Smart Discovery</a>'+
      '<a href="index.html#aiPlanner">AI Planner</a>'+
      '<a href="delhi-ncr-venues.html">Delhi NCR Venues</a>'+
      '<a href="list-your-venue.html">List Your Venue Free</a>'+
      '<a href="index.html#contact">Contact & Support</a>'+
      '</div>';
    document.body.appendChild(back);
    document.body.appendChild(sheet);
    document.body.classList.add("smv-app-sheet-open");
    function close(){
      back.remove();sheet.remove();document.body.classList.remove("smv-app-sheet-open");
    }
    back.addEventListener("click",close);
    sheet.querySelector(".smv-customer-app-sheet-close").addEventListener("click",close);
    sheet.querySelectorAll("a").forEach(function(a){a.addEventListener("click",close)});
    document.addEventListener("keydown",function esc(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",esc)}});
  }

  function normalizeLayout(){
    if(!isPhone())return;
    document.body.classList.add("smv-customer-mobile");
    removeLegacy();
  }

  function init(){
    normalizeLayout();
    buildNav();
    window.addEventListener("resize",function(){
      if(!isPhone()){
        document.querySelector(".smv-customer-app-nav")?.remove();
        document.querySelector(".smv-customer-app-sheet")?.remove();
        document.querySelector(".smv-customer-app-backdrop")?.remove();
        document.body.classList.remove("smv-customer-mobile","smv-app-sheet-open");
      }else buildNav();
    },{passive:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();