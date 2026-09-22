(function(){
  "use strict";
  const grid=document.getElementById("weddingVenueCards"),status=document.getElementById("weddingVenueStatus");
  if(!grid||!status)return;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const safeImage=v=>{try{const u=new URL(v);return ["https:","http:"].includes(u.protocol)?u.href:""}catch(_){return ""}};
  async function load(){
    try{
      if(!window.supabase?.createClient)throw new Error("Venue service unavailable");
      const client=window.supabase.createClient("https://uajqwyoqbbswkfiwosyw.supabase.co","sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7",{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const result=await client.rpc("smv_public_venues");if(result.error)throw result.error;
      const rows=(Array.isArray(result.data)?result.data:[]).map(x=>x?.venue||x).filter(Boolean);
      const confirmed=rows.filter(v=>window.SMVPublicDetails.events(v).some(e=>/^weddings?$/i.test(e)));
      const pending=rows.filter(v=>!window.SMVPublicDetails.events(v).length&&/banquet|farmhouse|hotel|lawn|resort/i.test(v.venue_type||""));
      const show=[...confirmed,...pending].slice(0,6);
      status.textContent=confirmed.length?`${confirmed.length} venues list wedding support. Any additional options below are clearly marked for confirmation.`:"Wedding support is awaiting confirmation in venue listings. Explore these spaces and ask our team to confirm suitability for your ceremony, guests and date.";
      if(!show.length){status.textContent="No confirmed wedding options are listed yet. Send your requirements and our team will help confirm suitable venues.";return}
      grid.innerHTML=show.map(v=>{const name=v.venue_name||"Venue",photo=safeImage(v.cover_image_url),href="venue.html?id="+encodeURIComponent(v.id),verified=confirmed.includes(v);return `<article class="smv-showcase-card">${photo?`<a href="${href}"><img src="${esc(photo)}" alt="${esc(name)}" loading="lazy"></a>`:""}<div><h3>${esc(name)}</h3><p>${esc(window.SMVPublicDetails.location(v))}</p><p>${v.capacity_max?`Up to ${esc(v.capacity_max)} guests`:"Capacity on request"} · ${Number(v.price_min_per_person)>0?`From ₹${Number(v.price_min_per_person).toLocaleString("en-IN")}/person`:"Quote on request"}</p><p class="smv-event-status">${verified?"Wedding listed by venue":"Wedding suitability: confirm with venue"}</p><a class="smv-profile-link" href="${href}">Explore venue & photos →</a></div></article>`}).join("");
    }catch(error){status.textContent="Venue options could not load. Please use Browse all venues or send a wedding enquiry."}
  }
  load();
})();
