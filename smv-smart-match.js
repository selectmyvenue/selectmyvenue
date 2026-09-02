(function(){
  "use strict";

  function byId(id){return document.getElementById(id);}

  function loadLuxuryStyles(){
    if(document.getElementById("smvHomepageCustomerLuxury"))return;
    var link=document.createElement("link");
    link.id="smvHomepageCustomerLuxury";
    link.rel="stylesheet";
    link.href="homepage-customer-luxury.css?v=20260901-3";
    document.head.appendChild(link);
  }

  function installEnquiryStyles(){
    if(byId("smvLuxuryEnquiryStyles"))return;
    var style=document.createElement("style");
    style.id="smvLuxuryEnquiryStyles";
    style.textContent=`
      #enquiry{display:block!important;width:min(1320px,calc(100% - 32px))!important;max-width:1320px!important;margin:32px auto 46px!important;padding:36px 30px 40px!important;border:1px solid rgba(25,216,189,.22)!important;border-radius:24px!important;background:radial-gradient(circle at 8% 5%,rgba(25,216,189,.09),transparent 30%),radial-gradient(circle at 92% 4%,rgba(243,200,75,.07),transparent 25%),linear-gradient(145deg,#052925,#031f1d 55%,#021917)!important;box-shadow:0 20px 52px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.025)!important}
      #enquiry::before{display:none!important;content:none!important}
      #enquiry>.section-heading{display:flex!important;max-width:1180px!important;margin:0 auto 22px!important;align-items:end!important;justify-content:space-between!important;gap:28px!important}
      #enquiry>.section-heading>div{max-width:690px!important}#enquiry>.section-heading>p{max-width:430px!important;margin:0!important;color:#a9cbc6!important;font-size:14px!important;line-height:1.55!important;font-weight:650!important}
      #enquiry .section-kicker{color:#f3c84b!important;font-size:11px!important;font-weight:950!important;letter-spacing:.14em!important}#enquiry>.section-heading h2{margin:7px 0 0!important;color:#fff!important;font-size:clamp(34px,3.3vw,48px)!important;line-height:1.02!important;letter-spacing:-.035em!important}#enquiry>.section-heading h2 span{color:#22d9c0!important}
      #customerEnquiryForm{position:relative!important;left:auto!important;width:min(1180px,100%)!important;height:auto!important;overflow:visible!important;opacity:1!important;pointer-events:auto!important;margin:0 auto!important;padding:22px!important;border:1px solid rgba(25,216,189,.22)!important;border-radius:19px!important;background:linear-gradient(145deg,rgba(6,40,37,.96),rgba(3,28,26,.98))!important;box-shadow:0 16px 40px rgba(0,0,0,.18),inset 0 1px rgba(255,255,255,.035)!important}
      .smv-ai-form-banner{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(290px,.65fr);gap:18px;align-items:center;margin-bottom:20px;padding:17px 20px;border:1px solid rgba(243,200,75,.30);border-radius:15px;background:linear-gradient(135deg,rgba(243,200,75,.065),rgba(25,216,189,.045));box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}.smv-ai-form-banner strong{display:block;color:#fff;font-size:18px;line-height:1.2;margin-bottom:5px;font-weight:950}.smv-ai-form-banner p{margin:0;color:#b5d3cf;font-size:13px;line-height:1.5;font-weight:600}.smv-ai-live{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}.smv-ai-live span{padding:7px 10px;border-radius:999px;border:1px solid rgba(25,216,189,.22);background:rgba(25,216,189,.05);color:#c6e3df;font-size:11px;font-weight:900}.smv-ai-live span.ready{color:#ffe599;border-color:rgba(243,200,75,.42);background:rgba(243,200,75,.075)}
      #customerEnquiryForm .form-section-title{margin:19px 0 11px!important;padding-bottom:8px!important;border-bottom:1px solid rgba(243,200,75,.14)!important;color:#f3c84b!important;font-size:13px!important;font-weight:1000!important;letter-spacing:.11em!important}#customerEnquiryForm .form-section-title:first-of-type{margin-top:0!important}
      #customerEnquiryForm .form-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:13px!important}#customerEnquiryForm .field{min-width:0!important}#customerEnquiryForm .field label{display:block!important;margin-bottom:6px!important;color:#d3e8e5!important;font-size:12px!important;font-weight:950!important;letter-spacing:.045em!important}#customerEnquiryForm .field input,#customerEnquiryForm .field select,#customerEnquiryForm .field textarea{width:100%!important;min-height:50px!important;padding:0 13px!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:11px!important;background:rgba(0,0,0,.16)!important;color:#f3fbfa!important;font-size:14px!important;font-weight:700!important;outline:none!important;transition:.2s ease!important}#customerEnquiryForm .field textarea{padding-top:12px!important;min-height:90px!important}#customerEnquiryForm .field input::placeholder,#customerEnquiryForm .field textarea::placeholder{color:#789e99!important;opacity:1!important}#customerEnquiryForm .field input:focus,#customerEnquiryForm .field select:focus,#customerEnquiryForm .field textarea:focus{border-color:#19d8bd!important;background:rgba(25,216,189,.035)!important;box-shadow:0 0 0 3px rgba(25,216,189,.075)!important}
      #customerEnquiryForm .planner-summary-card,#customerEnquiryForm .ai-summary-card,#customerEnquiryForm [class*="planner-summary"]{border-color:rgba(243,200,75,.24)!important;background:linear-gradient(145deg,rgba(243,200,75,.04),rgba(25,216,189,.025))!important;border-radius:14px!important;padding:14px!important}#customerEnquiryForm #plannerSummaryPreview{font-size:12px!important;line-height:1.55!important;color:#d6e8e5!important;font-weight:700!important;white-space:pre-wrap!important;max-height:90px!important;overflow:auto!important}#customerEnquiryForm #refreshPlannerSummary{min-height:38px!important;padding:0 13px!important;font-size:11px!important;font-weight:900!important}
      #customerEnquiryForm .primary-btn[type="submit"],#customerEnquiryForm button[type="submit"]{width:auto!important;min-width:300px!important;max-width:420px!important;min-height:50px!important;padding:0 24px!important;border-radius:12px!important;background:linear-gradient(135deg,#f8d665,#e9b92e)!important;color:#241b02!important;font-size:14px!important;font-weight:1000!important;letter-spacing:.01em!important;box-shadow:0 10px 24px rgba(243,200,75,.15)!important;transition:.2s ease!important}#customerEnquiryForm button[type="submit"]:hover{transform:translateY(-1px)!important;filter:brightness(1.04)!important;box-shadow:0 13px 28px rgba(243,200,75,.20)!important}
      .smv-optional-field{display:none!important}.smv-optional-open .smv-optional-field{display:grid!important}.smv-more-preferences{margin:16px 0 5px;padding:10px 13px;border:1px solid rgba(25,216,189,.22);border-radius:10px;background:rgba(25,216,189,.045);color:#bfe2dd;font-size:12px;font-weight:900;cursor:pointer}.smv-required-note{margin:10px 0 0;color:#9cc1bc;font-size:11px;line-height:1.45;font-weight:650}
      #customerEnquiryMessage{display:none!important;margin:16px 0 3px!important;padding:15px 17px!important;border-radius:13px!important;font-size:14px!important;line-height:1.45!important;font-weight:800!important}#customerEnquiryMessage.success{display:block!important;border:1px solid rgba(25,216,189,.42)!important;background:linear-gradient(135deg,rgba(25,216,189,.11),rgba(25,216,189,.04))!important;color:#dffffa!important}#customerEnquiryMessage.error{display:block!important;border:1px solid rgba(255,111,111,.36)!important;background:rgba(255,90,90,.07)!important;color:#ffd2d2!important}.smv-confirmation-title{display:block!important;margin-bottom:4px!important;color:#fff!important;font-size:17px!important;font-weight:1000!important}.smv-confirmation-sub{display:block!important;color:#bce2dc!important;font-size:12px!important;font-weight:700!important}
      .home-venue-actions{position:static!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}.home-venue-actions .primary-btn,.home-venue-actions .secondary-btn{position:static!important;inset:auto!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:48px!important;white-space:nowrap!important}.home-venue-actions .primary-btn{background:linear-gradient(135deg,#20dcc3,#0fc8b0)!important;color:#02211c!important;font-weight:950!important}
      @media(max-width:1050px){#enquiry{width:calc(100% - 24px)!important}#customerEnquiryForm .form-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.smv-ai-form-banner{grid-template-columns:1fr}.smv-ai-live{justify-content:flex-start}}
      @media(max-width:680px){#enquiry{width:calc(100% - 14px)!important;margin:18px auto 28px!important;padding:25px 10px 30px!important;border-radius:19px!important}#enquiry>.section-heading{display:block!important;margin-bottom:16px!important;padding:0 6px!important}#enquiry>.section-heading h2{font-size:31px!important}#enquiry>.section-heading>p{margin-top:9px!important;font-size:13px!important}#enquiry .section-kicker{font-size:10px!important}#customerEnquiryForm{padding:14px!important;border-radius:16px!important}#customerEnquiryForm .form-grid{grid-template-columns:1fr!important;gap:12px!important}.smv-ai-form-banner{padding:14px!important}.smv-ai-form-banner strong{font-size:17px!important}.smv-ai-form-banner p{font-size:12px!important}.smv-ai-live span{font-size:10px!important;padding:6px 9px!important}#customerEnquiryForm .form-section-title{font-size:12px!important}#customerEnquiryForm .field label{font-size:11px!important}#customerEnquiryForm .field input,#customerEnquiryForm .field select,#customerEnquiryForm .field textarea{font-size:14px!important;min-height:48px!important}#customerEnquiryForm #plannerSummaryPreview{font-size:11px!important}.smv-more-preferences{font-size:11px!important}.smv-required-note{font-size:10px!important}#customerEnquiryMessage{font-size:13px!important}#customerEnquiryForm .primary-btn[type="submit"],#customerEnquiryForm button[type="submit"]{width:100%!important;min-width:0!important;max-width:none!important;min-height:50px!important;font-size:14px!important}.home-venue-actions{grid-template-columns:1fr 1fr!important}}
    `;
    document.head.appendChild(style);
  }

  function makeSimpleLuxuryForm(){
    var section=byId("enquiry"),form=byId("customerEnquiryForm");
    if(!section||!form)return;
    section.classList.remove("smv-smart-match-active");
    var oldSmart=byId("smvSmartMatch");if(oldSmart)oldSmart.remove();
    var oldStyles=byId("smvSmartMatchStyles");if(oldStyles)oldStyles.remove();
    var oldRecovery=byId("smvSmartMatchLayoutRecovery");if(oldRecovery)oldRecovery.remove();

    var heading=section.querySelector(":scope > .section-heading");
    if(heading){
      var h2=heading.querySelector("h2");if(h2)h2.innerHTML='Tell us once. <span>We’ll do the searching.</span>';
      var p=heading.querySelector(":scope > p");if(p)p.textContent="A simple venue enquiry with AI-assisted requirement understanding — only the details that actually help us shortlist better options.";
      var kicker=heading.querySelector(".section-kicker");if(kicker)kicker.textContent="AI-ASSISTED VENUE ENQUIRY";
    }

    if(!byId("smvAiFormBanner")){
      var banner=document.createElement("div");banner.id="smvAiFormBanner";banner.className="smv-ai-form-banner";
      banner.innerHTML='<div><strong>✦ Smart Match works behind the form</strong><p>Event + location + guest size + budget are used to create a clearer requirement for venue shortlisting. You don’t need to search or repeat the same details.</p></div><div class="smv-ai-live" id="smvAiLive"><span>Event</span><span>Location</span><span>Guests</span><span>Budget</span></div>';
      form.insertBefore(banner,form.firstChild);
    }

    ["customerEmail","customerFood","customerRequirements"].forEach(function(id){
      var field=byId(id);var wrap=field&&field.closest(".field");if(wrap)wrap.classList.add("smv-optional-field");
    });

    var submit=form.querySelector('button[type="submit"],input[type="submit"]');
    if(submit && !byId("smvMorePreferences")){
      var more=document.createElement("button");more.type="button";more.id="smvMorePreferences";more.className="smv-more-preferences";more.textContent="＋ Add optional preferences";
      submit.parentNode.insertBefore(more,submit);
      var note=document.createElement("div");note.className="smv-required-note";note.textContent="Keep it simple: name, mobile, city and event are the core details. Date, guests and budget help improve the shortlist.";
      more.parentNode.insertBefore(note,more.nextSibling);
      more.addEventListener("click",function(){var open=form.classList.toggle("smv-optional-open");more.textContent=open?"− Hide optional preferences":"＋ Add optional preferences";});
    }

    function updateAiLive(){
      var values=[["customerEventType","Event"],["customerLocation","Location"],["customerGuests","Guests"],["customerBudget","Budget"]];
      var live=byId("smvAiLive");if(!live)return;
      live.innerHTML=values.map(function(pair){var node=byId(pair[0]);var value=node&&String(node.value||"").trim();return '<span class="'+(value?'ready':'')+'">'+(value?'✓ ':'')+pair[1]+'</span>';}).join("");
    }
    ["customerEventType","customerLocation","customerGuests","customerBudget"].forEach(function(id){var node=byId(id);if(node){node.addEventListener("input",updateAiLive);node.addEventListener("change",updateAiLive);}});
    updateAiLive();
  }

  function enhanceConfirmation(){
    var message=byId("customerEnquiryMessage");if(!message)return;
    var observer=new MutationObserver(function(){
      if(!message.classList.contains("success")||message.dataset.smvEnhancedSuccess==="1")return;
      var text=String(message.textContent||"").trim();if(!text)return;
      message.dataset.smvEnhancedSuccess="1";
      message.innerHTML='<span class="smv-confirmation-title">✓ Requirement received successfully</span><span class="smv-confirmation-sub">Thank you. Our team will review your event details and help you with suitable venue options.</span>';
    });
    observer.observe(message,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["class"]});
  }

  function fixVenueQuoteButtons(){
    var buttons=document.querySelectorAll('.home-venue-card .home-venue-actions .primary-btn');
    buttons.forEach(function(button){
      button.textContent="Get Quote";
      button.setAttribute("aria-label","Get Quote for this venue");
      var card=button.closest('.home-venue-card');
      var profile=card&&card.querySelector('.home-venue-actions .secondary-btn[href*="venue.html?id="]');
      if(profile){var href=profile.getAttribute("href")||"";var quoteHref=href+(href.indexOf("?")>=0?"&":"?")+"quote=1";button.setAttribute("href",quoteHref);}
    });
    return buttons.length>0;
  }

  function setupVenueQuoteWatcher(){
    var grid=byId("homeVenueGrid");if(!grid)return;
    if(fixVenueQuoteButtons())return;
    var observer=new MutationObserver(function(){if(fixVenueQuoteButtons())observer.disconnect();});
    observer.observe(grid,{childList:true});
    setTimeout(function(){fixVenueQuoteButtons();observer.disconnect();},3500);
  }

  function init(){loadLuxuryStyles();installEnquiryStyles();makeSimpleLuxuryForm();enhanceConfirmation();setupVenueQuoteWatcher();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();