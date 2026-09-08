(function(){"use strict";const $=id=>document.getElementById(id);const clean=s=>String(s||"").replace(/^⌖\s*/,"").trim();function text(id,fallback){return clean($(id)?.textContent)||fallback}function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}function wait(){const profile=$("venueProfile");if(!profile||profile.hidden){setTimeout(wait,180);return}install(profile)}function install(profile){if($("smvMarketplaceUpgrade"))return;const name=text("venueProfileName","this venue"),location=text("venueProfileLocation","Delhi NCR"),capacity=text("venueProfileCapacity","available on request"),price=text("venueProfilePrice","available on request"),type=text("venueProfileFactType","venue");const facilities=[...document.querySelectorAll("#venueProfileFeatures strong")].map(x=>clean(x.textContent)).filter(Boolean);const nav=document.createElement("nav");nav.className="smv-profile-nav";nav.setAttribute("aria-label","Venue profile sections");nav.innerHTML='<a href="#venueProfileGallerySection">Photos</a><a href="#venueProfileFeatures">Facilities</a><a href="#smvPlanningEssentials">Planning Essentials</a><a href="#smvVenueFaq">FAQs</a><a href="#venueQuickEnquiryForm">Check Availability</a>';const facts=document.querySelector(".venue-profile-facts");if(facts)facts.insertAdjacentElement("afterend",nav);const checks=[['👥','Guest capacity',capacity],['₹','Pricing guidance',price],['⌖','Location',location],['✦','Venue type',type]];if(facilities.length)checks.push(['✓','Listed facilities',facilities.slice(0,3).join(' · ')]);checks.push(['◎','Before you book','Confirm final package, timings, inclusions and policies with the venue.']);const faqs=[['What is the listed capacity of '+name+'?',capacity==='available on request'?'Capacity is available on request. Submit your event details and Select My Venue can help confirm the suitable guest range.':'The current listed capacity is '+capacity+'. Final seating and event-format capacity should be reconfirmed for your date.'],['What is the price for '+name+'?',price==='available on request'?'Pricing is available on request and may vary by event date, guest count and package.':'The profile currently shows '+price+'. Final pricing can vary by date, menu, décor and package inclusions.'],['Where is '+name+' located?','The venue is listed in '+location+'. Use the map option when available or request location guidance from Select My Venue.'],['Can I visit the venue before booking?','Yes, you can request a preferred site-visit date through the enquiry panel. The visit is subject to venue confirmation and availability.'],['What should I confirm before paying an advance?','Confirm the final package, taxes, catering and décor inclusions, event timings, parking, music rules, cancellation terms and any venue-specific restrictions directly before payment.']];const section=document.createElement("section");section.id="smvMarketplaceUpgrade";section.className="smv-marketplace-upgrade";section.innerHTML='<div class="smv-marketplace-grid"><div id="smvPlanningEssentials" class="smv-premium-panel"><p class="eyebrow">SMART PLANNING ESSENTIALS</p><h2>Know the important details before you shortlist.</h2><p>A quick factual snapshot using the information currently listed for this venue.</p><div class="smv-check-grid">'+checks.map(x=>'<div class="smv-check-card"><span class="smv-check-icon">'+esc(x[0])+'</span><div><strong>'+esc(x[1])+'</strong><span>'+esc(x[2])+'</span></div></div>').join('')+'</div><div class="smv-site-visit"><div><strong>Want to see it in person?</strong><span>Choose a preferred event/site-visit date and send one quick request.</span></div><button id="smvSiteVisitBtn" type="button">Plan a Site Visit</button></div><p class="smv-trust-note">Venue information can change. Select My Venue helps with discovery and enquiries; final commercial terms are confirmed by the venue.</p></div><div id="smvVenueFaq" class="smv-premium-panel"><p class="eyebrow">VENUE FAQs</p><h2>Useful answers before you enquire.</h2><p>Clear answers based on the profile, plus the key points worth confirming.</p><div class="smv-faq-list">'+faqs.map((x,i)=>'<div class="smv-faq-item"><button type="button" aria-expanded="false" aria-controls="smvFaqA'+i+'">'+esc(x[0])+'</button><div id="smvFaqA'+i+'" class="smv-faq-answer">'+esc(x[1])+'</div></div>').join('')+'</div></div></div>';const layout=document.querySelector(".venue-profile-layout");if(layout)layout.insertAdjacentElement("afterend",section);section.querySelectorAll('.smv-faq-item button').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.parentElement,open=item.classList.toggle('open');btn.setAttribute('aria-expanded',open?'true':'false')}));$("smvSiteVisitBtn")?.addEventListener('click',()=>{const form=$("venueQuickEnquiryForm")||document.querySelector('.venue-profile-enquiry');form?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>{$("venueQuickDate")?.focus();const status=$("venueQuickStatus");if(status){status.textContent='Choose your preferred date and submit the request. We’ll confirm the visit with the venue.';status.className='venue-quick-status'}},450)});addFaqSchema(faqs,name,location);addSeoContext(profile,name,location,type)}function addFaqSchema(faqs,name,location){if($("smvFaqStructuredData"))return;const script=document.createElement('script');script.id='smvFaqStructuredData';script.type='application/ld+json';script.textContent=JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(x=>({'@type':'Question',name:x[0],acceptedAnswer:{'@type':'Answer',text:x[1]}}))});document.head.appendChild(script);const desc=$("venueMetaDescription");if(desc){const current=desc.getAttribute('content')||'';if(!/site visit/i.test(current))desc.setAttribute('content',current.replace(/\.$/,'')+'. Explore facilities, planning FAQs and request a site visit or personalised quote in '+location+'.')}}function addSeoContext(profile,name,location,type){if($("smvSeoContext"))return;const el=document.createElement('div');el.id='smvSeoContext';el.className='smv-seo-context';el.innerHTML='<strong>'+esc(name)+'</strong> is a listed '+esc(type.toLowerCase())+' in '+esc(location)+'. Compare capacity, pricing guidance, facilities and event requirements, then submit one enquiry to Select My Venue for availability and venue assistance.';profile.appendChild(el)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait,{once:true});else wait()})();

