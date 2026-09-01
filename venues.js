(function(){
  "use strict";
  const SUPABASE_URL="https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY="sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const MEDIA_BUCKET="venue-media";
  const client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const grid=document.getElementById("venueGrid");
  const search=document.getElementById("venueSearch");
  const city=document.getElementById("venueCity");
  const quickFilters=document.getElementById("venueQuickFilters");
  let venues=[];
  let activeQuickFilter="all";

  const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const safeHttpUrl=value=>{try{const url=new URL(String(value||""));return ["http:","https:"].includes(url.protocol)?url.href:""}catch(_){return ""}};
  const money=value=>value===null||value===undefined||value===""?null:new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value));
  const capacity=item=>{const min=Number(item.capacity_min||0),max=Number(item.capacity_max||0);if(min&&max)return`${min}–${max} guests`;if(max)return`Up to ${max} guests`;if(min)return`${min}+ guests`;return"On request"};
  const price=item=>{const min=money(item.price_min_per_person),max=money(item.price_max_per_person);if(min&&max)return`${min}–${max}/person`;return min?`${min}+/person`:max?`Up to ${max}/person`:"Quote on request"};
  const features=item=>{const list=[];if(item.food_veg)list.push("Vegetarian");if(item.food_non_veg)list.push("Non-Vegetarian");if(item.parking_available)list.push("Parking");if(item.rooms_available)list.push("Rooms");if(item.catering_available)list.push("Catering");if(item.decoration_available)list.push("Decoration");return list.slice(0,4)};

  function publicMediaUrl(path){return safeHttpUrl(client?.storage.from(MEDIA_BUCKET).getPublicUrl(path)?.data?.publicUrl)}

  async function resolveVenueCover(item){
    const existing=safeHttpUrl(item.cover_image_url);
    if(existing)return existing;
    if(!client||!item.id)return"";
    try{
      const root=await client.storage.from(MEDIA_BUCKET).list(String(item.id),{limit:100,sortBy:{column:"name",order:"asc"}});
      if(!root.error){
        const cover=(root.data||[]).find(row=>/^cover-/i.test(row?.name||""));
        if(cover)return publicMediaUrl(`${item.id}/${cover.name}`);
      }
      const gallery=await client.storage.from(MEDIA_BUCKET).list(`${item.id}/gallery`,{limit:1,sortBy:{column:"name",order:"asc"}});
      const first=(gallery.data||[]).find(row=>row?.name&&row.name!==".emptyFolderPlaceholder");
      return first?publicMediaUrl(`${item.id}/gallery/${first.name}`):"";
    }catch(_){return""}
  }

  function matchesQuickFilter(item){
    if(activeQuickFilter==="parking")return item.parking_available===true;
    if(activeQuickFilter==="rooms")return item.rooms_available===true;
    if(activeQuickFilter==="veg")return item.food_veg===true;
    if(activeQuickFilter==="nonveg")return item.food_non_veg===true;
    if(activeQuickFilter==="300plus")return Number(item.capacity_max||item.capacity_min||0)>=300;
    return true;
  }

  function render(){
    const term=search.value.trim().toLowerCase(),selected=city.value;
    const filtered=venues.filter(item=>{const haystack=[item.venue_name,item.city,item.area,item.venue_type].join(" ").toLowerCase();return(!term||haystack.includes(term))&&(!selected||item.city===selected)&&matchesQuickFilter(item)});
    if(!filtered.length){grid.innerHTML='<div class="state-card"><h2>No matching venues found</h2><p>Try another filter or share your event requirement and our team will help you personally.</p><p style="margin-top:18px"><a class="button button-primary" href="index.html#enquiry">Send Venue Requirement</a></p></div>';return}
    grid.innerHTML=filtered.map(item=>{
      const id=encodeURIComponent(String(item.id||""));
      const name=String(item.venue_name||"Venue Partner");
      const location=[item.area,item.city].filter(Boolean).map(escapeHtml).join(", ")||"Location on request";
      const description=item.description?escapeHtml(String(item.description).slice(0,155)):"Ask our team for availability, packages and venue details.";
      const profile=`venue.html?id=${id}`;
      const quote=`venue.html?id=${id}&quote=1`;
      const cover=safeHttpUrl(item._resolvedCover||item.cover_image_url);
      const media=cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(name)} venue" loading="lazy" decoding="async">`:'<div class="venue-card-image-fallback" aria-hidden="true">🏨</div>';
      const featureHtml=features(item).map(feature=>`<span>✓ ${escapeHtml(feature)}</span>`).join("")||"<span>Details on request</span>";
      return`<article class="venue-card"><div class="venue-card-media">${media}<div class="venue-card-top"><span class="venue-type">${escapeHtml(item.venue_type||"Venue")}</span><span class="verified">✓ Verified</span></div></div><div class="venue-card-body"><h2>${escapeHtml(name)}</h2><p class="venue-location">⌖ ${location}</p><div class="venue-facts"><div class="venue-fact">${escapeHtml(capacity(item))}</div><div class="venue-fact">${escapeHtml(price(item))}</div></div><div class="venue-feature-list">${featureHtml}</div><p class="venue-description">${description}</p><div class="venue-actions"><a class="button button-primary" href="${profile}">View Venue</a><a class="button button-secondary" href="${quote}">Check Availability</a></div></div></article>`
    }).join("")
  }

  async function resolveAllCovers(){
    await Promise.all(venues.map(async item=>{if(!safeHttpUrl(item.cover_image_url))item._resolvedCover=await resolveVenueCover(item)}));
  }

  async function load(){
    if(!client){grid.innerHTML='<div class="state-card"><h2>Venue directory unavailable</h2><p>Please send your requirement and our team will assist you.</p></div>';return}
    let result=await client.rpc("smv_public_venues");
    if(result.error&&/function|schema cache/i.test(String(result.error.message||""))){
      result=await client.from("venues").select("id,venue_name,venue_type,description,city,area,capacity_min,capacity_max,price_min_per_person,price_max_per_person,food_veg,food_non_veg,parking_available,rooms_available,catering_available,decoration_available,google_maps_url,cover_image_url,featured").eq("venue_status","approved").eq("verification_status","verified").eq("public_listing_enabled",true).order("featured",{ascending:false}).order("venue_name",{ascending:true})
    }
    if(result.error){console.error("Venue directory error:",result.error);grid.innerHTML='<div class="state-card"><h2>Venue listings are being updated</h2><p>Please share your requirement and our team will send suitable verified options.</p><p style="margin-top:18px"><a class="button button-primary" href="index.html#enquiry">Find My Venue</a></p></div>';return}
    venues=Array.isArray(result.data)?result.data.map(item=>item?.venue||item):[];
    [...new Set(venues.map(item=>item.city).filter(Boolean))].sort().forEach(name=>city.add(new Option(name,name)));
    render();
    await resolveAllCovers();
    render();
  }

  search.addEventListener("input",render);
  city.addEventListener("change",render);
  quickFilters?.addEventListener("click",event=>{
    const button=event.target.closest("[data-filter]");
    if(!button)return;
    activeQuickFilter=button.dataset.filter||"all";
    quickFilters.querySelectorAll("[data-filter]").forEach(item=>item.classList.toggle("active",item===button));
    render();
  });
  load();
})();
