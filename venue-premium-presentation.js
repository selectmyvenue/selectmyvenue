(function(){"use strict";
const COMPARE_KEY="smv_venue_compare_v2";
const venueId=new URLSearchParams(location.search).get("id")||"";

function removeGenericHomeSections(){
  document.querySelectorAll(".smv-celebrations-section,.smv-locations-section,.smv-discovery-section,.smv-inspiration-section,.smv-owner-cta").forEach(x=>x.remove());
}

function makeCompareUseful(){
  const link=document.querySelector(".smv-profile-compare");
  if(!link||link.dataset.smvFixed==="1"||!venueId)return;
  link.dataset.smvFixed="1";
  link.href="venues.html";
  link.addEventListener("click",function(e){
    e.preventDefault();
    try{
      const old=JSON.parse(localStorage.getItem(COMPARE_KEY)||"[]");
      let ids=Array.isArray(old)?old.map(String):[];
      if(!ids.includes(String(venueId)))ids.push(String(venueId));
      ids=ids.slice(-3);
      localStorage.setItem(COMPARE_KEY,JSON.stringify(ids));
    }catch(_){}
    link.textContent="✓ Added to Compare";
    window.setTimeout(()=>{location.href="venues.html";},120);
  });
}

function tidyProfileNav(){
  const nav=document.querySelector(".smv-profile-nav");
  if(!nav)return;
  nav.querySelectorAll("a").forEach(a=>{
    const hash=a.getAttribute("href")||"";
    if(!hash.startsWith("#"))return;
    const target=document.querySelector(hash);
    if(!target||target.hidden||getComputedStyle(target).display==="none"){
      a.remove();
      return;
    }
    a.addEventListener("click",e=>{
      const t=document.querySelector(a.getAttribute("href"));
      if(!t)return;
      e.preventDefault();
      t.scrollIntoView({behavior:"smooth",block:"start"});
    });
  });
}

function labelActions(){
  const map=document.getElementById("venueProfileMap");
  if(map&&!map.hidden)map.textContent="⌖ View Location";
  const whatsapp=document.getElementById("venueProfileWhatsapp");
  if(whatsapp)whatsapp.textContent="WhatsApp";
  const share=document.getElementById("venueShareBtn");
  if(share)share.setAttribute("aria-label","Share this venue profile");
}

function installObserver(){
  const apply=()=>{removeGenericHomeSections();makeCompareUseful();tidyProfileNav();labelActions();};
  apply();
  const obs=new MutationObserver(apply);
  obs.observe(document.body,{childList:true,subtree:true});
  window.setTimeout(()=>{apply();obs.disconnect();},12000);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installObserver,{once:true});
else installObserver();
})();