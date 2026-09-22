(function(){"use strict";
const byId=id=>document.getElementById(id);
const clean=v=>String(v==null?"":v).trim();
const money=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n):null};
const esc=v=>String(v==null?"":v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
function capacity(v){const a=Number(v.capacity_min||0),b=Number(v.capacity_max||0);return a&&b?a.toLocaleString("en-IN")+"–"+b.toLocaleString("en-IN")+" guests":b?"Up to "+b.toLocaleString("en-IN")+" guests":a?a.toLocaleString("en-IN")+"+ guests":"On request"}
function price(v){const a=money(v.price_min_per_person),b=money(v.price_max_per_person);return a&&b?a+"–"+b+" / person":a?"From "+a+" / person":b?"Up to "+b+" / person":"Quote on request"}
function food(v){if(v.food_veg&&v.food_non_veg)return"Veg + Non-Veg";if(v.food_veg)return"Vegetarian";if(v.food_non_veg)return"Non-Vegetarian";return"Confirm menu"}
function stay(v){const n=Math.floor(Number(v.room_count||0));return v.rooms_available?(n>0?n+" rooms":"Rooms available"):"No rooms listed"}
function events(v){const raw=v.event_types||[];return(Array.isArray(raw)?raw:String(raw).split(/[,|]/)).map(clean).filter(Boolean).slice(0,8)}
function makeDesk(v){
 if(document.getElementById("smvSignatureDesk"))return;
 const facts=document.querySelector(".venue-profile-facts");if(!facts)return;
 const ev=events(v);
 const desk=document.createElement("section");desk.id="smvSignatureDesk";desk.className="smv-signature-desk";
 desk.innerHTML=
  '<div class="smv-signature-desk-head"><div><p class="smv-signature-kicker">SELECT MY VENUE · DECISION DESK</p><h2>Is this venue right for your celebration?</h2></div><p>Four essentials first: guest fit, spend, stay and food. If these work for you, explore the venue story, photographs and planning details below.</p></div>'+
  '<div class="smv-signature-compass">'+
    '<div class="smv-compass-item"><small>01 · Guest fit</small><strong>'+esc(capacity(v))+'</strong><span>Use this as your first shortlist check.</span></div>'+
    '<div class="smv-compass-item"><small>02 · Spend guide</small><strong>'+esc(price(v))+'</strong><span>Final package depends on date, menu and inclusions.</span></div>'+
    '<div class="smv-compass-item"><small>03 · Stay plan</small><strong>'+esc(stay(v))+'</strong><span>Useful when family or outstation guests need accommodation.</span></div>'+
    '<div class="smv-compass-item"><small>04 · Food plan</small><strong>'+esc(food(v))+'</strong><span>Confirm menu choices and catering rules before booking.</span></div>'+
  '</div>'+
  (ev.length?'<div class="smv-signature-events"><b>Celebrations this venue supports</b>'+ev.map(x=>'<span>'+esc(x)+'</span>').join("")+'</div>':"")+
  '<div class="smv-signature-cta"><button class="primary" id="smvSignatureAvailability" type="button">Check Price & Availability</button><button id="smvSignatureVisit" type="button">Request a Site Visit</button><a id="smvSignatureMap" href="#" target="_blank" rel="noopener" hidden>View Location</a></div>';
 facts.insertAdjacentElement("afterend",desk);
 byId("smvSignatureAvailability")?.addEventListener("click",()=>byId("venueProfileQuote")?.click());
 byId("smvSignatureVisit")?.addEventListener("click",()=>document.querySelector('.venue-quote-trigger[data-quote-intent="site-visit"]')?.click());
 const sourceMap=byId("venueProfileMap"),map=byId("smvSignatureMap");
 if(sourceMap&&map&&!sourceMap.hidden&&/^https?:/i.test(sourceMap.href)){map.href=sourceMap.href;map.hidden=false}
}
function refineCopy(){
 const quickTitle=document.querySelector(".venue-quick-title");if(quickTitle)quickTitle.textContent="Check your date & package";
 const quickSub=document.querySelector(".venue-quick-subtitle");if(quickSub)quickSub.innerHTML="Your selected venue is attached automatically. <strong>No long form.</strong>";
 const panels=[...document.querySelectorAll(".venue-profile-content>.venue-profile-panel")];
 if(panels[0]){const e=panels[0].querySelector(".eyebrow"),h=panels[0].querySelector("h2");if(e)e.textContent="THE VENUE STORY";if(h&&!/^Discover/i.test(h.textContent||""))h.textContent="A closer look at the venue."}
 if(panels[1]){const e=panels[1].querySelector(".eyebrow"),h=panels[1].querySelector("h2");if(e)e.textContent="AMENITIES & SERVICES";if(h)h.textContent="What is available here"}
 if(panels[2]){const e=panels[2].querySelector(".eyebrow"),h=panels[2].querySelector("h2");if(e)e.textContent="SHORTLIST INSIGHT";if(h)h.textContent="Why this venue may suit your celebration"}
 const gallery=document.querySelector("#venueProfileGallerySection h2");if(gallery)gallery.textContent="See the spaces before you decide.";
 const planning=document.querySelector("#smvPlanningEssentials h2");if(planning)planning.textContent="What to confirm before you reserve.";
 const faq=document.querySelector("#smvVenueFaq h2");if(faq)faq.textContent="Questions worth answering before you book.";
}
function cleanNav(){
 const nav=document.querySelector(".smv-profile-nav");if(!nav)return;
 nav.querySelectorAll("a").forEach(a=>{
  const href=a.getAttribute("href")||"";
  if(!href.startsWith("#"))return;
  const target=document.querySelector(href);
  if(!target||target.hidden||getComputedStyle(target).display==="none")a.remove();
 });
}
function apply(){
 const v=window.__SMV_PUBLIC_VENUE;
 if(!v)return false;
 makeDesk(v);refineCopy();cleanNav();
 return true;
}
function start(){
 let tries=0;
 const tick=()=>{if(apply())return;if(tries++<100)setTimeout(tick,100)};
 tick();
 const observer=new MutationObserver(()=>{if(window.__SMV_PUBLIC_VENUE){refineCopy();cleanNav()}});
 observer.observe(document.body,{childList:true,subtree:true});
 setTimeout(()=>observer.disconnect(),12000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();