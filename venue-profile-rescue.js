(function(){"use strict";
const SUPABASE_URL="https://uajqwyoqbbswkfiwosyw.supabase.co";
const API_KEY="sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
const venueId=new URLSearchParams(location.search).get("id")||"";
const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(venueId);
const byId=id=>document.getElementById(id);
const clean=v=>String(v==null?"":v).trim();
const esc=v=>String(v==null?"":v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const money=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n):null};
function loc(v){const area=clean(v.area),city=clean(v.city),parts=area.split(",").map(clean).filter(Boolean);if(city&&!parts.some(x=>x.toLowerCase()===city.toLowerCase()))parts.push(city);return [...new Set(parts)].join(", ")||"Location on request"}
function cap(v){const a=Number(v.capacity_min||0),b=Number(v.capacity_max||0);return a&&b?a.toLocaleString("en-IN")+"–"+b.toLocaleString("en-IN")+" guests":b?"Up to "+b.toLocaleString("en-IN")+" guests":a?a.toLocaleString("en-IN")+"+ guests":"On request"}
function price(v){const a=money(v.price_min_per_person),b=money(v.price_max_per_person);return a&&b?a+"–"+b+" per person":a?"From "+a+" per person":b?"Up to "+b+" per person":"Quote on request"}
function forceShow(){const l=byId("venueProfileLoading"),e=byId("venueProfileError"),p=byId("venueProfile");if(l){l.hidden=true;l.style.setProperty("display","none","important")}if(e){e.hidden=true;e.style.setProperty("display","none","important")}if(p){p.hidden=false;p.style.setProperty("display","block","important")}}
function showError(){const l=byId("venueProfileLoading"),e=byId("venueProfileError"),p=byId("venueProfile");if(l){l.hidden=true;l.style.setProperty("display","none","important")}if(p){p.hidden=true;p.style.setProperty("display","none","important")}if(e){e.hidden=false;e.style.setProperty("display","block","important")}}
function render(v){
 const name=clean(v.venue_name)||"Verified Venue",locationText=loc(v),type=clean(v.venue_type)||"Venue",desc=clean(v.description)||"Ask our team for availability, packages and detailed venue information.",cover=clean(v.cover_image_url);
 if(byId("venueBreadcrumb"))byId("venueBreadcrumb").textContent=name;
 if(byId("venueProfileName"))byId("venueProfileName").textContent=name;
 if(byId("venueProfileType"))byId("venueProfileType").textContent=type;
 if(byId("venueProfileFactType"))byId("venueProfileFactType").textContent=type;
 if(byId("venueProfileLocation"))byId("venueProfileLocation").textContent="⌖ "+locationText;
 if(byId("venueProfileCapacity"))byId("venueProfileCapacity").textContent=cap(v);
 if(byId("venueProfilePrice"))byId("venueProfilePrice").textContent=price(v);
 if(byId("venueProfileDescription"))byId("venueProfileDescription").textContent=desc;
 if(byId("venueAboutHeading"))byId("venueAboutHeading").textContent="Discover "+name+".";
 if(byId("venueQuoteVenueName"))byId("venueQuoteVenueName").textContent=name;
 const wa="https://wa.me/918368322256?text="+encodeURIComponent("Hi Select My Venue, I am interested in "+name+". Please share details and availability.");
 if(byId("venueProfileWhatsapp"))byId("venueProfileWhatsapp").href=wa;
 if(byId("venueMobileWhatsapp"))byId("venueMobileWhatsapp").href=wa;
 if(cover&&byId("venueProfileImage")){const i=byId("venueProfileImage");i.src=cover;i.alt=name+" venue";i.hidden=false;i.style.display="block";if(byId("venueProfileFallback")){byId("venueProfileFallback").hidden=true;byId("venueProfileFallback").style.display="none"}}
 const map=clean(v.google_maps_url);if(/^https?:\/\//i.test(map)&&byId("venueProfileMap")){byId("venueProfileMap").href=map;byId("venueProfileMap").hidden=false;byId("venueProfileMap").style.display=""}
 const features=[];if(v.food_veg)features.push(["🥗","Vegetarian food"]);if(v.food_non_veg)features.push(["🍽","Non-vegetarian food"]);if(v.parking_available)features.push(["P","Parking available"]);if(v.rooms_available)features.push(["▣",Number(v.room_count)>0?Number(v.room_count)+" rooms available":"Rooms available"]);if(v.catering_available)features.push(["♨","Catering support"]);if(v.decoration_available)features.push(["✦","Decoration support"]);
 if(byId("venueProfileFeatures"))byId("venueProfileFeatures").innerHTML=features.length?features.map(x=>"<div class='venue-profile-feature'><span>"+esc(x[0])+"</span><strong>"+esc(x[1])+"</strong></div>").join(""):"<div class='venue-profile-feature'><span>✦</span><strong>Venue details available on request</strong></div>";
 if(byId("venueProfileGuestAmenity"))byId("venueProfileGuestAmenity").textContent=v.rooms_available?(Number(v.room_count)>0?Number(v.room_count)+" Rooms":"Rooms available"):v.parking_available?"Parking available":v.food_veg?"Vegetarian food":"Verified venue";
 const hs=[];if(v.capacity_max)hs.push(["Guest fit","Suitable for events up to "+Number(v.capacity_max).toLocaleString("en-IN")+" guests."]);if(v.price_min_per_person)hs.push(["Budget visibility","Listed pricing starts around "+money(v.price_min_per_person)+" per person."]);if(v.parking_available)hs.push(["Guest convenience","Parking is listed as available."]);if(v.rooms_available)hs.push(["Stay option",Number(v.room_count)>0?Number(v.room_count)+" rooms are listed for guests.":"Rooms are listed as available."]);if(v.decoration_available)hs.push(["Event setup","Decoration support is listed as available."]);
 if(byId("venueProfileHighlights"))byId("venueProfileHighlights").innerHTML=hs.slice(0,6).map(x=>"<div class='venue-highlight'><b>"+esc(x[0])+"</b><span>"+esc(x[1])+"</span></div>").join("");
 document.title=name+" | Verified Venue | Select My Venue";forceShow();
}
async function load(){
 if(!valid)return showError();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{
  const res=await fetch(SUPABASE_URL+"/rest/v1/rpc/smv_public_venues",{method:"POST",headers:{"apikey":API_KEY,"Authorization":"Bearer "+API_KEY,"Content-Type":"application/json","Accept":"application/json"},body:"{}",signal:controller.signal,cache:"no-store"});
  if(!res.ok)throw new Error("RPC HTTP "+res.status);
  const rows=await res.json();
  const venue=(Array.isArray(rows)?rows:[]).map(x=>x&&x.venue?x.venue:x).find(x=>String(x&&x.id)===venueId);
  if(!venue)throw new Error("Venue not found");
  render(venue);
 }catch(err){console.error("Venue rescue loader error:",err);showError()}
 finally{clearTimeout(timer)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
})();