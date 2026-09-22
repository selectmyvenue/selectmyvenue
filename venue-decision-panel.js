(function(){"use strict";
const SUPABASE_URL="https://uajqwyoqbbswkfiwosyw.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
const id=new URLSearchParams(location.search).get("id")||"";
const client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const clean=v=>String(v??"").trim();
const money=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n):null};
const events=v=>{const raw=v?.event_types||[];return (Array.isArray(raw)?raw:String(raw).split(/[,|]/)).map(clean).filter(Boolean)};
const locationText=v=>{try{if(window.SMVPublicDetails?.location)return window.SMVPublicDetails.location(v)}catch(_){}return [v?.area,v?.city].map(clean).filter(Boolean).join(", ")||"Location on request"};

function card(icon,label,value){return '<div class="smv-decision-card"><div class="icon">'+esc(icon)+'</div><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>'}
function feature(ok,label,value){
  if(!ok)return "";
  return '<div><b>✓</b><span>'+esc(label+(value?" · "+value:""))+'</span></div>';
}
function capacity(v){
  const a=Number(v?.capacity_min||0),b=Number(v?.capacity_max||0);
  return a&&b?a.toLocaleString("en-IN")+"–"+b.toLocaleString("en-IN")+" guests":b?"Up to "+b.toLocaleString("en-IN")+" guests":a?a.toLocaleString("en-IN")+"+ guests":"On request";
}
function food(v){
  if(v?.food_veg&&v?.food_non_veg)return "Veg + Non-Veg";
  if(v?.food_veg)return "Vegetarian";
  if(v?.food_non_veg)return "Non-Vegetarian";
  return "Ask venue";
}

function render(v){
  if(document.getElementById("smvDecisionPanel"))return;
  const facts=document.querySelector(".venue-profile-facts");
  if(!facts)return;
  const roomCount=Math.max(0,Math.floor(Number(v.room_count||0)));
  const rooms=v.rooms_available?(roomCount?roomCount+" room"+(roomCount===1?"":"s"):"Available"):"Not listed";
  const price=money(v.price_min_per_person);
  const evt=events(v);
  const map=/^https?:\/\//i.test(clean(v.google_maps_url))?clean(v.google_maps_url):"";
  const features=[
    feature(v.parking_available,"Parking","Available"),
    feature(v.catering_available,"Catering","Available"),
    feature(v.decoration_available,"Decoration","Available")
  ].filter(Boolean).join("");

  const panel=document.createElement("section");
  panel.id="smvDecisionPanel";
  panel.className="smv-decision-panel";
  panel.innerHTML=
    '<div class="smv-decision-head"><div><p class="eyebrow">VENUE EXPERIENCE</p><h2>What this venue can offer your celebration.</h2></div><p>Use this section for services and event fit. Price, capacity and location are already shown above so they are not repeated here.</p></div>'+
    '<div class="smv-decision-grid">'+
      card("🛏","Rooms / stay",rooms)+
      card("🍽","Food",food(v))+
      card("P","Parking",v.parking_available?"Available":"Confirm with venue")+
      card("♨","Catering",v.catering_available?"Available":"Confirm policy")+
      card("✦","Decoration",v.decoration_available?"Available":"Confirm policy")+
      card("♡","Celebration fit",evt.length?(evt.slice(0,2).join(" · ")+(evt.length>2?" + more":"")):"Ask venue")+
    '</div>'+
    (evt.length?'<div class="smv-event-fit"><div class="smv-event-fit-title"><strong>Suitable celebrations</strong><small>Based on venue-listed event support</small></div><div class="smv-event-chips">'+evt.map(x=>'<span class="smv-event-chip">✓ '+esc(x)+'</span>').join("")+'</div></div>':"")+
    '<div class="smv-decision-bottom"><div class="smv-feature-summary">'+(features||'<div><b>✓</b><span>Verified venue details available</span></div>')+'</div>'+
      '<div class="smv-decision-actions"><strong>Does this venue fit your event?</strong><p>Check the date and package, or request a site visit before deciding.</p><div class="smv-decision-action-row"><button class="primary" id="smvDecisionAvailability" type="button">Check Price & Availability</button><button id="smvDecisionVisit" type="button">Request Site Visit</button>'+(map?'<a href="'+esc(map)+'" target="_blank" rel="noopener">View Map</a>':"")+'</div></div></div>'+
    '<p class="smv-decision-note">Published venue information is for discovery and shortlisting. Final pricing, availability, inclusions and venue policies should be confirmed for your event date.</p>';

  facts.insertAdjacentElement("afterend",panel);
  panel.querySelector("#smvDecisionAvailability")?.addEventListener("click",()=>document.getElementById("venueProfileQuote")?.click());
  panel.querySelector("#smvDecisionVisit")?.addEventListener("click",()=>document.querySelector('.venue-quote-trigger[data-quote-intent="site-visit"]')?.click());
}

async function load(){
  if(!client||!id)return;
  try{
    const r=await client.rpc("smv_public_venues");
    if(r.error)return;
    const venue=(Array.isArray(r.data)?r.data:[]).map(x=>x?.venue||x).find(x=>String(x?.id)===String(id));
    if(!venue)return;
    let tries=0;
    const wait=()=>{const profile=document.getElementById("venueProfile");if(profile&&!profile.hidden&&document.querySelector(".venue-profile-facts"))render(venue);else if(tries++<80)setTimeout(wait,100)};
    wait();
  }catch(error){console.info("Decision panel unavailable",error)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
})();