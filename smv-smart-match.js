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
      #enquiry{display:block!important;width:calc(100% - 32px)!important;max-width:1720px!important;margin:34px auto 48px!important;padding:58px 46px 66px!important;border:1px solid rgba(25,216,189,.34)!important;border-radius:32px!important;background:radial-gradient(circle at 8% 5%,rgba(25,216,189,.15),transparent 28%),radial-gradient(circle at 92% 6%,rgba(243,200,75,.11),transparent 24%),linear-gradient(145deg,#052d29,#031f1d 52%,#021715)!important;box-shadow:0 34px 88px rgba(0,0,0,.31),inset 0 1px 0 rgba(255,255,255,.03)!important}
      #enquiry::before{display:none!important;content:none!important}
      #enquiry>.section-heading{display:flex!important;max-width:1480px!important;margin:0 auto 30px!important;align-items:end!important;justify-content:space-between!important;gap:36px!important}
      #enquiry>.section-heading>div{max-width:820px!important}#enquiry>.section-heading>p{max-width:570px!important;margin:0!important;color:#b7d6d2!important;font-size:20px!important;line-height:1.65!important;font-weight:560!important}
      #enquiry .section-kicker{color:#f3c84b!important;font-size:17px!important;font-weight:950!important;letter-spacing:.13em!important;text-shadow:0 0 22px rgba(243,200,75,.18)!important}#enquiry>.section-heading h2{margin:10px 0 0!important;color:#fff!important;font-size:clamp(46px,4.5vw,70px)!important;line-height:1!important;letter-spacing:-.04em!important}#enquiry>.section-heading h2 span{color:#22d9c0!important;text-shadow:0 0 28px rgba(25,216,189,.16)!important}
      #customerEnquiryForm{position:relative!important;left:auto!important;width:min(1480px,100%)!important;height:auto!important;overflow:visible!important;opacity:1!important;pointer-events:auto!important;margin:0 auto!important;padding:34px!important;border:1px solid rgba(25,216,189,.34)!important;border-radius:26px!important;background:linear-gradient(145deg,rgba(7,45,41,.98),rgba(3,28,26,.99))!important;box-shadow:0 28px 66px rgba(0,0,0,.25),inset 0 1px rgba(255,255,255,.045)!important}
      .smv-ai-form-banner{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(340px,.75fr);gap:24px;align-items:center;margin-bottom:30px;padding:27px 30px;border:1px solid rgba(243,200,75,.42);border-radius:21px;background:radial-gradient(circle at 8% 20%,rgba(243,200,75,.09),transparent 32%),linear-gradient(135deg,rgba(243,200,75,.09),rgba(25,216,189,.075));box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 15px 34px rgba(0,0,0,.12)}.smv-ai-form-banner strong{display:block;color:#fff;font-size:28px;line-height:1.2;margin-bottom:9px}.smv-ai-form-banner p{margin:0;color:#b9d8d4;font-size:19px;line-height:1.6}.smv-ai-live{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px}.smv-ai-live span{padding:10px 15px;border-radius:999px;border:1px solid rgba(25,216,189,.26);background:rgba(25,216,189,.065);color:#c6e3df;font-size:15px;font-weight:900}.smv-ai-live span.ready{color:#ffe599;border-color:rgba(243,200,75,.52);background:rgba(243,200,75,.09);box-shadow:0 0 18px rgba(243,200,75,.08)}
      #customerEnquiryForm .form-section-title{margin:28px 0 16px!important;padding-bottom:10px!important;border-bottom:1px solid rgba(243,200,75,.18)!important;color:#f3c84b!important;font-size:18px!important;font-weight:1000!important;letter-spacing:.12em!important}#customerEnquiryForm .form-section-title:first-of-type{margin-top:0!important}
      #customerEnquiryForm .form-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:18px!important}#customerEnquiryForm .field{min-width:0!important}#customerEnquiryForm .field label{display:block!important;margin-bottom:9px!important;color:#d3e8e5!important;font-size:16px!important;font-weight:950!important;letter-spacing:.055em!important}#customerEnquiryForm .field input,#customerEnquiryForm .field select,#customerEnquiryForm .field textarea{width:100%!important;min-height:64px!important;padding:0 17px!important;border:1px solid rgba(255,255,255,.15)!important;border-radius:14px!important;background:rgba(0,0,0,.19)!important;color:#f3fbfa!important;font-size:19px!important;font-weight:620!important;outline:none!important;transition:.2s ease!important}#customerEnquiryForm .field textarea{padding-top:15px!important;min-height:110px!important}#customerEnquiryForm .field input::placeholder,#customerEnquiryForm .field textarea::placeholder{color:#789e99!important;opacity:1!important}#customerEnquiryForm .field input:focus,#customerEnquiryForm .field select:focus,#customerEnquiryForm .field textarea:focus{border-color:#19d8bd!important;background:rgba(25,216,189,.045)!important;box-shadow:0 0 0 4px rgba(25,216,189,.09),0 10px 26px rgba(0,0,0,.13)!important}
      #customerEnquiryForm .planner-summary-card,#customerEnquiryForm .ai-summary-card,#customerEnquiryForm [class*="planner-summary"]{border-color:rgba(243,200,75,.32)!important;background:linear-gradient(145deg,rgba(243,200,75,.055),rgba(25,216,189,.035))!important;border-radius:18px!important}#customerEnquiryForm #plannerSummaryPreview{font-size:17px!important;line-height:1.8!important;color:#d6e8e5!important;font-weight:600!important;white-space:pre-wrap!important}#customerEnquiryForm #refreshPlannerSummary{min-height:48px!important;font-size:15px!important;font-weight:900!important}
      #customerEnquiryForm .primary-btn[type="submit"],#customerEnquiryForm button[type="submit"]{min-height:68px!important;padding:0 34px!important;border-radius:15px!important;background:linear-gradient(135deg,#f8d665,#e9b92e)!important;color:#241b02!important;font-size:20px!important;font-weight:1000!important;letter-spacing:.01em!important;box-shadow:0 16px 34px rgba(243,200,75,.2)!important;transition:.2s ease!important}#customerEnquiryForm button[type="submit"]:hover{transform:translateY(-2px)!important;filter:brightness(1.05)!important;box-shadow:0 20px 40px rgba(243,200,75,.25)!important}
      .smv-optional-field{display:none!important}.smv-optional-open .smv-optional-field{display:grid!important}.smv-more-preferences{margin:24px 0 7px;padding:14px 18px;border:1px solid rgba(25,216,189,.28);border-radius:12px;background:rgba(25,216,189,.055);color:#bfe2dd;font-size:17px;font-weight:900;cursor:pointer}.smv-required-note{margin:16px 0 0;color:#9cc1bc;font-size:16px;line-height:1.55;font-weight:600}
      #customerEnquiryMessage{display:none!important;margin:24px 0 4px!important;padding:22px 24px!important;border-radius:17px!important;font-size:18px!important;line-height:1.55!important;font-weight:800!important}#customerEnquiryMessage.success{display:block!important;border:1px solid rgba(25,216,189,.55)!important;background:linear-gradient(135deg,rgba(25,216,189,.14),rgba(25,216,189,.055))!important;color:#dffffa!important;box-shadow:0 15px 34px rgba(25,216,189,.08)!important}#customerEnquiryMessage.error{display:block!important;border:1px solid rgba(255,111,111,.42)!important;background:rgba(255,90,90,.08)!important;color:#ffd2d2!important}
      .smv-confirmation-title{display:block!important;margin-bottom:6px!important;color:#fff!important;font-size:23px!important;font-weight:1000!important}.smv-confirmation-sub{display:block!important;color:#bce2dc!important;font-size:16px!important;font-weight:650!important}
      .home-venue-actions{position:static!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}.home-venue-actions .primary-btn,.home-venue-actions .secondary-btn{position:static!important;inset:auto!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:48px!important;white-space:nowrap!important}.home-venue-actions .primary-btn{background:linear-gradient(135deg,#20dcc3,#0fc8b0)!important;color:#02211c!important;font-weight:950!important}
      @media(max-width:1050px){#customerEnquiryForm .form-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.smv-ai-form-banner{grid-template-columns:1fr}.smv-ai-live{justify-content:flex-start}}
      @media(max-width:680px){#enquiry{width:calc(100% - 16px)!important;margin:18px auto 30px!important;padding:34px 12px 42px!important;border-radius:22px!important}#enquiry>.section-heading{display:block!important;margin-bottom:20px!important}#enquiry>.section-heading h2{font-size:39px!important}#enquiry>.section-heading>p{margin-top:12px!important;font-size:17px!important}#enquiry .section-kicker{font-size:13px!important}#customerEnquiryForm{padding:19px!important;border-radius:19px!important}#customerEnquiryForm .form-grid{grid-template-columns:1fr!important;gap:15px!important}.smv-ai-form-banner{padding:19px!important}.smv-ai-form-banner strong{font-size:23px!important}.smv-ai-form-banner p{font-size:16px!important}.smv-ai-live span{font-size:13px!important;padding:8px 11px!important}#customerEnquiryForm .form-section-title{font-size:15px!important}#customerEnquiryForm .field label{font-size:14px!important}#customerEnquiryForm .field input,#customerEnquiryForm .field select,#customerEnquiryForm .field textarea{font-size:17px!important;min-height:58px!important}#customerEnquiryForm #plannerSummaryPreview{font-size:15px!important}#customerEnquiryForm .primary-btn[type="submit"],#customerEnquiryForm button[type="submit"]{font-size:17px!important;min-height:62px!important}.smv-more-preferences{font-size:15px!important}.smv-required-note{font-size:14px!important}#customerEnquiryMessage{font-size:16px!important}.home-venue-actions{grid-template-columns:1fr 1fr!important}}
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
      more.addEventListener("click",function(){
        var open=form.classList.toggle("smv-optional-open");more.textContent=open?"− Hide optional preferences":"＋ Add optional preferences";
      });
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
      var text=String(message.textContent||"").trim();
      if(!text)return;
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