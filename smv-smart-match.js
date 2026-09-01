(function(){
  "use strict";

  function activateSmartMatchLayout(){
    var section=document.getElementById("enquiry");
    if(section){section.classList.add("smv-smart-match-active");}

    if(!document.getElementById("smvSmartMatchLayoutRecovery")){
      var style=document.createElement("style");
      style.id="smvSmartMatchLayoutRecovery";
      style.textContent=`
        #enquiry.smv-smart-match-active{
          display:block!important;
          width:min(calc(100% - 40px),1240px)!important;
          margin:32px auto!important;
          padding:46px 24px 58px!important;
          border-radius:28px!important;
        }
        #enquiry.smv-smart-match-active::before{display:none!important;content:none!important}
        #enquiry.smv-smart-match-active>.section-heading{display:none!important}
        #enquiry.smv-smart-match-active #smvSmartMatch{width:min(1120px,100%)!important;margin:0 auto!important;grid-column:auto!important;grid-area:auto!important}
        @media(max-width:760px){
          #enquiry.smv-smart-match-active{width:calc(100% - 18px)!important;margin:14px auto!important;padding:34px 10px 42px!important;border-radius:22px!important}
        }
      `;
      document.head.appendChild(style);
    }
  }

  function loadCore(){
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
