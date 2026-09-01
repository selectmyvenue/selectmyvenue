(function(){
  "use strict";

  function loadLuxuryStyles(){
    if(document.getElementById("smvHomepageCustomerLuxury"))return;
    var link=document.createElement("link");
    link.id="smvHomepageCustomerLuxury";
    link.rel="stylesheet";
    link.href="homepage-customer-luxury.css?v=20260901-1";
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

  function loadCore(){
    loadLuxuryStyles();
    activateSmartMatchLayout();
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
