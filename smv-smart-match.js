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
      #enquiry{display:block!important;width:calc(100% - 32px)!important;max-width:1720px!important;margin:34px auto 48px!important;padding:54px 42px 60px!important;border:1px solid rgba(25,216,189,.28)!important;border-radius:30px!important;background:radial-gradient(circle at 8% 5%,rgba(25,216,189,.12),transparent 28%),radial-gradient(circle at 92% 6%,rgba(243,200,75,.08),transparent 24%),linear-gradient(145deg,#052d29,#031f1d 52%,#021715)!important;box-shadow:0 30px 78px rgba(0,0,0,.28)!important}
      #enquiry::before{display:none!important;content:none!important}
      #enquiry>.section-heading{display:flex!important;max-width:1450px!important;margin:0 auto 24px!important;align-items:end!important;justify-content:space-between!important;gap:30px!important}
      #enquiry>.section-heading>div{max-width:760px!important}#enquiry>.section-heading>p{max-width:520px!important;margin:0!important;color:#9fc5c0!important;font-size:14px!important;line-height:1.65!important}
      #enquiry .section-kicker{color:#f3c84b!important;font-size:10px!important;letter-spacing:.14em!important}#enquiry>.section-heading h2{margin:8px 0 0!important;color:#fff!important;font-size:clamp(38px,4vw,60px)!important;line-height:1!important;letter-spacing:-.04em!important}#enquiry>.section-heading h2 span{color:#22d9c0!important}
      #customerEnquiryForm{position:relative!important;left:auto!important;width:min(1450px,100%)!important;height:auto!important;overflow:visible!important;opacity:1!important;pointer-events:auto!important;margin:0 auto!important;padding:28px!important;border:1px solid rgba(25,216,189,.28)!important;border-radius:24px!important;background:linear-gradient(145deg,rgba(7,45,41,.96),rgba(3,28,26,.98))!important;box-shadow:0 24px 58px rgba(0,0,0,.22),inset 0 1px rgba(255,255,255,.035)!important}
      .smv-ai-form-banner{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:18px;align-items:center;margin-bottom:24px;padding:20px 22px;border:1px solid rgba(243,200,75,.28);border-radius:18px;background:linear-gradient(135deg,rgba(243,200,75,.07),rgba(25,216,189,.06))}.smv-ai-form-banner strong{display:block;color:#fff;font-size:20px;margin-bottom:5px}.smv-ai-form-banner p{margin:0;color:#9fc5c0;font-size:12px;line-height:1.55}.smv-ai-live{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}.smv-ai-live span{padding:7px 10px;border-radius:999px;border:1px solid rgba(25,216,189,.18);background:rgba(25,216,189,.055);color:#b9ddd8;font-size:9px;font-weight:850}.smv-ai-live span.ready{color:#ffe599;border-color:rgba(243,200,75,.34);background:rgba(243,200,75,.06)}
      #customerEnquiryForm .form-section-title{margin:20px 0 12px!important;color:#f3c84b!important;font-size:10px!important;letter-spacing:.13em!important}#customerEnquiryForm .form-section-title:first-of-type{margin-top:0!important}
      #customerEnquiryForm .form-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important}#customerEnquiryForm .field{min-width:0!important}#customerEnquiryForm .field label{color:#a9cbc6!important;font-size:9px!important;font-weight:900!important;letter-spacing:.08em!important}#customerEnquiryForm .field input,#customerEnquiryForm .field select,#customerEnquiryForm .field textarea{width:100%!important;min-height:54px!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:13px!important;background:rgba(0,0,0,.16)!important;color:#f3fbfa!important;font-size:14px!important;outline:none!important}#customerEnquiryForm .field input:focus,#customerEnquiryForm .field select:focus,#customerEnquiryForm .field textarea:focus{border-color:#19d8bd!important;box-shadow:0 0 0 3px rgba(25,216,189,.08)!important}
      #customerEnquiryForm .primary-btn[type="submit"],#customerEnquiryForm button[type="submit"]{min-height:58px!important;padding:0 28px!important;border-radius:14px!important;background:linear-gradient(135deg,#f5cf55,#e8b82f)!important;color:#241b02!important;font-size:14px!important;font-weight:1000!important;box-shadow:0 14px 30px rgba(243,200,75,.16)!important}
      .smv-optional-field{display:none!important}.smv-optional-open .smv-optional-field{display:grid!important}.smv-more-preferences{margin:18px 0 4px;padding:10px 14px;border:1px solid rgba(25,216,189,.2);border-radius:11px;background:rgba(25,216,189,.045);color:#9fcfc8;font-size:11px;font-weight:850;cursor:pointer}.smv-required-note{margin:12px 0 0;color:#6f9c96;font-size:10px}
      .home-venue-actions{position:static!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}.home-venue-actions .primary-btn,.home-venue-actions .secondary-btn{position:static!important;inset:auto!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:48px!important;white-space:nowrap!important}.home-venue-actions .primary-btn{background:linear-gradient(135deg,#20dcc3,#0fc8b0)!important;color:#02211c!important;font-weight:950!important}
      @media(max-width:1050px){#customerEnquiryForm .form-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.smv-ai-form-banner{grid-template-columns:1fr}.smv-ai-live{justify-content:flex-start}}
      @media(max-width:680px){#enquiry{width:calc(100% - 16px)!important;margin:18px auto 30px!important;padding:34px 12px 40px!important;border-radius:22px!important}#enquiry>.section-heading{display:block!important;margin-bottom:18px!important}#enquiry>.section-heading h2{font-size:36px!important}#enquiry>.section-heading>p{margin-top:10px!important;font-size:12px!important}#customerEnquiryForm{padding:18px!important;border-radius:18px!important}#customerEnquiryForm .form-grid{grid-template-columns:1fr!important}.smv-ai-form-banner{padding:16px}.smv-ai-form-banner strong{font-size:18px}.home-venue-actions{grid-template-columns:1fr 1fr!important}}
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
      var values=[
        ["customerEventType","Event"],["customerLocation","Location"],["customerGuests","Guests"],["customerBudget","Budget"]
      ];
      var live=byId("smvAiLive");if(!live)return;
      live.innerHTML=values.map(function(pair){var node=byId(pair[0]);var value=node&&String(node.value||"").trim();return '<span class="'+(value?'ready':'')+'">'+(value?'✓ ':'')+pair[1]+'</span>';}).join("");
    }
    ["customerEventType","customerLocation","customerGuests","customerBudget"].forEach(function(id){var node=byId(id);if(node){node.addEventListener("input",updateAiLive);node.addEventListener("change",updateAiLive);}});
    updateAiLive();
  }

  function fixVenueQuoteButtons(){
    var buttons=document.querySelectorAll('.home-venue-card .home-venue-actions .primary-btn');
    buttons.forEach(function(button){
      button.textContent="Get Quote";
      button.setAttribute("aria-label","Get Quote for this venue");
      var card=button.closest('.home-venue-card');
      var profile=card&&card.querySelector('.home-venue-actions .secondary-btn[href*="venue.html?id="]');
      if(profile){
        var href=profile.getAttribute("href")||"";
        var quoteHref=href+(href.indexOf("?")>=0?"&":"?")+"quote=1";
        button.setAttribute("href",quoteHref);
      }
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

  function init(){
    loadLuxuryStyles();
    installEnquiryStyles();
    makeSimpleLuxuryForm();
    setupVenueQuoteWatcher();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
