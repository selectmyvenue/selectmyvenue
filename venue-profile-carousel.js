(function(){
  "use strict";
  const SUPABASE_URL="https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY="sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const BUCKET="venue-media";
  const venueId=new URLSearchParams(window.location.search).get("id")||"";
  const client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(venueId);
  let images=[];
  let index=0;

  function publicUrl(path){
    if(!client||!path)return"";
    return client.storage.from(BUCKET).getPublicUrl(path)?.data?.publicUrl||"";
  }

  async function waitForCover(){
    for(let i=0;i<50;i+=1){
      const image=document.getElementById("venueProfileImage");
      if(image&&!image.hidden&&image.src)return image;
      await new Promise(r=>setTimeout(r,100));
    }
    return document.getElementById("venueProfileImage");
  }

  async function loadImages(){
    if(!client||!valid)return;
    const coverImage=await waitForCover();
    const cover=coverImage?.src||"";
    const result=await client.storage.from(BUCKET).list(`${venueId}/gallery`,{limit:20,sortBy:{column:"name",order:"asc"}});
    const gallery=result.error?[]:(result.data||[]).filter(x=>x?.name&&x.name!==".emptyFolderPlaceholder").map(x=>publicUrl(`${venueId}/gallery/${x.name}`)).filter(Boolean);
    images=[...new Set([cover,...gallery].filter(Boolean))].slice(0,9);
    if(images.length>1)installCarousel(coverImage);
  }

  function installCarousel(image){
    const media=document.getElementById("venueProfileMedia");
    if(!media||!image||media.dataset.smvCarousel==="1")return;
    media.dataset.smvCarousel="1";

    const prev=document.createElement("button");
    prev.type="button";prev.className="smv-cover-arrow smv-cover-prev";prev.setAttribute("aria-label","Previous venue photo");prev.textContent="‹";
    const next=document.createElement("button");
    next.type="button";next.className="smv-cover-arrow smv-cover-next";next.setAttribute("aria-label","Next venue photo");next.textContent="›";
    const nav=document.createElement("div");nav.className="smv-cover-nav";
    const counter=document.createElement("div");counter.className="smv-cover-counter";
    const hint=document.createElement("div");hint.className="smv-cover-hint";hint.textContent="Photos move automatically · use arrows anytime";

    images.forEach((_,i)=>{
      const dot=document.createElement("button");dot.type="button";dot.className="smv-cover-dot";dot.setAttribute("aria-label",`View venue photo ${i+1}`);dot.addEventListener("click",()=>{show(i);restartAuto();});nav.appendChild(dot);
    });
    media.append(prev,next,nav,counter,hint);

    function show(nextIndex){
      index=(nextIndex+images.length)%images.length;
      media.classList.add("smv-slide-changing");
      setTimeout(()=>{
        image.src=images[index];
        image.alt=`Venue photo ${index+1} of ${images.length}`;
        nav.querySelectorAll(".smv-cover-dot").forEach((dot,i)=>dot.classList.toggle("active",i===index));
        counter.textContent=`${index+1} / ${images.length} Photos`;
        setTimeout(()=>media.classList.remove("smv-slide-changing"),80);
      },100);
    }

    let autoTimer=null;
    function startAuto(){
      if(autoTimer||images.length<2)return;
      autoTimer=setInterval(()=>show(index+1),4200);
    }
    function stopAuto(){if(autoTimer){clearInterval(autoTimer);autoTimer=null;}}
    function restartAuto(){stopAuto();startAuto();}

    prev.addEventListener("click",()=>{show(index-1);restartAuto();});
    next.addEventListener("click",()=>{show(index+1);restartAuto();});
    let startX=0;
    media.addEventListener("touchstart",e=>{stopAuto();startX=e.touches[0]?.clientX||0},{passive:true});
    media.addEventListener("touchend",e=>{
      const endX=e.changedTouches[0]?.clientX||0;
      if(Math.abs(endX-startX)>45)show(endX<startX?index+1:index-1);
      startAuto();
    },{passive:true});
    media.addEventListener("mouseenter",stopAuto);
    media.addEventListener("mouseleave",startAuto);
    media.addEventListener("focusin",stopAuto);
    media.addEventListener("focusout",startAuto);
    media.tabIndex=0;
    media.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"){show(index-1);restartAuto();}if(e.key==="ArrowRight"){show(index+1);restartAuto();}});
    document.addEventListener("visibilitychange",()=>document.hidden?stopAuto():startAuto());
    show(0);
    startAuto();
  }

  function installTopQuickEnquiryStyles(){
    if(document.getElementById("smvTopQuickEnquiryStyles"))return;
    const style=document.createElement("style");
    style.id="smvTopQuickEnquiryStyles";
    style.textContent=`
      .venue-profile-hero.smv-hero-with-quick{display:grid!important;grid-template-columns:minmax(0,1fr) 350px!important;grid-template-rows:auto auto!important;gap:0!important;align-items:stretch!important;overflow:visible!important;background:#fff!important}
      .venue-profile-hero.smv-hero-with-quick>.venue-profile-media{grid-column:1!important;grid-row:1!important;min-height:470px!important;height:470px!important;border-radius:24px 0 0 0!important;overflow:hidden!important}
      .venue-profile-hero.smv-hero-with-quick>.venue-profile-media img{height:100%!important;object-fit:cover!important}
      .venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm{grid-column:2!important;grid-row:1!important;margin:0!important;border-radius:0 24px 0 0!important;border-left:1px solid #e0ebe7!important;border-top:0!important;border-right:0!important;border-bottom:0!important;box-shadow:none!important;padding:22px 20px!important;background:linear-gradient(160deg,#fffef9,#f7fbf9)!important;align-content:start!important;gap:9px!important}
      .venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-title{font-size:19px!important;margin-bottom:3px!important}
      .venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm input{height:40px!important}
      .venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm textarea{min-height:58px!important;max-height:72px!important}
      .venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm button{height:42px!important}
      .venue-profile-hero.smv-hero-with-quick>.venue-profile-titlebar{grid-column:1/-1!important;grid-row:2!important;border-radius:0 0 24px 24px!important}
      @media(max-width:980px){.venue-profile-hero.smv-hero-with-quick{grid-template-columns:1fr!important}.venue-profile-hero.smv-hero-with-quick>.venue-profile-media{grid-column:1!important;grid-row:1!important;border-radius:24px 24px 0 0!important;min-height:420px!important;height:420px!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm{grid-column:1!important;grid-row:2!important;border-radius:0!important;border-left:0!important;border-top:1px solid #e0ebe7!important;grid-template-columns:1fr 1fr!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-title,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-comment,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm button,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-status{grid-column:1/-1!important}.venue-profile-hero.smv-hero-with-quick>.venue-profile-titlebar{grid-row:3!important}}
      @media(max-width:620px){.venue-profile-hero.smv-hero-with-quick>.venue-profile-media{min-height:300px!important;height:300px!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm{grid-template-columns:1fr!important;padding:16px!important}.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-title,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-comment,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm button,.venue-profile-hero.smv-hero-with-quick>#venueQuickEnquiryForm .venue-quick-status{grid-column:auto!important}}
    `;
    document.head.appendChild(style);
  }

  function placeQuickEnquiryBesideImages(){
    installTopQuickEnquiryStyles();
    let tries=0;
    const place=()=>{
      const hero=document.querySelector(".venue-profile-hero");
      const media=document.getElementById("venueProfileMedia");
      const form=document.getElementById("venueQuickEnquiryForm");
      if(hero&&media&&form){
        hero.classList.add("smv-hero-with-quick");
        if(form.parentElement!==hero)media.insertAdjacentElement("afterend",form);
        return;
      }
      tries+=1;
      if(tries<60)setTimeout(place,100);
    };
    place();
  }

  async function resolveSimilarImage(card){
    if(!client||!card||card.dataset.smvImageChecked==="1")return;
    card.dataset.smvImageChecked="1";
    const media=card.querySelector(".venue-similar-media");
    if(!media||media.querySelector("img"))return;
    const href=media.getAttribute("href")||"";
    const match=href.match(/[?&]id=([0-9a-f-]{36})/i);
    const id=match?.[1]||"";
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return;
    try{
      const root=await client.storage.from(BUCKET).list(id,{limit:100,sortBy:{column:"name",order:"asc"}});
      let url="";
      if(!root.error){
        const cover=(root.data||[]).find(row=>/^cover-/i.test(row?.name||""));
        if(cover)url=publicUrl(`${id}/${cover.name}`);
      }
      if(!url){
        const gallery=await client.storage.from(BUCKET).list(`${id}/gallery`,{limit:1,sortBy:{column:"name",order:"asc"}});
        const first=(gallery.data||[]).find(row=>row?.name&&row.name!==".emptyFolderPlaceholder");
        if(first)url=publicUrl(`${id}/gallery/${first.name}`);
      }
      if(url){
        const name=card.querySelector("h3")?.textContent?.trim()||"Venue";
        media.innerHTML=`<img src="${url}" alt="${name.replace(/[<>\"]/g,"")} venue" loading="lazy" decoding="async">`;
      }
    }catch(_){ }
  }

  function watchSimilarVenueImages(){
    const grid=document.getElementById("similarVenuesGrid");
    if(!grid)return;
    const process=()=>grid.querySelectorAll(".venue-similar-card").forEach(resolveSimilarImage);
    process();
    const observer=new MutationObserver(process);
    observer.observe(grid,{childList:true,subtree:true});
    setTimeout(()=>{process();observer.disconnect();},5000);
  }

  function init(){loadImages();placeQuickEnquiryBesideImages();watchSimilarVenueImages();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();