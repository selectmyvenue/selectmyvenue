(function(){
  "use strict";
  const SUPABASE_URL="https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY="sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  const grid=document.getElementById("venueGrid");
  const search=document.getElementById("venueSearch");
  const city=document.getElementById("venueCity");
  let venues=[];

  const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const safeHttpUrl=value=>{try{const url=new URL(String(value||""));return ["http:","https:"].includes(url.protocol)?url.href:""}catch(_){return ""}};
  const money=value=>value===null||value===undefined||value===""?null:new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value));
  const capacity=item=>{
    const min=Number(item.capacity_min||0);const max=Number(item.capacity_max||0);
    if(min&&max)return `${min}–${max} guests`;if(max)return `Up to ${max} guests`;if(min)return `${min}+ guests`;return "On request";
  };
  const price=item=>{
    const min=money(item.price_min_per_person);const max=money(item.price_max_per_person);
    if(min&&max)return `${min}–${max}/person`;return min?`${min}+/person`:max?`Up to ${max}/person`:"Quote on request";
  };
  const features=item=>{
    const list=[];
    if(item.food_veg)list.push("Vegetarian");
    if(item.food_non_veg)list.push("Non-Vegetarian");
    if(item.parking_available)list.push("Parking");
    if(item.rooms_available)list.push("Rooms");
    if(item.catering_available)list.push("Catering");
    if(item.decoration_available)list.push("Decoration");
    return list.slice(0,4);
  };
  function render(){
    const term=search.value.trim().toLowerCase();const selected=city.value;
    const filtered=venues.filter(item=>{
      const haystack=[item.venue_name,item.city,item.area,item.venue_type].join(" ").toLowerCase();
      return (!term||haystack.includes(term))&&(!selected||item.city===selected);
    });
    if(!filtered.length){
      grid.innerHTML='<div class="state-card"><h2>No matching venues found</h2><p>Change the search or send your requirement and our team will help you personally.</p><p style="margin-top:18px"><a class="button button-primary" href="index.html#enquiry">Send Venue Requirement</a></p></div>';
      return;
    }
    grid.innerHTML=filtered.map(item=>{
      const id=encodeURIComponent(String(item.id||""));
      const name=String(item.venue_name||"Venue Partner");
      const location=[item.area,item.city].filter(Boolean).map(escapeHtml).join(", ")||"Location on request";
      const description=item.description?escapeHtml(String(item.description).slice(0,180)):"Ask our team for availability, packages and venue details.";
      const quote=`index.html?venue=${id}&venue_name=${encodeURIComponent(name)}#enquiry`;
      const profile=`venue.html?id=${id}`;
      const map=item.google_maps_url&&/^https?:\/\//i.test(item.google_maps_url)?`<a class="button button-secondary" href="${escapeHtml(item.google_maps_url)}" target="_blank" rel="noopener">Map</a>`:"";
      const cover=safeHttpUrl(item.cover_image_url);
      const media=cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(name)} venue" loading="lazy" decoding="async">`:'<div class="venue-card-image-fallback" aria-hidden="true">🏨</div>';
      const featureHtml=features(item).map(feature=>`<span>✓ ${escapeHtml(feature)}</span>`).join("")||"<span>Details on request</span>";
      return `<article class="venue-card"><div class="venue-card-media">${media}<div class="venue-card-top"><span class="venue-type">${escapeHtml(item.venue_type||"Venue")}</span><span class="verified">✓ Verified</span></div></div><div class="venue-card-body"><h2>${escapeHtml(name)}</h2><p class="venue-location">⌖ ${location}</p><div class="venue-facts"><div class="venue-fact">${escapeHtml(capacity(item))}</div><div class="venue-fact">${escapeHtml(price(item))}</div></div><div class="venue-feature-list">${featureHtml}</div><p class="venue-description">${description}</p><div class="venue-actions"><a class="button button-primary" href="${profile}">View Profile</a><a class="button button-secondary" href="${quote}">Get Quote</a>${map}</div></div></article>`;
    }).join("");
  }
  async function load(){
    if(!client){grid.innerHTML='<div class="state-card"><h2>Venue directory unavailable</h2><p>Please send your requirement and our team will assist you.</p></div>';return;}
    let result=await client.rpc("smv_public_venues");
    if(result.error&&/function|schema cache/i.test(String(result.error.message||""))){
      result=await client.from("venues").select("id,venue_name,venue_type,description,city,area,capacity_min,capacity_max,price_min_per_person,price_max_per_person,food_veg,food_non_veg,parking_available,rooms_available,google_maps_url,featured").eq("venue_status","approved").eq("verification_status","verified").eq("public_listing_enabled",true).order("featured",{ascending:false}).order("venue_name",{ascending:true});
    }
    if(result.error){console.error("Venue directory error:",result.error);grid.innerHTML='<div class="state-card"><h2>Venue listings are being updated</h2><p>Please share your requirement and our team will send suitable verified options.</p><p style="margin-top:18px"><a class="button button-primary" href="index.html#enquiry">Find My Venue</a></p></div>';return;}
    venues=Array.isArray(result.data)
      ? result.data.map(item=>item?.venue||item)
      : [];
    [...new Set(venues.map(item=>item.city).filter(Boolean))].sort().forEach(name=>city.add(new Option(name,name)));
    render();
  }
  search.addEventListener("input",render);city.addEventListener("change",render);load();
})();
