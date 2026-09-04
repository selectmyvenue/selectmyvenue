(function(){
  "use strict";

  const SUPABASE_URL="https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY="sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const BUCKET="venue-media";
  const MAX_PHOTOS=30;
  const SHORTLIST_KEY="smv_venue_shortlist_v2";
  const RECENT_KEY="smv_recent_venues_v1";
  const params=new URLSearchParams(window.location.search);
  const venueId=params.get("id")||"";
  const validVenueId=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(venueId);
  const client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});

  let photos=[];
  let currentIndex=0;
  let autoTimer=null;
  let viewerIndex=0;
  let currentVenue=null;

  const $=selector=>document.querySelector(selector);
  const byId=id=>document.getElementById(id);
  const escapeHtml=value=>String(value??"").replace(/[&<>'\"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'\"':"&quot;"}[char]));
  const publicUrl=path=>client?.storage.from(BUCKET).getPublicUrl(path)?.data?.publicUrl||"";
  const money=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n):""};
  const getIds=key=>{try{const value=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(value)?value.map(String).filter(Boolean):[]}catch(_){return[]}};
  const setIds=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}};
  const cleanList=value=>Array.isArray(value)?value.map(String).filter(Boolean):String(value||"").split(/[,|]/).map(x=>x.trim()).filter(Boolean);

  function applyImageFit(image){
    if(!image)return;
    const apply=()=>{
      image.classList.add("smv-image-contain");
      image.classList.remove("smv-image-cover");
      image.style.objectFit="contain";
      image.style.objectPosition="center center";
      image.style.imageRendering="auto";
      image.style.filter="none";
      image.style.transform="none";
    };
    if(image.complete)apply();
    else image.addEventListener("load",apply,{once:true});
  }

  async function waitForProfileImage(){
    for(let attempt=0;attempt<80;attempt+=1){
      const image=byId("venueProfileImage");
      if(image&&!image.hidden&&image.src)return image;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    return byId("venueProfileImage");
  }

  async function loadPhotos(){
    if(!client||!validVenueId)return;
    const image=await waitForProfileImage();
    const cover=image?.src||"";
    let gallery=[];
    try{
      const result=await client.storage.from(BUCKET).list(`${venueId}/gallery`,{limit:40,sortBy:{column:"name",order:"asc"}});
      gallery=result.error?[]:(result.data||[])
        .filter(item=>item?.name&&item.name!==".emptyFolderPlaceholder")
        .map(item=>publicUrl(`${venueId}/gallery/${item.name}`))
        .filter(Boolean);
    }catch(_){gallery=[];}
    photos=[...new Set([cover,...gallery].filter(Boolean))].slice(0,MAX_PHOTOS);
    if(image){
      image.decoding="async";
      image.fetchPriority="high";
      applyImageFit(image);
    }
    if(photos.length)installHeroGallery(image);
  }

  function stopAuto(){if(autoTimer){clearInterval(autoTimer);autoTimer=null;}}
  function startAuto(){if(!autoTimer&&photos.length>1)autoTimer=setInterval(()=>showHeroPhoto(currentIndex+1),4400);}
  function restartAuto(){stopAuto();startAuto();}

  function showHeroPhoto(nextIndex){
    const image=byId("venueProfileImage"),media=byId("venueProfileMedia"),counter=byId("smvHeroPhotoCounter"),progress=byId("smvHeroProgress");
    if(!image||!photos.length)return;
    currentIndex=(nextIndex+photos.length)%photos.length;
    if(media)media.classList.add("smv-slide-changing");
    window.setTimeout(()=>{
      image.onload=()=>{applyImageFit(image);media?.classList.remove("smv-slide-changing");};
      image.src=photos[currentIndex];
      image.alt=`Venue photo ${currentIndex+1} of ${photos.length}`;
      image.hidden=false;
      applyImageFit(image);
      if(counter)counter.textContent=`${currentIndex+1} / ${photos.length} Photos`;
      if(progress)progress.style.setProperty("--smv-progress",`${((currentIndex+1)/photos.length)*100}%`);
      if(image.complete&&image.naturalWidth){applyImageFit(image);window.setTimeout(()=>media?.classList.remove("smv-slide-changing"),45);}
    },70);
  }

  function installHeroGallery(image){
    const media=byId("venueProfileMedia");
    if(!media||media.dataset.smvHeroGallery==="1")return;
    media.dataset.smvHeroGallery="1";
    media.classList.add("smv-premium-hero-media");
    const prev=document.createElement("button");
    prev.type="button";prev.className="smv-cover-arrow smv-cover-prev";prev.setAttribute("aria-label","Previous venue photo");prev.textContent="‹";
    const next=document.createElement("button");
    next.type="button";next.className="smv-cover-arrow smv-cover-next";next.setAttribute("aria-label","Next venue photo");next.textContent="›";
    const viewAll=document.createElement("button");
    viewAll.id="smvViewAllPhotos";viewAll.type="button";viewAll.className="smv-view-all";viewAll.textContent=`▦ View All ${photos.length} Photo${photos.length===1?"":"s"}`;
    const counter=document.createElement("div");
    counter.id="smvHeroPhotoCounter";counter.className="smv-cover-counter";
    const progress=document.createElement("div");
    progress.id="smvHeroProgress";progress.className="smv-hero-progress";
    media.append(prev,next,viewAll,counter,progress);

    prev.addEventListener("click",()=>{showHeroPhoto(currentIndex-1);restartAuto();});
    next.addEventListener("click",()=>{showHeroPhoto(currentIndex+1);restartAuto();});
    viewAll.addEventListener("click",()=>openViewer(currentIndex));
    image?.addEventListener("click",()=>openViewer(currentIndex));

    let touchStartX=0;
    media.addEventListener("touchstart",event=>{stopAuto();touchStartX=event.touches[0]?.clientX||0;},{passive:true});
    media.addEventListener("touchend",event=>{const endX=event.changedTouches[0]?.clientX||0;if(Math.abs(endX-touchStartX)>45)showHeroPhoto(endX<touchStartX?currentIndex+1:currentIndex-1);startAuto();},{passive:true});
    media.addEventListener("mouseenter",stopAuto);
    media.addEventListener("mouseleave",startAuto);
    media.tabIndex=0;
    media.addEventListener("keydown",event=>{if(event.key==="ArrowLeft"){showHeroPhoto(currentIndex-1);restartAuto();}if(event.key==="ArrowRight"){showHeroPhoto(currentIndex+1);restartAuto();}if(event.key==="Enter")openViewer(currentIndex);});
    document.addEventListener("visibilitychange",()=>document.hidden?stopAuto():startAuto());
    showHeroPhoto(0);
    startAuto();
  }

  function createViewer(){
    let viewer=byId("smvPhotoViewer");
    if(viewer)return viewer;
    viewer=document.createElement("div");
    viewer.id="smvPhotoViewer";
    viewer.className="smv-photo-viewer";
    viewer.hidden=true;
    viewer.innerHTML=`
      <div class="smv-photo-viewer-head">
        <div><strong>All Venue Photos</strong><span id="smvViewerCounter"></span></div>
        <button type="button" class="smv-viewer-close" aria-label="Close gallery">×</button>
      </div>
      <div class="smv-photo-viewer-stage">
        <button type="button" class="smv-viewer-arrow smv-viewer-prev" aria-label="Previous photo">‹</button>
        <img id="smvViewerImage" alt="Venue photo">
        <button type="button" class="smv-viewer-arrow smv-viewer-next" aria-label="Next photo">›</button>
      </div>
      <div id="smvViewerThumbs" class="smv-viewer-thumbs"></div>`;
    document.body.appendChild(viewer);
    viewer.querySelector(".smv-viewer-close").addEventListener("click",closeViewer);
    viewer.querySelector(".smv-viewer-prev").addEventListener("click",()=>showViewerPhoto(viewerIndex-1));
    viewer.querySelector(".smv-viewer-next").addEventListener("click",()=>showViewerPhoto(viewerIndex+1));
    viewer.addEventListener("click",event=>{if(event.target===viewer)closeViewer();});
    document.addEventListener("keydown",event=>{if(viewer.hidden)return;if(event.key==="Escape")closeViewer();if(event.key==="ArrowLeft")showViewerPhoto(viewerIndex-1);if(event.key==="ArrowRight")showViewerPhoto(viewerIndex+1);});
    return viewer;
  }

  function openViewer(index){
    if(!photos.length)return;
    const viewer=createViewer();
    const thumbs=byId("smvViewerThumbs");
    if(thumbs&&!thumbs.dataset.loaded){
      thumbs.innerHTML=photos.map((src,n)=>`<button type="button" class="smv-viewer-thumb" data-index="${n}"><img src="${escapeHtml(src)}" alt="Venue photo ${n+1}" loading="lazy" decoding="async"></button>`).join("");
      thumbs.dataset.loaded="1";
      thumbs.querySelectorAll(".smv-viewer-thumb").forEach(button=>button.addEventListener("click",()=>showViewerPhoto(Number(button.dataset.index))));
    }
    stopAuto();
    viewer.hidden=false;
    document.body.style.overflow="hidden";
    showViewerPhoto(index);
  }

  function closeViewer(){
    const viewer=byId("smvPhotoViewer");
    if(viewer)viewer.hidden=true;
    document.body.style.overflow="";
    startAuto();
  }

  function showViewerPhoto(nextIndex){
    if(!photos.length)return;
    viewerIndex=(nextIndex+photos.length)%photos.length;
    const image=byId("smvViewerImage"),counter=byId("smvViewerCounter");
    if(image){image.src=photos[viewerIndex];image.alt=`Venue photo ${viewerIndex+1} of ${photos.length}`;}
    if(counter)counter.textContent=`${viewerIndex+1} / ${photos.length}`;
    document.querySelectorAll(".smv-viewer-thumb").forEach(button=>button.classList.toggle("active",Number(button.dataset.index)===viewerIndex));
    const active=document.querySelector(`.smv-viewer-thumb[data-index="${viewerIndex}"]`);
    if(active&&typeof active.scrollIntoView==="function")active.scrollIntoView({block:"nearest",inline:"center"});
  }

  function moveQuickEnquiryIntoHero(){
    let tries=0;
    let observer=null;
    const place=()=>{
      const hero=$(".venue-profile-hero"),media=byId("venueProfileMedia"),form=byId("venueQuickEnquiryForm");
      if(hero&&media&&form){
        hero.classList.add("smv-hero-with-quick");
        if(form.parentElement!==hero)media.insertAdjacentElement("afterend",form);
        form.classList.add("smv-hero-enquiry-form");
        applyImageFit(byId("venueProfileImage"));
        if(observer)observer.disconnect();
        return true;
      }
      return false;
    };
    if(place())return;
    observer=new MutationObserver(()=>{place();});
    observer.observe(document.body,{childList:true,subtree:true});
    const retry=()=>{if(place())return;tries+=1;if(tries<140)window.setTimeout(retry,100);else observer.disconnect();};
    retry();
  }

  function installActions(venue){
    const actions=$(".venue-profile-hero-actions");
    if(!actions||byId("smvProfileShortlist"))return;
    const wrap=document.createElement("div");
    wrap.className="smv-profile-actions";
    const shortlist=document.createElement("button");
    shortlist.id="smvProfileShortlist";
    shortlist.className="smv-profile-action smv-profile-shortlist";
    shortlist.type="button";
    const compare=document.createElement("a");
    compare.className="smv-profile-action smv-profile-compare";
    compare.href=`venues.html?compare=${encodeURIComponent(venueId)}`;
    compare.textContent="⚖ Compare";
    const call=document.createElement("a");
    call.className="smv-profile-action smv-profile-call";
    call.href="tel:+918368322256";
    call.textContent="☎ Call";
    const sync=()=>{
      const ids=getIds(SHORTLIST_KEY),active=ids.includes(String(venueId));
      shortlist.classList.toggle("active",active);
      shortlist.textContent=active?"✓ Shortlisted":"♡ Shortlist";
    };
    shortlist.addEventListener("click",()=>{
      let ids=getIds(SHORTLIST_KEY);
      ids=ids.includes(String(venueId))?ids.filter(x=>x!==String(venueId)):[...ids,String(venueId)].slice(-8);
      setIds(SHORTLIST_KEY,ids);
      sync();
    });
    wrap.append(shortlist,compare,call);
    const mapUrl=String(venue?.google_maps_url||"");
    if(/^https?:\/\//i.test(mapUrl)){
      const map=document.createElement("a");
      map.className="smv-profile-action smv-profile-map";
      map.href=mapUrl;map.target="_blank";map.rel="noopener";map.textContent="⌖ Map";
      wrap.appendChild(map);
    }
    actions.appendChild(wrap);
    sync();
  }

  function rememberVenue(venue){
    if(!venue?.id)return;
    try{
      const old=JSON.parse(localStorage.getItem(RECENT_KEY)||"[]"),rows=Array.isArray(old)?old:[];
      const next=[{id:String(venue.id),name:String(venue.venue_name||"Venue"),city:String(venue.city||""),ts:Date.now()},...rows.filter(row=>String(row?.id)!==String(venue.id))].slice(0,8);
      localStorage.setItem(RECENT_KEY,JSON.stringify(next));
    }catch(_){ }
  }

  function installSnapshot(venue){
    const content=$(".venue-profile-content");
    if(!content||byId("smvProfileSnapshot"))return;
    const min=money(venue?.price_min_per_person),max=money(venue?.price_max_per_person);
    const price=min&&max?`${min}–${max} / person`:min?`From ${min} / person`:max?`Up to ${max} / person`:"Quote on request";
    const capMin=Number(venue?.capacity_min||0),capMax=Number(venue?.capacity_max||0);
    const capacity=capMin&&capMax?`${capMin}–${capMax} guests`:capMax?`Up to ${capMax} guests`:capMin?`${capMin}+ guests`:"Capacity on request";
    const facilities=[];
    if(venue?.parking_available)facilities.push("Parking");
    if(venue?.rooms_available)facilities.push("Rooms");
    if(venue?.food_veg)facilities.push("Veg food");
    if(venue?.food_non_veg)facilities.push("Non-veg food");
    if(venue?.catering_available)facilities.push("Catering");
    if(venue?.decoration_available)facilities.push("Decoration");
    const eventTypes=cleanList(venue?.event_types||venue?.events||venue?.suitable_events).slice(0,6);
    const section=document.createElement("section");
    section.id="smvProfileSnapshot";
    section.className="venue-profile-panel venue-white-card smv-profile-snapshot";
    section.innerHTML=`<p class="eyebrow">VENUE SNAPSHOT</p><h2>Important details at a glance.</h2><div class="smv-snapshot-grid"><div><span>Starting price</span><strong>${escapeHtml(price)}</strong></div><div><span>Guest capacity</span><strong>${escapeHtml(capacity)}</strong></div><div><span>Useful facilities</span><strong>${escapeHtml(facilities.slice(0,4).join(" · ")||"Details on request")}</strong></div></div>${eventTypes.length?`<div class="smv-good-fit">${eventTypes.map(item=>`<span>✓ ${escapeHtml(item)}</span>`).join("")}</div>`:""}<small>Only real venue information is shown. Final package and availability are confirmed after your enquiry.</small>`;
    content.prepend(section);
  }

  function installStickyBar(venue){
    if(byId("smvStickyVenueBar"))return;
    const name=String(venue?.venue_name||byId("venueProfileName")?.textContent||"Venue");
    const min=money(venue?.price_min_per_person);
    const capMin=Number(venue?.capacity_min||0),capMax=Number(venue?.capacity_max||0);
    const cap=capMin&&capMax?`${capMin}–${capMax} guests`:capMax?`Up to ${capMax} guests`:capMin?`${capMin}+ guests`:"Capacity on request";
    const bar=document.createElement("div");
    bar.id="smvStickyVenueBar";
    bar.className="smv-sticky-venue-bar";
    bar.innerHTML=`<strong>${escapeHtml(name)}</strong><span>${escapeHtml(min?`From ${min}/person`:"Quote on request")}</span><span>${escapeHtml(cap)}</span><button type="button">Check Availability</button>`;
    document.body.appendChild(bar);
    bar.querySelector("button").addEventListener("click",()=>byId("venueProfileQuote")?.click());
    const toggle=()=>bar.classList.toggle("show",window.scrollY>520);
    window.addEventListener("scroll",toggle,{passive:true});
    toggle();
  }

  async function loadVenueData(){
    if(!client||!validVenueId)return;
    try{
      const result=await client.rpc("smv_public_venues");
      if(result.error)return;
      currentVenue=(Array.isArray(result.data)?result.data:[]).map(item=>item?.venue||item).find(item=>String(item?.id)===String(venueId))||null;
      if(!currentVenue)return;
      installActions(currentVenue);
      installSnapshot(currentVenue);
      installStickyBar(currentVenue);
      rememberVenue(currentVenue);
    }catch(_){ }
  }

  function resolveSimilarVenueImages(){
    const grid=byId("similarVenuesGrid");
    if(!grid||!client)return;
    const process=()=>grid.querySelectorAll(".venue-similar-card").forEach(async card=>{
      if(card.dataset.smvImageChecked==="1")return;
      card.dataset.smvImageChecked="1";
      const media=card.querySelector(".venue-similar-media");
      if(!media||media.querySelector("img"))return;
      const match=(media.getAttribute("href")||"").match(/[?&]id=([0-9a-f-]{36})/i);
      const targetId=match?.[1]||"";
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId))return;
      try{
        const root=await client.storage.from(BUCKET).list(targetId,{limit:100,sortBy:{column:"name",order:"asc"}});
        let imageUrl="";
        if(!root.error){const cover=(root.data||[]).find(row=>/^cover-/i.test(row?.name||""));if(cover)imageUrl=publicUrl(`${targetId}/${cover.name}`);}
        if(!imageUrl){const gallery=await client.storage.from(BUCKET).list(`${targetId}/gallery`,{limit:1,sortBy:{column:"name",order:"asc"}});const first=(gallery.data||[]).find(row=>row?.name&&row.name!==".emptyFolderPlaceholder");if(first)imageUrl=publicUrl(`${targetId}/gallery/${first.name}`);}
        if(imageUrl){const label=card.querySelector("h3")?.textContent?.trim()||"Venue";media.innerHTML=`<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(label)} venue" loading="lazy" decoding="async">`;}
      }catch(_){ }
    });
    process();
    const observer=new MutationObserver(process);
    observer.observe(grid,{childList:true,subtree:true});
    window.setTimeout(()=>{process();observer.disconnect();},6000);
  }

  function init(){
    moveQuickEnquiryIntoHero();
    loadPhotos();
    loadVenueData();
    resolveSimilarVenueImages();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
