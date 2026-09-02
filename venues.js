(function(){
  "use strict";
  const SUPABASE_URL="https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY="sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const MEDIA_BUCKET="venue-media";
  const SHORTLIST_KEY="smv_shortlisted_venues_v1";
  const COMPARE_KEY="smv_compare_venues_v1";
  const client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const grid=document.getElementById("venueGrid"),search=document.getElementById("venueSearch"),city=document.getElementById("venueCity"),guestFilter=document.getElementById("venueGuests"),budgetFilter=document.getElementById("venueBudget"),foodFilter=document.getElementById("venueFood"),quickFilters=document.getElementById("venueQuickFilters"),resultsCount=document.getElementById("venueResultsCount"),showShortlisted=document.getElementById("showShortlisted"),shortlistCount=document.getElementById("shortlistCount"),compareCount=document.getElementById("compareCount"),openCompare=document.getElementById("openCompare"),compareDrawer=document.getElementById("compareDrawer"),compareTable=document.getElementById("compareTable");
  let venues=[],activeQuickFilter="all",shortlistOnly=false;

  const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const safeHttpUrl=value=>{try{const url=new URL(String(value||""));return["http:","https:"].includes(url.protocol)?url.href:""}catch(_){return""}};
  const money=value=>value===null||value===undefined||value===""?null:new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value));
  const capacity=item=>{const min=Number(item.capacity_min||0),max=Number(item.capacity_max||0);if(min&&max)return`${min}–${max} guests`;if(max)return`Up to ${max} guests`;if(min)return`${min}+ guests`;return"On request"};
  const price=item=>{const min=money(item.price_min_per_person),max=money(item.price_max_per_person);if(min&&max)return`${min}–${max}/person`;return min?`${min}+/person`:max?`Up to ${max}/person`:"Quote on request"};
  const features=item=>{const list=[];if(item.food_veg)list.push("Vegetarian");if(item.food_non_veg)list.push("Non-Vegetarian");if(item.parking_available)list.push("Parking");if(item.rooms_available)list.push("Rooms");if(item.catering_available)list.push("Catering");if(item.decoration_available)list.push("Decoration");return list.slice(0,5)};
  const readIds=key=>{try{return[...new Set(JSON.parse(localStorage.getItem(key)||"[]").map(String))]}catch(_){return[]}};
  const writeIds=(key,ids)=>localStorage.setItem(key,JSON.stringify([...new Set(ids.map(String))]));
  const isShortlisted=id=>readIds(SHORTLIST_KEY).includes(String(id));
  const isComparing=id=>readIds(COMPARE_KEY).includes(String(id));

  function publicMediaUrl(path){return safeHttpUrl(client?.storage.from(MEDIA_BUCKET).getPublicUrl(path)?.data?.publicUrl)}
  async function resolveVenueCover(item){
    const existing=safeHttpUrl(item.cover_image_url);if(existing)return existing;if(!client||!item.id)return"";
    try{const root=await client.storage.from(MEDIA_BUCKET).list(String(item.id),{limit:100,sortBy:{column:"name",order:"asc"}});if(!root.error){const cover=(root.data||[]).find(row=>/^cover-/i.test(row?.name||""));if(cover)return publicMediaUrl(`${item.id}/${cover.name}`)}const gallery=await client.storage.from(MEDIA_BUCKET).list(`${item.id}/gallery`,{limit:1,sortBy:{column:"name",order:"asc"}});const first=(gallery.data||[]).find(row=>row?.name&&row.name!==".emptyFolderPlaceholder");return first?publicMediaUrl(`${item.id}/gallery/${first.name}`):""}catch(_){return""}
  }

  function matchesQuickFilter(item){
    if(activeQuickFilter==="parking")return item.parking_available===true;
    if(activeQuickFilter==="rooms")return item.rooms_available===true;
    if(activeQuickFilter==="catering")return item.catering_available===true;
    if(activeQuickFilter==="decoration")return item.decoration_available===true;
    return true;
  }
  function matchesCapacity(item,guests){if(!guests)return true;const min=Number(item.capacity_min||0),max=Number(item.capacity_max||0);if(max&&max<guests)return false;if(min&&min>guests)return false;return Boolean(min||max)}
  function matchesBudget(item,budget){if(!budget)return true;const min=Number(item.price_min_per_person||0),max=Number(item.price_max_per_person||0);if(min)return min<=budget;if(max)return max<=budget;return false}
  function matchesFood(item,value){if(value==="veg")return item.food_veg===true;if(value==="nonveg")return item.food_non_veg===true;return true}

  function filteredVenues(){
    const term=search.value.trim().toLowerCase(),selected=city.value,guests=Number(guestFilter.value||0),budget=Number(budgetFilter.value||0),food=foodFilter.value,shortlisted=readIds(SHORTLIST_KEY);
    return venues.filter(item=>{const haystack=[item.venue_name,item.city,item.area,item.venue_type].join(" ").toLowerCase();return(!term||haystack.includes(term))&&(!selected||item.city===selected)&&matchesCapacity(item,guests)&&matchesBudget(item,budget)&&matchesFood(item,food)&&matchesQuickFilter(item)&&(!shortlistOnly||shortlisted.includes(String(item.id)))});
  }

  function updateToolCounts(){
    const s=readIds(SHORTLIST_KEY),c=readIds(COMPARE_KEY);shortlistCount.textContent=s.length;compareCount.textContent=c.length;showShortlisted.classList.toggle("active",shortlistOnly);openCompare.classList.toggle("active",c.length>0);
  }

  function render(){
    const filtered=filteredVenues();resultsCount.textContent=`${filtered.length} verified venue${filtered.length===1?"":"s"} found`;
    if(!filtered.length){grid.innerHTML='<div class="state-card"><h2>No matching venues found</h2><p>Try removing one filter or share your event requirement and our team will help you personally.</p><p style="margin-top:18px"><a class="button button-primary" href="index.html#enquiry">Send Venue Requirement</a></p></div>';updateToolCounts();return}
    grid.innerHTML=filtered.map(item=>{
      const id=encodeURIComponent(String(item.id||"")),rawId=String(item.id||""),name=String(item.venue_name||"Venue Partner"),location=[item.area,item.city].filter(Boolean).map(escapeHtml).join(", ")||"Location on request",description=item.description?escapeHtml(String(item.description).slice(0,135)):"Ask our team for availability, packages and venue details.",profile=`venue.html?id=${id}`,quote=`venue.html?id=${id}&quote=1`,cover=safeHttpUrl(item._resolvedCover||item.cover_image_url),media=cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(name)} venue" loading="lazy" decoding="async">`:'<div class="venue-card-image-fallback" aria-hidden="true">🏨</div>',featureHtml=features(item).map(feature=>`<span>✓ ${escapeHtml(feature)}</span>`).join("")||"<span>Details on request</span>";
      return`<article class="venue-card" data-venue-id="${escapeHtml(rawId)}"><div class="venue-card-media">${media}<div class="venue-card-top"><span class="venue-type">${escapeHtml(item.venue_type||"Venue")}</span><span class="verified">✓ Verified</span></div><div class="venue-card-savebar"><button class="venue-card-mini ${isShortlisted(rawId)?"saved":""}" type="button" data-shortlist="${escapeHtml(rawId)}">${isShortlisted(rawId)?"♥ Saved":"♡ Shortlist"}</button><button class="venue-card-mini ${isComparing(rawId)?"comparing":""}" type="button" data-compare="${escapeHtml(rawId)}">${isComparing(rawId)?"✓ Compare":"+ Compare"}</button></div></div><div class="venue-card-body"><h2>${escapeHtml(name)}</h2><p class="venue-location">⌖ ${location}</p><div class="venue-facts"><div class="venue-fact">${escapeHtml(capacity(item))}</div><div class="venue-fact">${escapeHtml(price(item))}</div></div><div class="venue-feature-list">${featureHtml}</div><p class="venue-description">${description}</p><div class="venue-actions"><a class="button button-primary" href="${profile}">View Venue</a><a class="button button-secondary" href="${quote}">Check Availability</a></div></div></article>`
    }).join("");updateToolCounts();
  }

  function toggleShortlist(id){let ids=readIds(SHORTLIST_KEY);ids=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];writeIds(SHORTLIST_KEY,ids);render()}
  function toggleCompare(id){let ids=readIds(COMPARE_KEY);if(ids.includes(id))ids=ids.filter(x=>x!==id);else if(ids.length<3)ids.push(id);else{alert("You can compare up to 3 venues at a time.");return}writeIds(COMPARE_KEY,ids);render();if(!compareDrawer.hidden)renderCompare()}

  function renderCompare(){
    const ids=readIds(COMPARE_KEY),items=ids.map(id=>venues.find(v=>String(v.id)===id)).filter(Boolean);
    if(!items.length){compareDrawer.hidden=true;return}
    const cell=(value,cls="")=>`<div class="${cls}">${escapeHtml(value||"—")}</div>`;
    let html=cell("Venue","compare-label")+items.map(v=>cell(v.venue_name,"compare-name")).join("");
    while(items.length<3){items.push(null);html+=cell("Add another venue","compare-empty")}
    const rows=[
      ["Location",v=>[v?.area,v?.city].filter(Boolean).join(", ")||"On request"],
      ["Capacity",v=>v?capacity(v):"—"],
      ["Price",v=>v?price(v):"—"],
      ["Vegetarian",v=>v?.food_veg?"Yes":"No / not listed"],
      ["Non-Veg",v=>v?.food_non_veg?"Yes":"No / not listed"],
      ["Parking",v=>v?.parking_available?"Available":"Not listed"],
      ["Rooms",v=>v?.rooms_available?"Available":"Not listed"],
      ["Catering",v=>v?.catering_available?"Available":"Not listed"],
      ["Decoration",v=>v?.decoration_available?"Available":"Not listed"]
    ];
    rows.forEach(([label,get])=>{html+=cell(label,"compare-label")+items.map(v=>cell(get(v))).join("")});compareTable.innerHTML=html;compareDrawer.hidden=false;
  }

  function clearFilters(){search.value="";city.value="";guestFilter.value="";budgetFilter.value="";foodFilter.value="";activeQuickFilter="all";shortlistOnly=false;quickFilters?.querySelectorAll("[data-filter]").forEach(btn=>btn.classList.toggle("active",btn.dataset.filter==="all"));render()}
  function applyUrlFilters(){const params=new URLSearchParams(location.search),loc=params.get("location"),guests=params.get("guests"),budget=params.get("budget"),food=params.get("food");if(loc)search.value=loc;if(guests&&guestFilter.querySelector(`option[value="${CSS.escape(guests)}"]`))guestFilter.value=guests;if(budget&&budgetFilter.querySelector(`option[value="${CSS.escape(budget)}"]`))budgetFilter.value=budget;if(["veg","nonveg"].includes(food))foodFilter.value=food}

  async function resolveAllCovers(){await Promise.all(venues.map(async item=>{if(!safeHttpUrl(item.cover_image_url))item._resolvedCover=await resolveVenueCover(item)}))}
  async function load(){
    if(!client){grid.innerHTML='<div class="state-card"><h2>Venue directory unavailable</h2><p>Please send your requirement and our team will assist you.</p></div>';return}
    let result=await client.rpc("smv_public_venues");
    if(result.error&&/function|schema cache/i.test(String(result.error.message||"")))result=await client.from("venues").select("id,venue_name,venue_type,description,city,area,capacity_min,capacity_max,price_min_per_person,price_max_per_person,food_veg,food_non_veg,parking_available,rooms_available,catering_available,decoration_available,google_maps_url,cover_image_url,featured").eq("venue_status","approved").eq("verification_status","verified").eq("public_listing_enabled",true).order("featured",{ascending:false}).order("venue_name",{ascending:true});
    if(result.error){console.error("Venue directory error:",result.error);grid.innerHTML='<div class="state-card"><h2>Venue listings are being updated</h2><p>Please share your requirement and our team will send suitable verified options.</p></div>';return}
    venues=Array.isArray(result.data)?result.data.map(item=>item?.venue||item):[];[...new Set(venues.map(item=>item.city).filter(Boolean))].sort().forEach(name=>city.add(new Option(name,name)));applyUrlFilters();render();await resolveAllCovers();render();
  }

  [search,city,guestFilter,budgetFilter,foodFilter].forEach(control=>control?.addEventListener(control===search?"input":"change",render));
  quickFilters?.addEventListener("click",event=>{const button=event.target.closest("[data-filter]");if(!button)return;activeQuickFilter=button.dataset.filter||"all";quickFilters.querySelectorAll("[data-filter]").forEach(item=>item.classList.toggle("active",item===button));render()});
  grid?.addEventListener("click",event=>{const s=event.target.closest("[data-shortlist]"),c=event.target.closest("[data-compare]");if(s){event.preventDefault();toggleShortlist(String(s.dataset.shortlist));return}if(c){event.preventDefault();toggleCompare(String(c.dataset.compare))}});
  showShortlisted?.addEventListener("click",()=>{shortlistOnly=!shortlistOnly;render()});
  openCompare?.addEventListener("click",renderCompare);document.getElementById("closeCompare")?.addEventListener("click",()=>compareDrawer.hidden=true);document.getElementById("clearVenueFilters")?.addEventListener("click",clearFilters);
  window.addEventListener("storage",event=>{if([SHORTLIST_KEY,COMPARE_KEY].includes(event.key)){render();if(!compareDrawer.hidden)renderCompare()}});
  updateToolCounts();load();
})();