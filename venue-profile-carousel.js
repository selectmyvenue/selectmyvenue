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
    const hint=document.createElement("div");hint.className="smv-cover-hint";hint.textContent="Swipe or use arrows to view photos";

    images.forEach((_,i)=>{
      const dot=document.createElement("button");dot.type="button";dot.className="smv-cover-dot";dot.setAttribute("aria-label",`View venue photo ${i+1}`);dot.addEventListener("click",()=>show(i));nav.appendChild(dot);
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

    prev.addEventListener("click",()=>show(index-1));
    next.addEventListener("click",()=>show(index+1));
    let startX=0;
    media.addEventListener("touchstart",e=>{startX=e.touches[0]?.clientX||0},{passive:true});
    media.addEventListener("touchend",e=>{
      const endX=e.changedTouches[0]?.clientX||0;
      if(Math.abs(endX-startX)>45)show(endX<startX?index+1:index-1);
    },{passive:true});
    media.tabIndex=0;
    media.addEventListener("keydown",e=>{if(e.key==="ArrowLeft")show(index-1);if(e.key==="ArrowRight")show(index+1)});
    show(0);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",loadImages,{once:true});else loadImages();
})();
