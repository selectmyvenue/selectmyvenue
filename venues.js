(function(){
  "use strict";

  const SUPABASE_URL="https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY="sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const MEDIA_BUCKET="venue-media";
  const SHORTLIST_KEY="smv_venue_shortlist_v2";
  const COMPARE_KEY="smv_venue_compare_v2";
  const client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const grid=document.getElementById("venueGrid");
  const search=document.getElementById("venueSearch");
  const city=document.getElementById("venueCity");
  const quickFilters=document.getElementById("venueQuickFilters");
  const filterShell=document.querySelector(".venue-filter-shell");
  const params=new URLSearchParams(location.search);

  let venues=[];
  let activeQuickFilter="all";
  let areaFilter="";
  let typeFilter="";
  let guestFilter="";
  let budgetFilter="";
  let eventFilter="";
  let sortMode="recommended";
  let shortlist=readStoredIds(SHORTLIST_KEY);
  let compare=readStoredIds(COMPARE_KEY).slice(0,3);

  const requirement={
    event:String(params.get("event_type")||params.get("event")||"").trim(),
    location:String(params.get("location")||params.get("city")||"").trim(),
    guests:Number(String(params.get("guests")||"").replace(/[^0-9]/g,""))||0,
    budget:Number(String(params.get("budget")||"").replace(/[^0-9]/g,""))||0
  };

  const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const safeHttpUrl=value=>{try{const url=new URL(String(value||""));return ["http:","https:"].includes(url.protocol)?url.href:""}catch(_){return ""}};
  const money=value=>value===null||value===undefined||value===""?null:new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value));
  const capacity=item=>{const min=Number(item.capacity_min||0),max=Number(item.capacity_max||0);if(min&&max)return`${min}–${max} guests`;if(max)return`Up to ${max} guests`;if(min)return`${min}+ guests`;return"On request"};
  const price=item=>{const min=money(item.price_min_per_person),max=money(item.price_max_per_person);if(min&&max)return`${min}–${max}/person`;return min?`${min}+/person`:max?`Up to ${max}/person`:"Quote on request"};
  const features=item=>{const list=[];if(item.food_veg)list.push("Vegetarian");if(item.food_non_veg)list.push("Non-Vegetarian");if(item.parking_available)list.push("Parking");if(item.rooms_available)list.push("Rooms");if(item.catering_available)list.push("Catering");if(item.decoration_available)list.push("Decoration");return list.slice(0,5)};
  const normal=value=>String(value||"").trim().toLowerCase();

  function readStoredIds(key){
    try{const value=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(value)?value.map(String).filter(Boolean):[]}catch(_){return[]}
  }
  function writeStoredIds(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
  function eventTypes(item){
    const raw=item.event_types||item.events||item.suitable_events||[];
    if(Array.isArray(raw))return raw.map(String).filter(Boolean);
    return String(raw||"").split(/[,|]/).map(x=>x.trim()).filter(Boolean);
  }
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

  function installMarketplaceStyles(){
    if(document.getElementById("smvVenueMarketplaceStyles"))return;
    const style=document.createElement("style");
    style.id="smvVenueMarketplaceStyles";
    style.textContent=`
      .smv-advanced-filters{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:12px}.smv-advanced-filters select{width:100%;min-height:42px;border:1px solid rgba(109,231,211,.16);border-radius:11px;background:#082a27;color:#d9eeeb;padding:0 11px;font:inherit;font-size:11px;font-weight:800;outline:none}.smv-match-strip{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:14px 0 0;padding:12px 14px;border:1px solid rgba(243,200,75,.2);border-radius:13px;background:linear-gradient(135deg,rgba(243,200,75,.06),rgba(45,210,189,.04));color:#c9dedb;font-size:11px;font-weight:750}.smv-match-strip strong{color:#f3d276}.smv-card-match{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}.smv-card-match span{padding:5px 8px;border-radius:999px;background:rgba(45,210,189,.075);border:1px solid rgba(45,210,189,.14);color:#9ee9dc;font-size:9px;font-weight:900}.smv-card-match .score{background:rgba(243,200,75,.08);border-color:rgba(243,200,75,.2);color:#f3d276}.smv-venue-tools{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.smv-tool-btn{min-height:38px;border:1px solid rgba(109,231,211,.16);border-radius:10px;background:rgba(255,255,255,.025);color:#bfd7d3;font:inherit;font-size:10px;font-weight:900;cursor:pointer}.smv-tool-btn.active{border-color:rgba(243,200,75,.42);background:rgba(243,200,75,.08);color:#f4d883}.smv-market-bar{position:fixed;z-index:9990;left:50%;bottom:18px;transform:translateX(-50%);width:min(880px,calc(100% - 24px));display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid rgba(243,200,75,.28);border-radius:16px;background:rgba(3,24,23,.96);box-shadow:0 18px 50px rgba(0,0,0,.35);backdrop-filter:blur(14px);color:#dbeeea}.smv-market-bar[hidden]{display:none!important}.smv-market-bar small{display:block;color:#91b5af;font-size:9px;font-weight:750;margin-top:2px}.smv-market-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.smv-market-actions button{min-height:38px;padding:0 12px;border-radius:9px;border:1px solid rgba(109,231,211,.2);background:rgba(255,255,255,.04);color:#d9efeb;font-size:10px;font-weight:900;cursor:pointer}.smv-market-actions button.primary{border:0;background:linear-gradient(135deg,#2dd2bd,#0f8f80);color:#03231f}.smv-compare-overlay,.smv-multi-overlay{position:fixed;z-index:10020;inset:0;display:grid;place-items:center;padding:18px;background:rgba(0,16,15,.72);backdrop-filter:blur(8px)}.smv-compare-overlay[hidden],.smv-multi-overlay[hidden]{display:none!important}.smv-compare-card,.smv-multi-card{width:min(980px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(109,231,211,.18);border-radius:20px;background:#071f1d;color:#e9f7f4;box-shadow:0 28px 80px rgba(0,0,0,.45);padding:20px}.smv-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}.smv-modal-head h2{margin:0;color:#fff;font-size:25px}.smv-close{width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.07);color:#fff;font-size:22px;cursor:pointer}.smv-compare-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.smv-compare-item{padding:15px;border:1px solid rgba(109,231,211,.13);border-radius:14px;background:rgba(255,255,255,.025)}.smv-compare-item h3{margin:0 0 10px;font-size:17px;color:#fff}.smv-compare-row{padding:8px 0;border-top:1px solid rgba(255,255,255,.06);font-size:11px;color:#b9d4cf}.smv-compare-row b{display:block;color:#f3d276;font-size:9px;letter-spacing:.06em;margin-bottom:3px}.smv-multi-form{display:grid;grid-template-columns:1fr 1fr;gap:11px}.smv-multi-form label{display:grid;gap:5px}.smv-multi-form label span{font-size:9px;color:#98b9b4;font-weight:900;letter-spacing:.06em}.smv-multi-form input,.smv-multi-form select,.smv-multi-form textarea{width:100%;min-height:44px;border:1px solid rgba(109,231,211,.15);border-radius:10px;background:#0b2b28;color:#fff;padding:0 11px;font:inherit;font-size:12px}.smv-multi-form .full{grid-column:1/-1}.smv-multi-form textarea{padding:10px;min-height:78px}.smv-multi-submit{grid-column:1/-1;min-height:46px;border:0;border-radius:11px;background:linear-gradient(135deg,#f6d66e,#e8b832);color:#231b05;font-weight:950;cursor:pointer}.smv-multi-status{grid-column:1/-1;min-height:18px;font-size:11px;font-weight:800}.smv-multi-status.success{color:#78ead9}.smv-multi-status.error{color:#ffaaa5}
      @media(max-width:1050px){.smv-advanced-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.smv-compare-grid{grid-template-columns:1fr}}
      @media(max-width:620px){.smv-advanced-filters{grid-template-columns:1fr}.smv-match-strip{display:block}.smv-match-strip span{display:block;margin-top:5px}.smv-market-bar{align-items:flex-start;bottom:8px}.smv-market-actions{max-width:55%}.smv-multi-form{grid-template-columns:1fr}.smv-multi-form .full,.smv-multi-submit,.smv-multi-status{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function installAdvancedControls(){
    if(!filterShell||document.getElementById("smvAdvancedFilters"))return;
    const wrap=document.createElement("div");
    wrap.id="smvAdvancedFilters";
    wrap.className="smv-advanced-filters";
    wrap.innerHTML=`
      <select id="smvAreaFilter" aria-label="Filter by area"><option value="">All Areas</option></select>
      <select id="smvTypeFilter" aria-label="Filter by venue type"><option value="">All Venue Types</option></select>
      <select id="smvGuestFilter" aria-label="Filter by guest capacity"><option value="">Any Capacity</option><option value="100">Up to 100 guests</option><option value="200">Up to 200 guests</option><option value="300">Up to 300 guests</option><option value="500">Up to 500 guests</option><option value="800">Up to 800 guests</option><option value="1000">1000+ guests</option></select>
      <select id="smvBudgetFilter" aria-label="Filter by price per person"><option value="">Any Price</option><option value="1000">Up to ₹1,000/person</option><option value="1500">Up to ₹1,500/person</option><option value="2000">Up to ₹2,000/person</option><option value="3000">Up to ₹3,000/person</option><option value="5000">Up to ₹5,000/person</option></select>
      <select id="smvSort" aria-label="Sort venues"><option value="recommended">Recommended</option><option value="price-low">Price: Low to High</option><option value="capacity-high">Capacity: High to Low</option><option value="name">Name: A–Z</option></select>`;
    filterShell.appendChild(wrap);

    const strip=document.createElement("div");
    strip.id="smvMatchStrip";
    strip.className="smv-match-strip";
    strip.hidden=true;
    filterShell.appendChild(strip);

    document.getElementById("smvAreaFilter")?.addEventListener("change",e=>{areaFilter=e.target.value;render()});
    document.getElementById("smvTypeFilter")?.addEventListener("change",e=>{typeFilter=e.target.value;render()});
    document.getElementById("smvGuestFilter")?.addEventListener("change",e=>{guestFilter=e.target.value;render()});
    document.getElementById("smvBudgetFilter")?.addEventListener("change",e=>{budgetFilter=e.target.value;render()});
    document.getElementById("smvSort")?.addEventListener("change",e=>{sortMode=e.target.value;render()});
  }

  function installMarketBar(){
    if(document.getElementById("smvMarketBar"))return;
    const bar=document.createElement("div");
    bar.id="smvMarketBar";
    bar.className="smv-market-bar";
    bar.hidden=true;
    bar.innerHTML=`<div><strong id="smvMarketCount">0 venues selected</strong><small>Shortlist venues, compare up to 3, or send one enquiry for multiple venues.</small></div><div class="smv-market-actions"><button id="smvCompareBtn" type="button">Compare</button><button id="smvMultiBtn" class="primary" type="button">Check Multiple Venues</button></div>`;
    document.body.appendChild(bar);
    document.getElementById("smvCompareBtn")?.addEventListener("click",openCompare);
    document.getElementById("smvMultiBtn")?.addEventListener("click",openMultiEnquiry);
  }

  function updateMarketBar(){
    const bar=document.getElementById("smvMarketBar");
    if(!bar)return;
    const selected=[...new Set([...shortlist,...compare])].filter(id=>venues.some(v=>String(v.id)===id));
    bar.hidden=!selected.length;
    document.getElementById("smvMarketCount").textContent=`${selected.length} venue${selected.length===1?"":"s"} selected`;
    const compareBtn=document.getElementById("smvCompareBtn");
    if(compareBtn)compareBtn.disabled=compare.length<2;
  }

  function calculateFit(item){
    const reasons=[];
    let points=0,possible=0;
    if(requirement.location){
      possible+=30;
      const q=normal(requirement.location),loc=normal([item.area,item.city].filter(Boolean).join(" "));
      if(loc.includes(q)||q.includes(normal(item.city))||q.includes(normal(item.area))){points+=30;reasons.push("Location fits")}
    }
    if(requirement.guests){
      possible+=30;
      const min=Number(item.capacity_min||0),max=Number(item.capacity_max||0);
      if((!min||requirement.guests>=min)&&(!max||requirement.guests<=max)){points+=30;reasons.push("Guest capacity fits")}
      else if(max&&requirement.guests<=max*1.15){points+=12;reasons.push("Capacity close")}
    }
    if(requirement.budget){
      possible+=25;
      const min=Number(item.price_min_per_person||0),max=Number(item.price_max_per_person||0);
      if((min&&requirement.budget>=min)||(!min&&max&&requirement.budget<=max)){points+=25;reasons.push("Budget aligned")}
      else if(min&&requirement.budget>=min*.85){points+=12;reasons.push("Budget close")}
    }
    if(requirement.event){
      possible+=15;
      const types=eventTypes(item).map(normal);
      if(!types.length){points+=7}
      else if(types.some(x=>x.includes(normal(requirement.event))||normal(requirement.event).includes(x))){points+=15;reasons.push("Event suitable")}
    }
    if(!possible)return{score:null,reasons:[]};
    return{score:Math.round(points/possible*100),reasons:reasons.slice(0,3)};
  }

  function matchesQuickFilter(item){
    if(activeQuickFilter==="parking")return item.parking_available===true;
    if(activeQuickFilter==="rooms")return item.rooms_available===true;
    if(activeQuickFilter==="veg")return item.food_veg===true;
    if(activeQuickFilter==="nonveg")return item.food_non_veg===true;
    if(activeQuickFilter==="300plus")return Number(item.capacity_max||item.capacity_min||0)>=300;
    return true;
  }

  function matchesAdvanced(item){
    if(areaFilter&&String(item.area||"")!==areaFilter)return false;
    if(typeFilter&&String(item.venue_type||"")!==typeFilter)return false;
    if(eventFilter){
      const types=eventTypes(item).map(normal);
      if(types.length&&!types.some(x=>x.includes(normal(eventFilter))))return false;
    }
    if(guestFilter){
      const wanted=Number(guestFilter),max=Number(item.capacity_max||0),min=Number(item.capacity_min||0);
      if(wanted===1000){if((max||min)<1000)return false}
      else if(max&&max<wanted)return false;
    }
    if(budgetFilter){
      const cap=Number(budgetFilter),min=Number(item.price_min_per_person||0);
      if(min&&min>cap)return false;
    }
    return true;
  }

  function render(){
    if(!grid||!search||!city)return;
    const term=search.value.trim().toLowerCase(),selected=city.value;
    let filtered=venues.filter(item=>{
      const haystack=[item.venue_name,item.city,item.area,item.venue_type,eventTypes(item).join(" ")].join(" ").toLowerCase();
      return(!term||haystack.includes(term))&&(!selected||item.city===selected)&&matchesQuickFilter(item)&&matchesAdvanced(item);
    });

    filtered=filtered.map(item=>Object.assign(item,{_fit:calculateFit(item)}));
    if(sortMode==="price-low")filtered.sort((a,b)=>(Number(a.price_min_per_person)||999999)-(Number(b.price_min_per_person)||999999));
    else if(sortMode==="capacity-high")filtered.sort((a,b)=>(Number(b.capacity_max||b.capacity_min)||0)-(Number(a.capacity_max||a.capacity_min)||0));
    else if(sortMode==="name")filtered.sort((a,b)=>String(a.venue_name||"").localeCompare(String(b.venue_name||"")));
    else if(Object.values(requirement).some(Boolean))filtered.sort((a,b)=>(b._fit.score||0)-(a._fit.score||0));

    const strip=document.getElementById("smvMatchStrip");
    if(strip){
      const parts=[];if(requirement.event)parts.push(requirement.event);if(requirement.location)parts.push(requirement.location);if(requirement.guests)parts.push(`${requirement.guests} guests`);if(requirement.budget)parts.push(`₹${requirement.budget.toLocaleString("en-IN")}/person`);
      strip.hidden=!parts.length;
      if(parts.length)strip.innerHTML=`<strong>Requirement-based ranking active</strong><span>${escapeHtml(parts.join(" · "))} · Fit score uses only real venue fields available on Select My Venue.</span>`;
    }

    if(!filtered.length){grid.innerHTML='<div class="state-card"><h2>No matching venues found</h2><p>Try another filter or share your event requirement and our team will help you personally.</p><p style="margin-top:18px"><a class="button button-primary" href="index.html#enquiry">Send Venue Requirement</a></p></div>';updateMarketBar();return}

    grid.innerHTML=filtered.map(item=>{
      const rawId=String(item.id||"");
      const id=encodeURIComponent(rawId);
      const name=String(item.venue_name||"Venue Partner");
      const locationText=[item.area,item.city].filter(Boolean).map(escapeHtml).join(", ")||"Location on request";
      const description=item.description?escapeHtml(String(item.description).slice(0,155)):"Ask our team for availability, packages and venue details.";
      const profile=`venue.html?id=${id}`;
      const quote=`venue.html?id=${id}&quote=1`;
      const cover=safeHttpUrl(item._resolvedCover||item.cover_image_url);
      const media=cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(name)} venue" loading="lazy" decoding="async">`:'<div class="venue-card-image-fallback" aria-hidden="true">🏨</div>';
      const featureHtml=features(item).map(feature=>`<span>✓ ${escapeHtml(feature)}</span>`).join("")||"<span>Details on request</span>";
      const fit=item._fit||{score:null,reasons:[]};
      const fitHtml=fit.score===null?"":`<div class="smv-card-match"><span class="score">${fit.score}% requirement fit</span>${fit.reasons.map(reason=>`<span>✓ ${escapeHtml(reason)}</span>`).join("")}</div>`;
      const shortlisted=shortlist.includes(rawId),compared=compare.includes(rawId);
      return`<article class="venue-card" data-venue-id="${escapeHtml(rawId)}"><div class="venue-card-media">${media}<div class="venue-card-top"><span class="venue-type">${escapeHtml(item.venue_type||"Venue")}</span><span class="verified">✓ Verified</span></div></div><div class="venue-card-body"><h2>${escapeHtml(name)}</h2><p class="venue-location">⌖ ${locationText}</p>${fitHtml}<div class="venue-facts"><div class="venue-fact">${escapeHtml(capacity(item))}</div><div class="venue-fact">${escapeHtml(price(item))}</div></div><div class="venue-feature-list">${featureHtml}</div><p class="venue-description">${description}</p><div class="venue-actions"><a class="button button-primary" href="${profile}">View Venue</a><a class="button button-secondary" href="${quote}">Check Availability</a></div><div class="smv-venue-tools"><button class="smv-tool-btn ${shortlisted?"active":""}" type="button" data-shortlist="${escapeHtml(rawId)}">${shortlisted?"✓ Shortlisted":"♡ Shortlist"}</button><button class="smv-tool-btn ${compared?"active":""}" type="button" data-compare="${escapeHtml(rawId)}">${compared?"✓ Comparing":"Compare"}</button></div></div></article>`;
    }).join("");
    updateMarketBar();
  }

  function populateAdvancedOptions(){
    const areas=[...new Set(venues.map(v=>v.area).filter(Boolean))].sort();
    const types=[...new Set(venues.map(v=>v.venue_type).filter(Boolean))].sort();
    const area=document.getElementById("smvAreaFilter"),type=document.getElementById("smvTypeFilter");
    if(area){area.innerHTML='<option value="">All Areas</option>'+areas.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("")}
    if(type){type.innerHTML='<option value="">All Venue Types</option>'+types.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("")}
    if(requirement.location&&city){
      const direct=[...city.options].find(opt=>normal(requirement.location).includes(normal(opt.value))||normal(opt.value).includes(normal(requirement.location)));
      if(direct)city.value=direct.value;
    }
  }

  function toggleShortlist(id){
    if(shortlist.includes(id))shortlist=shortlist.filter(x=>x!==id);else shortlist=[...shortlist,id].slice(-8);
    writeStoredIds(SHORTLIST_KEY,shortlist);render();
  }
  function toggleCompare(id){
    if(compare.includes(id))compare=compare.filter(x=>x!==id);
    else if(compare.length<3)compare=[...compare,id];
    else{window.alert("Compare supports up to 3 venues at a time.");return}
    writeStoredIds(COMPARE_KEY,compare);render();
  }
  function selectedVenueRows(){
    const ids=[...new Set([...compare,...shortlist])];
    return ids.map(id=>venues.find(v=>String(v.id)===id)).filter(Boolean);
  }

  function openCompare(){
    const rows=compare.map(id=>venues.find(v=>String(v.id)===id)).filter(Boolean);
    if(rows.length<2)return;
    let overlay=document.getElementById("smvCompareOverlay");
    if(!overlay){overlay=document.createElement("div");overlay.id="smvCompareOverlay";overlay.className="smv-compare-overlay";document.body.appendChild(overlay)}
    overlay.innerHTML=`<section class="smv-compare-card" role="dialog" aria-modal="true"><div class="smv-modal-head"><div><h2>Compare selected venues</h2><p style="margin:5px 0 0;color:#96b7b1;font-size:11px">Only published venue information is compared.</p></div><button class="smv-close" type="button" data-close-compare>×</button></div><div class="smv-compare-grid">${rows.map(v=>`<article class="smv-compare-item"><h3>${escapeHtml(v.venue_name||"Venue")}</h3><div class="smv-compare-row"><b>LOCATION</b>${escapeHtml([v.area,v.city].filter(Boolean).join(", ")||"On request")}</div><div class="smv-compare-row"><b>CAPACITY</b>${escapeHtml(capacity(v))}</div><div class="smv-compare-row"><b>PRICE</b>${escapeHtml(price(v))}</div><div class="smv-compare-row"><b>TYPE</b>${escapeHtml(v.venue_type||"Venue")}</div><div class="smv-compare-row"><b>FACILITIES</b>${escapeHtml(features(v).join(" · ")||"On request")}</div><div class="smv-compare-row"><b>REQUIREMENT FIT</b>${v._fit?.score!=null?`${v._fit.score}% · ${escapeHtml(v._fit.reasons.join(" · "))}`:"Add event details for fit ranking"}</div></article>`).join("")}</div></section>`;
    overlay.hidden=false;
    overlay.querySelector("[data-close-compare]")?.addEventListener("click",()=>overlay.hidden=true);
    overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.hidden=true},{once:true});
  }

  function openMultiEnquiry(){
    const rows=selectedVenueRows().slice(0,5);
    if(!rows.length)return;
    let overlay=document.getElementById("smvMultiOverlay");
    if(!overlay){overlay=document.createElement("div");overlay.id="smvMultiOverlay";overlay.className="smv-multi-overlay";document.body.appendChild(overlay)}
    overlay.innerHTML=`<section class="smv-multi-card" role="dialog" aria-modal="true"><div class="smv-modal-head"><div><h2>Check multiple venues once</h2><p style="margin:5px 0 0;color:#96b7b1;font-size:11px">Selected: ${rows.map(v=>escapeHtml(v.venue_name||"Venue")).join(" · ")}</p></div><button class="smv-close" type="button" data-close-multi>×</button></div><form id="smvMultiForm" class="smv-multi-form"><label><span>NAME *</span><input id="smvMultiName" autocomplete="name" required></label><label><span>MOBILE *</span><input id="smvMultiMobile" inputmode="numeric" autocomplete="tel" maxlength="14" required></label><label><span>EVENT *</span><select id="smvMultiEvent" required><option value="">Select event</option><option>Wedding</option><option>Engagement</option><option>Reception</option><option>Birthday</option><option>Corporate Event</option><option>Party</option><option>Anniversary</option><option>Other</option></select></label><label><span>EVENT DATE</span><input id="smvMultiDate" type="date"></label><label><span>GUESTS</span><input id="smvMultiGuests" type="number" min="1"></label><label><span>BUDGET / PERSON</span><input id="smvMultiBudget" type="number" min="0"></label><label class="full"><span>OTHER REQUIREMENTS</span><textarea id="smvMultiRequirements" placeholder="Parking, rooms, food or anything important"></textarea></label><button class="smv-multi-submit" id="smvMultiSubmit" type="submit">Send One Enquiry for Selected Venues →</button><div id="smvMultiStatus" class="smv-multi-status" role="status" aria-live="polite"></div></form></section>`;
    overlay.hidden=false;
    overlay.querySelector("[data-close-multi]")?.addEventListener("click",()=>overlay.hidden=true);
    const form=overlay.querySelector("#smvMultiForm");
    form?.addEventListener("submit",async event=>{
      event.preventDefault();
      const status=document.getElementById("smvMultiStatus"),button=document.getElementById("smvMultiSubmit");
      const name=String(document.getElementById("smvMultiName")?.value||"").trim();
      const mobile=String(document.getElementById("smvMultiMobile")?.value||"").replace(/\D/g,"").slice(-10);
      const occasion=String(document.getElementById("smvMultiEvent")?.value||"").trim();
      const date=document.getElementById("smvMultiDate")?.value||null;
      const guests=Number(document.getElementById("smvMultiGuests")?.value||0)||null;
      const budget=Number(document.getElementById("smvMultiBudget")?.value||0)||null;
      const other=String(document.getElementById("smvMultiRequirements")?.value||"").trim();
      if(name.length<2){status.textContent="Please enter your name.";status.className="smv-multi-status error";return}
      if(mobile.length!==10){status.textContent="Please enter a valid 10-digit mobile number.";status.className="smv-multi-status error";return}
      if(!occasion){status.textContent="Please select your event.";status.className="smv-multi-status error";return}
      if(!client){status.textContent="Enquiry service is not ready. Please use WhatsApp.";status.className="smv-multi-status error";return}
      const venueLines=rows.map((v,i)=>`${i+1}. ${v.venue_name} | Venue ID: ${v.id} | ${[v.area,v.city].filter(Boolean).join(", ")||"Location on request"}`);
      const requirements=["MULTI-VENUE ENQUIRY",...venueLines,other?`Customer requirements: ${other}`:null,"Submitted from Browse Venues multi-venue enquiry"].filter(Boolean).join("\n");
      button.disabled=true;button.textContent="Sending…";status.textContent="";
      const {error}=await client.from("customer_enquiries").insert({customer_name:name,mobile,location:requirement.location||rows[0]?.city||null,occasion,event_date:date,guests,budget_per_person:budget,requirements,source:"Website - Multi Venue Enquiry",status:"new"});
      button.disabled=false;button.textContent="Send One Enquiry for Selected Venues →";
      if(error){console.error("Multi venue enquiry error:",error);status.textContent="Unable to send right now. Please try again or use WhatsApp.";status.className="smv-multi-status error";return}
      status.textContent="✓ Enquiry received. Your selected venues are attached to this request.";status.className="smv-multi-status success";form.reset();
    });
  }

  async function resolveAllCovers(){
    await Promise.all(venues.map(async item=>{if(!safeHttpUrl(item.cover_image_url))item._resolvedCover=await resolveVenueCover(item)}));
  }

  async function load(){
    if(!grid||!search||!city)return;
    installMarketplaceStyles();installAdvancedControls();installMarketBar();
    if(!client){grid.innerHTML='<div class="state-card"><h2>Venue directory unavailable</h2><p>Please send your requirement and our team will assist you.</p></div>';return}
    let result=await client.rpc("smv_public_venues");
    if(result.error&&/function|schema cache/i.test(String(result.error.message||""))){
      result=await client.from("venues").select("id,venue_name,venue_type,description,city,area,capacity_min,capacity_max,price_min_per_person,price_max_per_person,food_veg,food_non_veg,parking_available,rooms_available,catering_available,decoration_available,google_maps_url,cover_image_url,featured,event_types").eq("venue_status","approved").eq("verification_status","verified").eq("public_listing_enabled",true).order("featured",{ascending:false}).order("venue_name",{ascending:true})
    }
    if(result.error){console.error("Venue directory error:",result.error);grid.innerHTML='<div class="state-card"><h2>Venue listings are being updated</h2><p>Please share your requirement and our team will send suitable verified options.</p><p style="margin-top:18px"><a class="button button-primary" href="index.html#enquiry">Find My Venue</a></p></div>';return}
    venues=Array.isArray(result.data)?result.data.map(item=>item?.venue||item):[];
    [...new Set(venues.map(item=>item.city).filter(Boolean))].sort().forEach(name=>city.add(new Option(name,name)));
    populateAdvancedOptions();
    render();
    await resolveAllCovers();
    render();
  }

  search?.addEventListener("input",render);
  city?.addEventListener("change",render);
  quickFilters?.addEventListener("click",event=>{
    const button=event.target.closest("[data-filter]");
    if(!button)return;
    activeQuickFilter=button.dataset.filter||"all";
    quickFilters.querySelectorAll("[data-filter]").forEach(item=>item.classList.toggle("active",item===button));
    render();
  });
  grid?.addEventListener("click",event=>{
    const shortButton=event.target.closest("[data-shortlist]");
    if(shortButton){event.preventDefault();toggleShortlist(String(shortButton.dataset.shortlist||""));return}
    const compareButton=event.target.closest("[data-compare]");
    if(compareButton){event.preventDefault();toggleCompare(String(compareButton.dataset.compare||""));}
  });

  load();
})();