(function(){
  "use strict";
  const SUPABASE_URL="https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY="sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const WHATSAPP_NUMBER="918368322256";
  const $=id=>document.getElementById(id);
  const clean=value=>String(value||"").replace(/^⌖\s*/,"").trim();
  const mobile=value=>clean(value).replace(/\D/g,"").slice(-10);
  let client=null;

  function installCompactStyle(){
    if($("smvVenueFinalCompactFix"))return;
    const style=document.createElement("style");
    style.id="smvVenueFinalCompactFix";
    style.textContent=`
      body.venue-profile-page{font-size:14px!important;line-height:1.55!important}
      .venue-profile-main{width:min(1220px,calc(100% - 22px))!important;padding-top:12px!important}
      .venue-profile-cover,.venue-profile-media{max-height:410px!important;min-height:260px!important}
      .venue-profile-titlebar{padding:12px 16px!important}
      .venue-profile-titlebar h1,#venueProfileName{font-size:clamp(26px,2.6vw,40px)!important;line-height:1.05!important}
      .venue-profile-location{font-size:13px!important;line-height:1.35!important}
      .venue-profile-panel,.venue-profile-enquiry{padding:15px 16px!important;border-radius:15px!important}
      .venue-profile-panel h2,.venue-profile-enquiry h2{font-size:clamp(20px,1.9vw,28px)!important;line-height:1.1!important;margin:4px 0 8px!important}
      .venue-profile-panel p,.venue-profile-enquiry p,#venueProfileDescription{font-size:13px!important;line-height:1.55!important}
      .venue-profile-details-strip{gap:9px!important;margin:12px 0!important;padding:12px!important;border-radius:16px!important}
      .venue-profile-detail-item{min-height:58px!important;padding:10px!important;border-radius:13px!important;grid-template-columns:34px 1fr!important;gap:2px 9px!important}
      .venue-profile-detail-item b{width:34px!important;height:34px!important;font-size:16px!important}
      .venue-profile-detail-item span{font-size:10px!important}.venue-profile-detail-item strong{font-size:13px!important;line-height:1.25!important}
      .venue-profile-feature{min-height:42px!important;padding:8px!important}.venue-profile-feature strong{font-size:12px!important;line-height:1.3!important}
      .venue-quick-enquiry-form{gap:8px!important;margin:10px 0!important;padding:13px!important;border-radius:14px!important}.venue-quick-title{font-size:18px!important}.venue-quick-subtitle{font-size:12px!important}.venue-quick-enquiry-form input,.venue-quick-enquiry-form select{height:40px!important;font-size:13px!important}.venue-quick-enquiry-form button{height:43px!important;font-size:13px!important}.venue-quick-status.success{display:block!important;margin-top:9px!important;padding:13px!important;border-radius:12px!important;background:#eafff8!important;color:#06704f!important;font-size:14px!important;font-weight:900!important;line-height:1.45!important}.venue-quick-status.error{color:#a4161a!important;font-weight:900!important}.venue-quote-status.success{display:block!important;margin-top:10px!important;padding:14px!important;border-radius:12px!important;background:#eafff8!important;color:#06704f!important;font-weight:900!important;line-height:1.45!important}.smv-venue-whatsapp-opt{display:flex!important;gap:8px!important;align-items:flex-start!important;margin:8px 0!important;font-size:12px!important;font-weight:850!important;color:#3c5751!important}.smv-venue-whatsapp-opt input{width:17px!important;height:17px!important;accent-color:#19d8bd!important;flex:0 0 auto!important}
      @media(max-width:700px){.venue-profile-main{width:calc(100% - 12px)!important}.venue-profile-cover,.venue-profile-media{max-height:300px!important;min-height:210px!important}.venue-profile-titlebar h1,#venueProfileName{font-size:26px!important}.venue-profile-details-strip{grid-template-columns:1fr!important}.venue-profile-layout{gap:10px!important}.venue-quick-row{grid-template-columns:1fr!important}.venue-mobile-actions button,.venue-mobile-actions a{font-size:11px!important}}
    `;
    document.head.appendChild(style);
  }

  function pageLabel(){return `${document.title||"Select My Venue"} (${location.pathname||"/"})`;}
  function venueInfo(){
    const params=new URLSearchParams(location.search);
    return {
      id:clean(params.get("id")||params.get("venue")||""),
      name:clean($("venueProfileName")?.textContent)||"Selected venue",
      location:clean($("venueProfileLocation")?.textContent)||"Delhi NCR"
    };
  }
  function sourceFor(kind){const v=venueInfo();return `${kind} | Venue: ${v.name} | Venue ID: ${v.id||"not available"} | Page: ${pageLabel()}`;}
  function dupeKey(d){return [d.mobile,d.occasion,d.eventDate,d.venueId,d.kind].join("|").toLowerCase();}
  function isDupe(d){try{return sessionStorage.getItem("smv-venue-last-key")===dupeKey(d)&&Date.now()-Number(sessionStorage.getItem("smv-venue-last-time")||0)<90000}catch(_){return false}}
  function markDupe(d){try{sessionStorage.setItem("smv-venue-last-key",dupeKey(d));sessionStorage.setItem("smv-venue-last-time",String(Date.now()))}catch(_){}}
  function whatsappText(d){return ["Hi Select My Venue, I submitted a venue enquiry on your website.",d.name?`Name: ${d.name}`:"",d.mobile?`Mobile: ${d.mobile}`:"",d.venueName?`Interested venue: ${d.venueName}`:"",d.occasion?`Event: ${d.occasion}`:"",d.eventDate?`Event date: ${d.eventDate}`:"",d.guests?`Guests: ${d.guests}`:"",d.budget?`Budget/person: ₹${d.budget}`:"",`Page: ${pageLabel()}`,"Please call me with suitable options."].filter(Boolean).join("\n")}
  function openWa(d){window.open("https://wa.me/"+WHATSAPP_NUMBER+"?text="+encodeURIComponent(whatsappText(d)),"_blank","noopener,noreferrer")}
  function addWaOption(form,before){if(!form||form.querySelector(".smv-venue-whatsapp-opt"))return;const label=document.createElement("label");label.className="smv-venue-whatsapp-opt";label.innerHTML='<input type="checkbox" name="send_whatsapp"> <span>Send the details on WhatsApp as well.</span>';before?.insertAdjacentElement("beforebegin",label)}
  function success(node,text){if(!node)return;node.textContent=text;node.className=(node.id==="venueQuoteStatus"?"venue-quote-status":"venue-quick-status")+" success";setTimeout(()=>node.scrollIntoView({behavior:"smooth",block:"center"}),80)}
  function error(node,text){if(!node)return;node.textContent=text;node.className=(node.id==="venueQuoteStatus"?"venue-quote-status":"venue-quick-status")+" error"}
  async function insert(payload){if(!client){client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})} if(!client)throw new Error("Supabase client unavailable"); return await client.from("customer_enquiries").insert(payload)}

  async function submitQuote(event){
    const form=event.target;if(form?.id!=="venueQuoteForm")return;
    event.preventDefault();event.stopImmediatePropagation();
    const v=venueInfo(),node=$("venueQuoteStatus"),button=$("venueQuoteSubmit");
    const d={kind:"Website - Venue Profile Quote",venueName:v.name,venueId:v.id,name:clean($("venueQuoteName")?.value),mobile:mobile($("venueQuoteMobile")?.value),occasion:clean($("venueQuoteEvent")?.value),eventDate:$("venueQuoteDate")?.value||null,guests:Number($("venueQuoteGuests")?.value||0)||null,budget:Number($("venueQuoteBudget")?.value||0)||null,sendWa:!!form.querySelector('input[name="send_whatsapp"]')?.checked};
    if(isDupe(d)){success(node,"✓ Your requirement is already received. Our team will get back to you or call you within 30 minutes to 1 hour.");return}
    if(d.name.length<2){error(node,"Please enter your name.");return} if(d.mobile.length!==10){error(node,"Please enter a valid 10-digit mobile number.");return} if(!d.occasion){error(node,"Please select your event.");return}
    const source=sourceFor(d.kind),requirements=[`Specific venue enquiry: ${v.name}`,`Venue ID: ${v.id||"not available"}`,`Venue location: ${v.location}`,`Submitted from: ${pageLabel()}`].join("\n");
    button.disabled=true;button.textContent="Sending your enquiry…";node.textContent="";node.className="venue-quote-status";
    const {error:err}=await insert({customer_name:d.name,mobile:d.mobile,location:v.location,occasion:d.occasion,event_date:d.eventDate,guests:d.guests,budget_per_person:d.budget,requirements,source,status:"new"});
    button.disabled=false;button.textContent="Check Price & Availability →";
    if(err){console.error(err);error(node,"We could not submit this enquiry right now. Please try again or use WhatsApp.");return}
    markDupe(d);form.reset();success(node,"✓ Requirement received! Our team will get back to you or call you within 30 minutes to 1 hour with this venue’s price and availability.");if(d.sendWa)setTimeout(()=>openWa(d),250);
  }

  async function submitQuick(event){
    const form=event.target;if(form?.id!=="venueQuickEnquiryForm")return;
    event.preventDefault();event.stopImmediatePropagation();
    const v=venueInfo(),node=$("venueQuickStatus"),button=$("venueQuickSubmit");
    const d={kind:"Website - Venue Profile Quick Enquiry",venueName:v.name,venueId:v.id,name:clean($("venueQuickName")?.value),mobile:mobile($("venueQuickMobile")?.value),email:clean($("venueQuickEmail")?.value),occasion:clean($("venueQuickEvent")?.value),eventDate:$("venueQuickDate")?.value||null,guests:Number($("venueQuickGuests")?.value||0)||null,budget:Number($("venueQuickBudget")?.value||0)||null,sendWa:!!form.querySelector('input[name="send_whatsapp"]')?.checked};
    if(isDupe(d)){success(node,"✓ Your requirement is already received. Our team will get back to you or call you within 30 minutes to 1 hour.");return}
    if(!d.occasion){error(node,"Please select your event.");return} if(d.name.length<2){error(node,"Please enter your name.");return} if(d.mobile.length!==10){error(node,"Please enter a valid 10-digit mobile number.");return} if(d.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)){error(node,"Please enter a valid email address.");return}
    const source=sourceFor(d.kind),requirements=[`Specific venue enquiry: ${v.name}`,`Venue ID: ${v.id||"not available"}`,`Venue location: ${v.location}`,`Submitted from: ${pageLabel()}`].join("\n");
    button.disabled=true;button.textContent="Checking…";node.textContent="";node.className="venue-quick-status";
    const {error:err}=await insert({customer_name:d.name,mobile:d.mobile,email:d.email||null,location:v.location,occasion:d.occasion,event_date:d.eventDate,guests:d.guests,budget_per_person:d.budget,requirements,source,status:"new"});
    button.disabled=false;button.textContent="Check Price & Availability →";
    if(err){console.error(err);error(node,"Unable to send right now. Please try again or use WhatsApp.");return}
    markDupe(d);form.reset();success(node,"✓ Requirement received! Our team will get back to you or call you within 30 minutes to 1 hour with this venue’s price and availability.");if(d.sendWa)setTimeout(()=>openWa(d),250);
  }

  function install(){
    installCompactStyle();
    const qf=$("venueQuoteForm"),qb=$("venueQuoteSubmit"); if(qf&&qb)addWaOption(qf,qb);
    const quick=$("venueQuickEnquiryForm"),quickBtn=$("venueQuickSubmit"); if(quick&&quickBtn)addWaOption(quick,quickBtn);
    document.addEventListener("submit",submitQuote,true);
    document.addEventListener("submit",submitQuick,true);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
  new MutationObserver(()=>install()).observe(document.documentElement,{childList:true,subtree:true});
})();
