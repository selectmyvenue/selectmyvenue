(function(){
  "use strict";

  function loadLuxuryStyles(){
    if(document.getElementById("smvHomepageCustomerLuxury"))return;
    var link=document.createElement("link");
    link.id="smvHomepageCustomerLuxury";
    link.rel="stylesheet";
    link.href="homepage-customer-luxury.css?v=20260901-2";
    document.head.appendChild(link);
  }

  function activateSmartMatchLayout(){
    var section=document.getElementById("enquiry");
    if(section){section.classList.add("smv-smart-match-active");}

    if(!document.getElementById("smvSmartMatchLayoutRecovery")){
      var style=document.createElement("style");
      style.id="smvSmartMatchLayoutRecovery";
      style.textContent=`
        #enquiry.smv-smart-match-active{
          display:block!important;
          width:calc(100% - 32px)!important;
          max-width:1760px!important;
          margin:34px auto 46px!important;
          padding:58px 46px 68px!important;
          border-radius:34px!important;
        }
        #enquiry.smv-smart-match-active::before{display:none!important;content:none!important}
        #enquiry.smv-smart-match-active>.section-heading{display:none!important}
        #enquiry.smv-smart-match-active #smvSmartMatch{width:min(1540px,100%)!important;max-width:none!important;margin:0 auto!important;grid-column:auto!important;grid-area:auto!important}
        @media(max-width:760px){
          #enquiry.smv-smart-match-active{width:calc(100% - 16px)!important;margin:18px auto 30px!important;padding:34px 12px 42px!important;border-radius:24px!important}
        }
      `;
      document.head.appendChild(style);
    }
  }

  function fixVenueQuoteButtons(){
    var buttons=document.querySelectorAll('.home-venue-card .home-venue-actions .primary-btn');
    buttons.forEach(function(button){
      if(button.textContent!=="Get Quote") button.textContent="Get Quote";
      if(button.getAttribute("aria-label")!=="Get venue quote") button.setAttribute("aria-label","Get venue quote");
      var card=button.closest('.home-venue-card');
      var profile=card&&card.querySelector('.home-venue-actions .secondary-btn[href*="venue.html?id="]');
      if(profile){
        var href=profile.getAttribute("href")||"";
        var quoteHref=href+(href.indexOf("?")>=0?"&":"?")+"quote=1";
        if(button.getAttribute("href")!==quoteHref) button.setAttribute("href",quoteHref);
      }
    });
    return buttons.length>0;
  }

  function setupVenueQuoteWatcher(){
    var grid=document.getElementById("homeVenueGrid");
    if(!grid||grid.dataset.smvQuoteWatcher==="1")return;
    grid.dataset.smvQuoteWatcher="1";

    if(fixVenueQuoteButtons()) return;

    var observer=new MutationObserver(function(){
      if(fixVenueQuoteButtons()) observer.disconnect();
    });
    observer.observe(grid,{childList:true});

    setTimeout(function(){fixVenueQuoteButtons();},700);
    setTimeout(function(){fixVenueQuoteButtons();observer.disconnect();},3000);
  }

  function loadCore(){
    loadLuxuryStyles();
    activateSmartMatchLayout();
    setupVenueQuoteWatcher();
    if(document.getElementById("smvSmartMatchCoreLoader"))return;
    var script=document.createElement("script");
    script.id="smvSmartMatchCoreLoader";
    script.src="smv-smart-match-core.js?v=20260901-layout-recovery-1";
    script.defer=true;
    document.head.appendChild(script);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",loadCore,{once:true});
  }else{
    loadCore();
  }
})();
