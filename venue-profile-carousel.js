(function(){
  "use strict";
  const SUPABASE_URL="https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY="sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const BUCKET="venue-media";
  const MAX_PUBLIC_IMAGES=30;
  const SHORTLIST_KEY="smv_venue_shortlist_v2";
  const RECENT_KEY="smv_recent_venues_v1";
  const venueId=new URLSearchParams(window.location.search).get("id")||"";
  const client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(venueId);
  let images=[];
  let index=0;
  let publicVenue=null;

  function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
  function publicUrl(path){if(!client||!path)return"";return client.storage.from(BUCKET).getPublicUrl(path)?.data?.publicUrl||"";}
  function readIds(key){try{const v=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(v)?v.map(String).filter(Boolean):[]}catch(_){return[]}}
  function writeIds(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
  function eventTypes(item){const raw=item?.event_types||item?.events||item?.suitable_events||[];if(Array.isArray(raw))return raw.map(String).filter(Boolean);return String(raw||"").split(/[,|]/).map(x=>x.trim()).filter(Boolean)}
  function money(value){const n=Number(value);return Number.isFinite(n)&&n>0?new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n):""}

  function applySharpFit(image,media){
    if(!image||!media)return;
    const update=()=>{
      const iw=Number(image.naturalWidth||0),ih=Number(image.naturalHeight||0),fw=Number(media.clientWidth||0),fh=Number(media.clientHeight||0);
      if(!iw||!ih||!fw||!fh)return;
      const mismatch=Math.abs((iw/ih)-(fw/fh));
      image.classList.toggle("smv-image-contain",mismatch>.55);
      image.classList.toggle("smv-image-cover",mismatch<=.55);
      image.style.imageRendering="auto";
      image.style.filter="none";
    };
    if(image.complete&&image.naturalWidth)update();else image.addEventListener("load",update,{once:true});
  }

  async function waitForCover(){
    for(let i=0;i<50;i+=1){const image=document.getElementById("venueProfileImage");if(image&&!image.hidden&&image.src)return image;await new Promise(r=>setTimeout(r,100));}
    return document.getElementById("venueProfileImage");
  }

  async function loadImages(){
    if(!client||!valid)return;
    const coverImage=await waitForCover();
    const cover=coverImage?.src||"";
    const result=await client.storage.from(BUCKET).list(`${venueId}/gallery`,{limit:40,sortBy:{column:"name",order:"asc"}});
    const gallery=result.error?[]:(result.data||[]).filter(x=>x?.name&&x.name!==".emptyFolderPlaceholder").map(x=>publicUrl(`${venueId}/gallery/${x.name}`)).filter(Boolean);
    images=[...new Set([cover,...gallery].filter(Boolean))].slice(0,MAX_PUBLIC_IMAGES);
    if(coverImage){coverImage.decoding="async";coverImage.fetchPriority="high";applySharpFit(coverImage,document.getElementById("venueProfileMedia"));}
    if(images.length>1)installCarousel(coverImage);
  }

  function installCarousel(image){
    const media=document.getElementById("venueProfileMedia");
    if(!media||!image||media.dataset.smvCarousel==="1")return;
    media.dataset.smvCarousel="1";
    const prev=document.createElement("button");prev.type="button";prev.className="smv-cover-arrow smv-cover-prev";prev.setAttribute("aria-label","Previous venue photo");prev.textContent="‹";
    const next=document.createElement("button");next.type="button";next.className="smv-cover-arrow smv-cover-next";next.setAttribute("aria-label","Next venue photo");next.textContent="›";
    const nav=document.createElement("div");nav.className="smv-cover-nav";
    const counter=document.createElement("div");counter.className="smv-cover-counter";
    const hint=document.createElement("div");hint.className="smv-cover-hint";hint.textContent="Original-quality photos · move automatically";
    images.forEach((_,i)=>{const dot=document.createElement("button");dot.type="button";dot.className="smv-cover-dot";dot.setAttribute("aria-label",`View venue photo ${i+1}`);dot.addEventListener("click",()=>{show(i);restartAuto();});nav.appendChild(dot);});
    media.append(prev,next,nav,counter,hint);
    function show(nextIndex){
      index=(nextIndex+images.length)%images.length;media.classList.add("smv-slide-changing");
      setTimeout(()=>{image.onload=()=>{applySharpFit(image,media);media.classList.remove("smv-slide-changing");};image.src=images[index];image.alt=`Venue photo ${index+1} of ${images.length}`;image.decoding="async";nav.querySelectorAll(".smv-cover-dot").forEach((dot,i)=>dot.classList.toggle("active",i===index));const active=nav.querySelector(".smv-cover-dot.active");if(active&&typeof active.scrollIntoView==="function")active.scrollIntoView({block:"nearest",inline:"center"});counter.textContent=`${index+1} / ${images.length} Photos`;if(image.complete&&image.naturalWidth){applySharpFit(image,media);setTimeout(()=>media.classList.remove("smv-slide-changing"),45);}},70);
    }
    let autoTimer=null;function startAuto(){if(autoTimer||images.length<2)return;autoTimer=setInterval(()=>show(index+1),4200)}function stopAuto(){if(autoTimer){clearInterval(autoTimer);autoTimer=null}}function restartAuto(){stopAuto();startAuto()}
    prev.addEventListener("click",()=>{show(index-1);restartAuto();});next.addEventListener("click",()=>{show(index+1);restartAuto();});
    let startX=0;media.addEventListener("touchstart",e=>{stopAuto();startX=e.touches[0]?.clientX||0},{passive:true});media.addEventListener("touchend",e=>{const endX=e.changedTouches[0]?.clientX||0;if(Math.abs(endX-startX)>45)show(endX<startX?index+1:index-1);startAuto();},{passive:true});
    media.addEventListener("mouseenter",stopAuto);media.addEventListener("mouseleave",startAuto);media.addEventListener("focusin",stopAuto);media.addEventListener("focusout",startAuto);media.tabIndex=0;media.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"){show(index-1);restartAuto();}if(e.key==="ArrowRight"){show(index+1);restartAuto();}});document.addEventListener("visibilitychange",()=>document.hidden?stopAuto():startAuto());show(0);startAuto();
  }

  function installTopQuickEnquiryStyles(){
    if(document.getElementById("smvTopQuickEnquiryStyles"))return;
    const style=document.createElement("style");style.id="smvTopQuickEnquiryStyles";style.textContent=`
      .venue-profile-hero.smv-hero-with-quick{display:grid!important;grid-template-columns:minmax(0,1fr) 350px!important;grid-template-rows:auto auto!important;gap:0!important;align-items:stretch!important;overflow:visible!important;background:#fff!important}
      .venue-profile-hero.smv-hero-with-quick>.venue-profile-media{grid-column:1!important;grid-row:1!important;min-height:470px!important;height:470px!important;border-radius:24px 0 0 0!important;overflow:hidden!important;background:#edf4f2!important}
      .venue-profile-hero.smv-hero-with-quick>.venue-profile-media img{height:100%!important;width:100%!important;object-position:center!important;image-rendering:auto!important;filter:none!important}.venue-profile-hero.smv-hero-with-quick>.venue-profile-media img.smv-image-cover{object-fit:cover!important}.venue-profile-hero.smv-hero-with-quick>.venue-profile-media img.smv-image-contain{object-fit:contain!important}
      .venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm{grid-column:2!important;grid-row:1!important;margin:0!important;border-radius:0 24px 0 0!important;border-left:1px solid #e0ebe7!important;border-top:0!important;border-right:0!important;border-bottom:0!important;box-shadow:none!important;padding:22px 20px!important;background:linear-gradient(160deg,#fffef9,#f7fbf9)!important;align-content:start!important;gap:9px!important}
      .venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-title{font-size:19px!important;margin-bottom:3px!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm input{height:40px!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm textarea{min-height:58px!important;max-height:72px!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm button{height:42px!important}.venue-profile-hero.smv-hero-with-quick>.venue-profile-titlebar{grid-column:1/-1!important;grid-row:2!important;border-radius:0 0 24px 24px!important}
      @media(max-width:980px){.venue-profile-hero.smv-hero-with-quick{grid-template-columns:1fr!important}.venue-profile-hero.smv-hero-with-quick>.venue-profile-media{grid-column:1!important;grid-row:1!important;border-radius:24px 24px 0 0!important;min-height:420px!important;height:420px!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm{grid-column:1!important;grid-row:2!important;border-radius:0!important;border-left:0!important;border-top:1px solid #e0ebe7!important;grid-template-columns:1fr 1fr!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-title,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-comment,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm button,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-status{grid-column:1/-1!important}.venue-profile-hero.smv-hero-with-quick>.venue-profile-titlebar{grid-row:3!important}}
      @media(max-width:620px){.venue-profile-hero.smv-hero-with-quick>.venue-profile-media{min-height:300px!important;height:300px!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm{grid-template-columns:1fr!important;padding:16px!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-title,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-comment,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm button,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-status{grid-column:auto!important}}
    `;document.head.appendChild(style);
  }

  function placeQuickEnquiryBesideImages(){
    installTopQuickEnquiryStyles();let tries=0;const place=()=>{const hero=document.querySelector(".venue-profile-hero"),media=document.getElementById("venueProfileMedia"),form=document.getElementById("venueQuickEnquiryForm");if(hero&&media&&form){hero.classList.add("smv-hero-with-quick");if(form.parentElement!==hero)media.insertAdjacentElement("afterend",form);const image=document.getElementById("venueProfileImage");if(image)applySharpFit(image,media);return;}tries+=1;if(tries<60)setTimeout(place,100);};place();
  }

  function installProfileIntelligenceStyles(){
    if(document.getElementById("smvProfileIntelligenceStyles"))return;
    const style=document.createElement("style");style.id="smvProfileIntelligenceStyles";style.textContent=`
      .smv-profile-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.smv-profile-shortlist{min-height:40px;padding:0 14px;border:1px solid #d6e6e2;border-radius:10px;background:#fff;color:#17483f;font-size:11px;font-weight:900;cursor:pointer}.smv-profile-shortlist.active{border-color:#d9b84f;background:#fff9e8;color:#745500}.smv-profile-compare{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid #d6e6e2;border-radius:10px;background:#f8fbfa;color:#17483f;font-size:11px;font-weight:900;text-decoration:none}.smv-profile-intel{margin-top:18px}.smv-intel-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.smv-intel-card{padding:14px;border:1px solid #deebe7;border-radius:13px;background:linear-gradient(145deg,#fff,#f7fbfa)}.smv-intel-card span{display:block;color:#76918b;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}.smv-intel-card strong{display:block;color:#163f37;font-size:14px;line-height:1.35}.smv-intel-card small{display:block;color:#6c837e;font-size:10px;line-height:1.45;margin-top:5px}.smv-good-fit{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}.smv-good-fit span{padding:7px 10px;border:1px solid #dce9e5;border-radius:999px;background:#f8fcfb;color:#315f56;font-size:10px;font-weight:850}.smv-profile-note{margin-top:11px;padding:10px 12px;border-radius:10px;background:#f2faf7;color:#5c776f;font-size:10px;line-height:1.5;font-weight:700}
      @media(max-width:760px){.smv-intel-grid{grid-template-columns:1fr}.smv-profile-actions{width:100%}.smv-profile-shortlist,.smv-profile-compare{flex:1}}
    `;document.head.appendChild(style);
  }

  function rememberRecentVenue(venue){
    if(!venue?.id)return;
    try{
      const current=JSON.parse(localStorage.getItem(RECENT_KEY)||"[]");
      const rows=Array.isArray(current)?current:[];
      const next=[{id:String(venue.id),name:String(venue.venue_name||"Venue"),city:String(venue.city||""),ts:Date.now()},...rows.filter(x=>String(x?.id)!==String(venue.id))].slice(0,6);
      localStorage.setItem(RECENT_KEY,JSON.stringify(next));
    }catch(_){ }
  }

  function installShortlistAction(venue){
    const actions=document.querySelector(".venue-profile-hero-actions");if(!actions||document.getElementById("smvProfileShortlist"))return;
    const wrap=document.createElement("div");wrap.className="smv-profile-actions";
    const button=document.createElement("button");button.id="smvProfileShortlist";button.className="smv-profile-shortlist";button.type="button";
    const compare=document.createElement("a");compare.className="smv-profile-compare";compare.href=`venues.html?compare=${encodeURIComponent(venueId)}`;compare.textContent="Compare on Browse Venues";
    function sync(){const ids=readIds(SHORTLIST_KEY);const active=ids.includes(String(venueId));button.classList.toggle("active",active);button.textContent=active?"✓ Shortlisted":"♡ Add to Shortlist";}
    button.addEventListener("click",()=>{let ids=readIds(SHORTLIST_KEY);if(ids.includes(String(venueId)))ids=ids.filter(x=>x!==String(venueId));else ids=[...ids,String(venueId)].slice(-8);writeIds(SHORTLIST_KEY,ids);sync();});
    wrap.append(button,compare);actions.appendChild(wrap);sync();
  }

  function renderProfileIntelligence(venue){
    installProfileIntelligenceStyles();installShortlistAction(venue);rememberRecentVenue(venue);
    const content=document.querySelector(".venue-profile-content");if(!content||document.getElementById("smvProfileIntelligence"))return;
    const min=money(venue.price_min_per_person),max=money(venue.price_max_per_person),capMin=Number(venue.capacity_min||0),capMax=Number(venue.capacity_max||0);
    const priceText=min&&max?`${min}–${max} / person`:min?`From ${min} / person`:max?`Up to ${max} / person`:"Quote on request";
    const capacityText=capMin&&capMax?`${capMin}–${capMax} guests`:capMax?`Up to ${capMax} guests`:capMin?`${capMin}+ guests`:"Capacity on request";
    const types=eventTypes(venue);
    const fits=[];
    types.slice(0,6).forEach(x=>fits.push(x));
    if(!fits.length){if(capMax>=300)fits.push("Large celebrations");if(capMax&&capMax<300)fits.push("Intimate & mid-size events");if(venue.rooms_available)fits.push("Events needing rooms");if(venue.parking_available)fits.push("Guest-friendly access");}
    const facilities=[];if(venue.parking_available)facilities.push("Parking");if(venue.rooms_available)facilities.push("Rooms");if(venue.food_veg)facilities.push("Vegetarian");if(venue.food_non_veg)facilities.push("Non-Veg");if(venue.catering_available)facilities.push("Catering");if(venue.decoration_available)facilities.push("Decoration");
    const section=document.createElement("section");section.id="smvProfileIntelligence";section.className="venue-profile-panel venue-white-card smv-profile-intel";
    section.innerHTML=`<p class="eyebrow">QUICK DECISION SNAPSHOT</p><h2>Know the essentials before you enquire.</h2><div class="smv-intel-grid"><div class="smv-intel-card"><span>STARTING PRICE</span><strong>${escapeHtml(priceText)}</strong><small>Published venue pricing; final package depends on event details.</small></div><div class="smv-intel-card"><span>GUEST FIT</span><strong>${escapeHtml(capacityText)}</strong><small>Use your expected guest count to shortlist confidently.</small></div><div class="smv-intel-card"><span>USEFUL FACILITIES</span><strong>${escapeHtml(facilities.slice(0,4).join(" · ")||"Details on request")}</strong><small>Only facilities listed by this venue are shown.</small></div></div>${fits.length?`<div class="smv-good-fit">${fits.map(x=>`<span>✓ ${escapeHtml(x)}</span>`).join("")}</div>`:""}<div class="smv-profile-note">Select My Venue does not show fake availability, fake ratings or guaranteed discounts. Use “Check Price & Availability” for the latest venue response.</div>`;
    content.prepend(section);
  }

  async function loadPublicVenueData(){
    if(!client||!valid)return;
    try{const result=await client.rpc("smv_public_venues");if(result.error)return;publicVenue=(Array.isArray(result.data)?result.data:[]).map(item=>item?.venue||item).find(item=>String(item?.id)===String(venueId))||null;if(publicVenue)renderProfileIntelligence(publicVenue);}catch(_){ }
  }

  async function resolveSimilarImage(card){
    if(!client||!card||card.dataset.smvImageChecked==="1")return;card.dataset.smvImageChecked="1";const media=card.querySelector(".venue-similar-media");if(!media||media.querySelector("img"))return;const href=media.getAttribute("href")||"";const match=href.match(/[?&]id=([0-9a-f-]{36})/i);const id=match?.[1]||"";if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return;
    try{const root=await client.storage.from(BUCKET).list(id,{limit:100,sortBy:{column:"name",order:"asc"}});let url="";if(!root.error){const cover=(root.data||[]).find(row=>/^cover-/i.test(row?.name||""));if(cover)url=publicUrl(`${id}/${cover.name}`);}if(!url){const gallery=await client.storage.from(BUCKET).list(`${id}/gallery`,{limit:1,sortBy:{column:"name",order:"asc"}});const first=(gallery.data||[]).find(row=>row?.name&&row.name!==".emptyFolderPlaceholder");if(first)url=publicUrl(`${id}/gallery/${first.name}`);}if(url){const name=card.querySelector("h3")?.textContent?.trim()||"Venue";media.innerHTML=`<img src="${url}" alt="${name.replace(/[<>\"]/g,"")} venue" loading="lazy" decoding="async">`;}}catch(_){ }
  }

  function watchSimilarVenueImages(){const grid=document.getElementById("similarVenuesGrid");if(!grid)return;const process=()=>grid.querySelectorAll(".venue-similar-card").forEach(resolveSimilarImage);process();const observer=new MutationObserver(process);observer.observe(grid,{childList:true,subtree:true});setTimeout(()=>{process();observer.disconnect();},5000);}

  function init(){loadImages();placeQuickEnquiryBesideImages();watchSimilarVenueImages();loadPublicVenueData();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();