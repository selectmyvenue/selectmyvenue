(function () {
  "use strict";
  const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const headings=new Set(["about","about venue","why stay with us","amenities","facilities and capacity","services offered","services","products and services offered","services, amenities and more","room & comfort","connectivity & services","pure vegetarian banquet hall","venue highlights","key features","features"]);
  function isHeading(line){const t=line.trim(),clean=t.replace(/^#{1,3}\s+/,"").replace(/:$/,"").trim();return !!clean&&clean.length<=80&&(headings.has(clean.toLowerCase())||/^#{1,3}\s+/.test(t)||/^[A-Z][A-Za-z0-9 &/&()'’.-]{2,78}:$/.test(t))}
  function richify(value){
    const raw=String(value||"");
    if(/<(?:p|br|strong|b|em|i|u|s|h[1-6]|ul|ol|li|blockquote|a)\b/i.test(raw)){
      const box=document.createElement("div");box.innerHTML=raw;
      box.querySelectorAll("script,style,iframe,object,embed,form,input,button,svg,math").forEach(n=>n.remove());
      box.querySelectorAll("*").forEach(n=>[...n.attributes].forEach(a=>{if(/^on/i.test(a.name)||(a.name==="href"&&/^\s*javascript:/i.test(a.value)))n.removeAttribute(a.name)}));
      return box.innerHTML;
    }
    const blocks=raw.replace(/\r\n?/g,"\n").split(/\n\s*\n+/),out=[];
    for(const block of blocks){
      const lines=block.split("\n").map(x=>x.trim()).filter(Boolean);let i=0;
      while(i<lines.length){
        if(isHeading(lines[i])){out.push("<h3>"+esc(lines[i].replace(/^#{1,3}\s+/,"").replace(/:$/,"").trim())+"</h3>");i++;continue}
        if(/^(?:[-*•▪◦‣·])\s+/.test(lines[i])){const a=[];while(i<lines.length&&/^(?:[-*•▪◦‣·])\s+/.test(lines[i])){a.push("<li>"+esc(lines[i].replace(/^(?:[-*•▪◦‣·])\s+/,""))+"</li>");i++}out.push("<ul>"+a.join("")+"</ul>");continue}
        if(/^\d{1,2}[.)]\s+/.test(lines[i])){const a=[];while(i<lines.length&&/^\d{1,2}[.)]\s+/.test(lines[i])){a.push("<li>"+esc(lines[i].replace(/^\d{1,2}[.)]\s+/,""))+"</li>");i++}out.push("<ol>"+a.join("")+"</ol>");continue}
        const a=[];while(i<lines.length&&!isHeading(lines[i])&&!/^(?:[-*•▪◦‣·])\s+/.test(lines[i])&&!/^\d{1,2}[.)]\s+/.test(lines[i])){a.push(lines[i]);i++}
        out.push(a.length>=3&&a.every(x=>x.length<=150)?"<ul>"+a.map(x=>"<li>"+esc(x)+"</li>").join("")+"</ul>":"<p>"+a.map(esc).join("<br>")+"</p>");
      }
    }
    return out.join("");
  }
  function styles(){
    if(document.getElementById("smvRichProfileStyles"))return;
    const s=document.createElement("style");s.id="smvRichProfileStyles";
    s.textContent="#venueProfileDescription{font-size:15px;line-height:1.78;color:#35534c}#venueProfileDescription p{margin:0 0 15px}#venueProfileDescription h3{margin:22px 0 9px;font-size:17px;line-height:1.35;color:#123f3a}#venueProfileDescription ul,#venueProfileDescription ol{margin:6px 0 16px 22px;padding:0}#venueProfileDescription li{margin:5px 0}.smv-modern-map{margin-top:22px;border:1px solid #dcebe6;border-radius:22px;overflow:hidden;background:linear-gradient(145deg,#fbfffe,#f1f8f6);box-shadow:0 16px 45px rgba(17,55,48,.08)}.smv-modern-map-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;padding:20px 22px 15px}.smv-modern-map-head h2{margin:4px 0 0;color:#123f3a;font-size:22px}.smv-modern-map-head p{margin:0;color:#6d8580;font-size:12px;line-height:1.5}.smv-map-frame{position:relative;height:360px;background:#dfeee9}.smv-map-frame iframe{display:block;width:100%;height:100%;border:0;filter:saturate(.92) contrast(1.02)}.smv-map-badge{position:absolute;left:16px;top:16px;z-index:2;padding:9px 12px;border-radius:999px;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(10,50,43,.14);font-size:10px;font-weight:900;letter-spacing:.08em;color:#0b705f}.smv-map-footer{display:flex;justify-content:space-between;gap:15px;align-items:center;padding:13px 18px;color:#607a74;font-size:11px}.smv-map-footer a{font-weight:900;color:#087f6c;text-decoration:none}.smv-profile-faq{margin-top:22px;padding:22px;border:1px solid #dcebe6;border-radius:22px;background:#fff;box-shadow:0 14px 40px rgba(17,55,48,.06)}.smv-profile-faq h2{margin:4px 0 15px;color:#123f3a;font-size:22px}.smv-faq-item{padding:15px 0;border-top:1px solid #edf3f1}.smv-faq-item:first-child{border-top:0;padding-top:2px}.smv-faq-item h3{margin:0 0 6px;font-size:14px;color:#244e47}.smv-faq-item p{margin:0;color:#667f79;font-size:12px;line-height:1.6}@media(max-width:700px){.smv-map-frame{height:290px}.smv-modern-map-head{display:block}.smv-modern-map-head p{margin-top:6px}.smv-map-footer{display:block}.smv-map-footer a{display:inline-block;margin-top:6px}#venueProfileDescription{font-size:14px}}";
    document.head.appendChild(s);
  }
  function address(v){return [v.address,v.area,v.city,v.state,v.pincode].map(x=>String(x||"").trim()).filter(Boolean).join(", ")}
  function mapUrl(v){const lat=Number(v.latitude),lon=Number(v.longitude),q=Number.isFinite(lat)&&Number.isFinite(lon)?lat+","+lon:address(v)||v.venue_name||"Delhi NCR";return "https://www.google.com/maps?q="+encodeURIComponent(q)+"&output=embed&z=15"}
  function mapLink(v){const direct=String(v.google_maps_url||"").trim();if(/^https?:\/\//i.test(direct))return direct;return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent((v.venue_name?String(v.venue_name)+", ":"")+address(v))}
  function faq(v){
    const a=[],events=Array.isArray(v.event_types)?v.event_types.filter(Boolean):[],min=Number(v.capacity_min||0),max=Number(v.capacity_max||0),pmin=Number(v.price_min_per_person||0),pmax=Number(v.price_max_per_person||0),rooms=Number(v.room_count||0);
    const food=v.food_veg&&v.food_non_veg?"vegetarian and non-vegetarian food":v.food_veg?"vegetarian food":v.food_non_veg?"non-vegetarian food":"";
    if(events.length)a.push(["What events can be hosted here?","The venue is currently listed for "+events.join(", ")+"." ]);
    if(min||max)a.push(["How many guests can the venue accommodate?",max?"The listed capacity is "+(min?min+" to ":"up to ")+max+" guests.":"The listed minimum capacity is "+min+" guests."]);
    if(food)a.push(["What food options are listed?","The venue currently lists "+food+". Final menus and package inclusions should be confirmed with the venue."]);
    if(pmin||pmax)a.push(["What is the listed pricing?",pmin&&pmax?"The current listed range is ₹"+pmin.toLocaleString("en-IN")+"–₹"+pmax.toLocaleString("en-IN")+" per person.":"Pricing is listed from ₹"+(pmin||pmax).toLocaleString("en-IN")+" per person."]);
    if(v.parking_available)a.push(["Is parking available?","Yes. Parking is currently listed as available for this venue."]);
    if(v.rooms_available)a.push(["Are rooms available for guests?",rooms?"Yes. The venue currently lists "+rooms+" rooms.":"Yes. Rooms are currently listed as available; confirm the exact room inventory with the venue."]);
    if(v.catering_available)a.push(["Is catering available?","Catering support is currently listed for this venue. Confirm the final catering arrangement with the venue."]);
    if(v.decoration_available)a.push(["Is decoration support available?","Decoration support is currently listed for this venue."]);
    if(address(v))a.push(["Where is the venue located?","The listed address is "+address(v)+"." ]);
    return a.slice(0,7);
  }
  function render(v){
    styles();
    const d=document.getElementById("venueProfileDescription");if(d)d.innerHTML=richify(v.description||"Ask our team for availability, packages and detailed venue information.");
    const article=document.getElementById("venueProfile"),similar=document.getElementById("similarVenuesSection");if(!article)return;
    let map=document.getElementById("smvModernMap");
    if(!map){map=document.createElement("section");map.id="smvModernMap";map.className="smv-modern-map";map.innerHTML='<div class="smv-modern-map-head"><div><p class="eyebrow">VENUE LOCATION</p><h2>Find the venue on the map</h2></div><p>Interactive location view based on the address and stored venue coordinates.</p></div><div class="smv-map-frame"><span class="smv-map-badge">LIVE MAP VIEW</span><iframe title="Venue location map" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><div class="smv-map-footer"><span class="smv-map-address"></span><a class="smv-map-link" target="_blank" rel="noopener">Open full map ↗</a></div>';if(similar)similar.insertAdjacentElement("beforebegin",map);else article.appendChild(map)}
    map.querySelector("iframe").src=mapUrl(v);map.querySelector(".smv-map-address").textContent=address(v)||"Location available on request";map.querySelector(".smv-map-link").href=mapLink(v);
    const items=faq(v);if(!items.length)return;

    // Prefer the FAQ that is already part of the venue profile. Older profiles may
    // have a FAQ near SMART PLANNING ESSENTIALS; the upgrade must not create a
    // second FAQ just because the new generated questions are available.
    const normalizeFaqText=s=>String(s||"").toLowerCase().replace(/[?!.:,;|]/g," ").replace(/\\s+/g," ").trim();
    const questionKey=s=>normalizeFaqText(s).replace(/^(is|are|can|do|does|what|how|where|which|who|when)\\s+/,"").replace(/\\s+/g," ");
    const isFaqHost=node=>{
      if(!node||node.id==="smvVenueFaq")return false;
      const text=String(node.textContent||"").trim();
      return /\\b(?:faq|frequently asked questions|useful answers|questions worth answering)\\b/i.test(text) ||
             /smart planning essentials/i.test(text);
    };
    let existing=null;
    const candidates=[...article.querySelectorAll("section, .venue-white-card, .venue-profile-panel, div")];
    for(const node of candidates){
      if(node.closest("#smvVenueFaq"))continue;
      if(isFaqHost(node)){
        // Prefer the smallest meaningful FAQ/planning container.
        const childFaq=[...node.querySelectorAll("section, .venue-white-card, .venue-profile-panel")].find(isFaqHost);
        existing=childFaq||node;
        break;
      }
    }

    const generatedHtml=items.map(x=>'<div class="smv-faq-item smv-generated-faq-item"><h3>'+esc(x[0])+'</h3><p>'+esc(x[1])+'</p></div>').join("");

    // If an existing FAQ is present, add only genuinely new questions to it.
    if(existing){
      document.getElementById("smvVenueFaq")?.remove();
      let list=existing.querySelector(".smv-faq-list, .faq-list, .faq-items, .accordion, .faq-accordion");
      if(!list){
        list=document.createElement("div");
        list.className="smv-faq-list";
        existing.appendChild(list);
      }
      const existingKeys=new Set(
        [...existing.querySelectorAll("h3,h4,summary,[class*='question'],[class*='faq-question']")]
          .map(n=>questionKey(n.textContent)).filter(Boolean)
      );
      const fresh=items.filter(x=>!existingKeys.has(questionKey(x[0])));
      if(fresh.length){
        list.insertAdjacentHTML("beforeend",fresh.map(x=>'<div class="smv-faq-item smv-generated-faq-item"><h3>'+esc(x[0])+'</h3><p>'+esc(x[1])+'</p></div>').join(""));
      }
      existing.classList.add("smv-faq-consolidated");
      return;
    }

    // Fallback only for profiles that truly have no FAQ at all.
    let f=document.getElementById("smvVenueFaq");
    if(!f){
      f=document.createElement("section");
      f.id="smvVenueFaq";
      f.className="smv-profile-faq";
      f.innerHTML='<p class="eyebrow">VENUE FAQ</p><h2>Questions worth answering before you book.</h2><div class="smv-faq-list"></div>';
      if(similar)similar.insertAdjacentElement("afterend",f);else article.appendChild(f);
    }
    f.querySelector(".smv-faq-list").innerHTML=generatedHtml;
  }
  function start(){
    if(window.SMVCurrentVenue){render(window.SMVCurrentVenue);return}
    window.addEventListener("smv:venue-ready",event=>{
      if(event.detail?.venue)render(event.detail.venue);
    },{once:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();