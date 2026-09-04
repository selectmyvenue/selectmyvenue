(function () {
  "use strict";

  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const MEDIA_BUCKET = "venue-media";
  const params = new URLSearchParams(window.location.search);
  const venueId = params.get("id") || "";
  const autoQuote = params.get("quote") === "1";
  const validVenueId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(venueId);

  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const byId = id => document.getElementById(id);
  let currentVenue = null;
  let currentMedia = { cover: "", images: [], videos: [] };

  function safeHttpUrl(value) {
    try { const url = new URL(String(value || "")); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; }
    catch (_) { return ""; }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  }

  function cleanMobile(value) { return String(value || "").replace(/\D/g, "").slice(-10); }

  function money(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return null;
    return new Intl.NumberFormat("en-IN", {style:"currency", currency:"INR", maximumFractionDigits:0}).format(number);
  }

  function capacity(venue) {
    const minimum = Number(venue.capacity_min || 0), maximum = Number(venue.capacity_max || 0);
    if (minimum && maximum) return `${minimum}–${maximum} guests`;
    if (maximum) return `Up to ${maximum} guests`;
    if (minimum) return `${minimum}+ guests`;
    return "On request";
  }

  function pricing(venue) {
    const minimum = money(venue.price_min_per_person), maximum = money(venue.price_max_per_person);
    if (minimum && maximum) return `${minimum}–${maximum} per person`;
    if (minimum) return `From ${minimum} per person`;
    if (maximum) return `Up to ${maximum} per person`;
    return "Quote on request";
  }

  function fullAddress(venue) {
    const direct = String(venue.address || venue.full_address || "").trim();
    if (direct) return direct;
    return [venue.area, venue.city, venue.state, venue.pincode].map(value => String(value || "").trim()).filter(Boolean).join(", ") || "Address on request";
  }

  function venueFeatures(venue) {
    const list = [];
    if (venue.food_veg) list.push(["🥗", "Vegetarian food"]);
    if (venue.food_non_veg) list.push(["🍽", "Non-vegetarian food"]);
    if (venue.parking_available) list.push(["P", "Parking available"]);
    if (venue.rooms_available) list.push(["▣", "Rooms available"]);
    if (venue.catering_available) list.push(["♨", "Catering support"]);
    if (venue.decoration_available) list.push(["✦", "Decoration support"]);
    return list;
  }

  function publicMediaUrl(path) {
    if (!client || !path) return "";
    return safeHttpUrl(client.storage.from(MEDIA_BUCKET).getPublicUrl(path)?.data?.publicUrl);
  }

  function mediaRows(rows, folder) {
    return (rows || [])
      .filter(item => item?.name && item.name !== ".emptyFolderPlaceholder")
      .map(item => publicMediaUrl(`${venueId}/${folder}/${item.name}`))
      .filter(Boolean);
  }

  async function loadStorageMedia(venue) {
    if (!client || !validVenueId) return {cover:safeHttpUrl(venue.cover_image_url), images:[], videos:[]};
    const [rootResult, galleryResult, videoResult] = await Promise.all([
      client.storage.from(MEDIA_BUCKET).list(venueId,{limit:100,sortBy:{column:"name",order:"asc"}}),
      client.storage.from(MEDIA_BUCKET).list(`${venueId}/gallery`,{limit:40,sortBy:{column:"name",order:"asc"}}),
      client.storage.from(MEDIA_BUCKET).list(`${venueId}/videos`,{limit:10,sortBy:{column:"name",order:"asc"}})
    ]);
    let cover = safeHttpUrl(venue.cover_image_url);
    if (!cover && !rootResult.error) {
      const coverFile=(rootResult.data||[]).find(item=>/^cover-/i.test(item?.name||""));
      if(coverFile) cover=publicMediaUrl(`${venueId}/${coverFile.name}`);
    }
    const images=galleryResult.error?[]:mediaRows(galleryResult.data,"gallery").slice(0,30);
    const videos=videoResult.error?[]:mediaRows(videoResult.data,"videos").slice(0,2);
    if(!cover&&images.length)cover=images[0];
    return {cover,images,videos};
  }

  function setMeta(name, description, imageUrl) {
    const pageUrl=`https://selectmyvenue.com/venue.html?id=${encodeURIComponent(venueId)}`;
    const title=`${name} | Verified Venue | Select My Venue`;
    document.title=title;
    byId("venueMetaDescription")?.setAttribute("content",description);
    byId("venueCanonical")?.setAttribute("href",pageUrl);
    byId("venueOgTitle")?.setAttribute("content",title);
    byId("venueOgDescription")?.setAttribute("content",description);
    byId("venueOgUrl")?.setAttribute("content",pageUrl);
    byId("venueOgImage")?.setAttribute("content",imageUrl||"https://selectmyvenue.com/logo.png");
  }

  function setStructuredData(venue, images, description) {
    const location=[venue.area,venue.city].filter(Boolean).join(", ");
    const data={"@context":"https://schema.org","@type":"EventVenue","@id":`https://selectmyvenue.com/venue.html?id=${venue.id}`,name:venue.venue_name,description,url:`https://selectmyvenue.com/venue.html?id=${venue.id}`,publicAccess:true,address:{"@type":"PostalAddress",streetAddress:venue.address||venue.area||undefined,addressLocality:venue.city||location||undefined,addressRegion:venue.state||undefined,postalCode:venue.pincode||undefined,addressCountry:"IN"},maximumAttendeeCapacity:Number(venue.capacity_max||0)||undefined,image:images.length?images:undefined};
    Object.keys(data.address).forEach(key=>data.address[key]===undefined&&delete data.address[key]);
    Object.keys(data).forEach(key=>data[key]===undefined&&delete data[key]);
    if(byId("venueStructuredData"))byId("venueStructuredData").textContent=JSON.stringify(data);
  }

  function renderProfileDetails(venue, media) {
    if (byId("venueProfileDetailsStrip")) return;
    const hero = document.querySelector(".venue-profile-hero");
    if (!hero) return;
    const photoCount = (media.cover ? 1 : 0) + (media.images || []).filter(Boolean).length;
    const location = [venue.area, venue.city].filter(Boolean).join(", ") || "Location on request";
    const vegPrice = venue.price_min_per_person ? `${money(venue.price_min_per_person)} / pax` : pricing(venue);
    const details = [
      ["✓", "Verified", "Select My Venue partner"],
      ["👥", "Capacity", capacity(venue)],
      ["₹", "Veg Price", vegPrice],
      ["📍", "Location", location],
      ["🏠", "Address", fullAddress(venue)],
      ["📷", "Photos", photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : "Photos on request"]
    ];
    const section = document.createElement("section");
    section.id = "venueProfileDetailsStrip";
    section.className = "venue-profile-details-strip venue-white-card";
    section.innerHTML = details.map(([icon, label, value]) => `<div class="venue-profile-detail-item"><b>${icon}</b><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
    hero.insertAdjacentElement("afterend", section);
  }

  function renderHighlights(venue) {
    const highlights=[];
    if(venue.capacity_max)highlights.push(["Guest fit",`Suitable for events up to ${venue.capacity_max} guests based on listed capacity.`]);
    if(venue.price_min_per_person)highlights.push(["Budget visibility",`Listed pricing starts around ${money(venue.price_min_per_person)} per person.`]);
    if(venue.parking_available)highlights.push(["Guest convenience","Parking is listed as available at this venue."]);
    if(venue.rooms_available)highlights.push(["Stay option","Rooms are listed as available for event guests."]);
    if(venue.catering_available)highlights.push(["Food planning","Catering support is listed as available."]);
    if(venue.decoration_available)highlights.push(["Event setup","Decoration support is listed as available."]);
    if(!highlights.length)highlights.push(["Verified listing","This venue is part of the Select My Venue verified partner network."]);
    byId("venueProfileHighlights").innerHTML=highlights.slice(0,6).map(([title,text])=>`<div class="venue-highlight"><b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span></div>`).join("");
  }

  function openLightbox(url,name){
    if(!url)return;
    const lightbox=document.createElement("div");
    lightbox.className="venue-lightbox";
    lightbox.innerHTML=`<button type="button" aria-label="Close">×</button><img src="${escapeHtml(url)}" alt="${escapeHtml(name)} venue photo">`;
    const close=()=>lightbox.remove();
    lightbox.addEventListener("click",event=>{if(event.target===lightbox||event.target.tagName==="BUTTON")close();});
    document.body.appendChild(lightbox);
  }

  function renderGallery(name,media){
    const section=byId("venueProfileGallerySection"),grid=byId("venueProfileGallery"),videosSection=byId("venueProfileVideosSection"),videosGrid=byId("venueProfileVideos");
    const gallery=[...new Set(media.images.filter(url=>url&&url!==media.cover))];
    if(gallery.length&&section&&grid){
      section.hidden=false;
      byId("venueGalleryCount").textContent=`${gallery.length} photo${gallery.length===1?"":"s"}`;
      grid.innerHTML=gallery.map((url,index)=>`<button type="button" class="venue-gallery-photo" data-gallery-index="${index}"><img src="${escapeHtml(url)}" alt="${escapeHtml(name)} venue photo ${index+1}" loading="lazy" decoding="async"></button>`).join("");
      grid.querySelectorAll("[data-gallery-index]").forEach(button=>button.addEventListener("click",()=>openLightbox(gallery[Number(button.dataset.galleryIndex)],name)));
    }
    if(media.videos.length&&videosSection&&videosGrid){
      videosSection.hidden=false;
      byId("venueVideoCount").textContent=`${media.videos.length} video${media.videos.length===1?"":"s"}`;
      videosGrid.innerHTML=media.videos.map(url=>`<video class="venue-profile-video" controls playsinline preload="metadata" src="${escapeHtml(url)}"></video>`).join("");
    }
    const mediaCount=(media.cover?1:0)+gallery.length+media.videos.length;
    if(mediaCount&&byId("venueProfileMediaCount")){
      byId("venueProfileMediaCount").hidden=false;
      byId("venueProfileMediaCount").textContent=`${mediaCount} media`;
    }
  }

  function renderProfile(venue,media){
    currentVenue=venue;currentMedia=media;
    const name=String(venue.venue_name||"Verified Venue");
    const type=String(venue.venue_type||"Venue");
    const location=[venue.area,venue.city].filter(Boolean).join(", ")||"Location on request";
    const description=String(venue.description||"Ask our team for availability, packages and detailed venue information.");
    const whatsappUrl=`https://wa.me/918368322256?text=${encodeURIComponent(`Hi Select My Venue, I am interested in ${name}. Please share details and availability.`)}`;
    const mapUrl=safeHttpUrl(venue.google_maps_url);
    byId("venueBreadcrumb").textContent=name;
    byId("venueProfileName").textContent=name;
    byId("venueProfileType").textContent=type;
    byId("venueProfileFactType").textContent=type;
    byId("venueProfileLocation").textContent=`⌖ ${location}`;
    byId("venueProfileCapacity").textContent=capacity(venue);
    byId("venueProfilePrice").textContent=pricing(venue);
    byId("venueProfileDescription").textContent=description;
    byId("venueAboutHeading").textContent=`Discover ${name}.`;
    byId("venueQuoteVenueName").textContent=name;
    byId("venueProfileWhatsapp").href=whatsappUrl;
    if(byId("venueQuickVenueName"))byId("venueQuickVenueName").textContent=name;
    if(media.cover){
      const image=byId("venueProfileImage");image.src=media.cover;image.alt=`${name} venue`;image.hidden=false;byId("venueProfileFallback").hidden=true;
    }
    if(mapUrl){byId("venueProfileMap").href=mapUrl;byId("venueProfileMap").hidden=false;}
    const featureList=venueFeatures(venue);
    byId("venueProfileFeatures").innerHTML=featureList.length?featureList.map(([icon,label])=>`<div class="venue-profile-feature"><span>${icon}</span><strong>${escapeHtml(label)}</strong></div>`).join(""):`<div class="venue-profile-feature"><span>✦</span><strong>Venue details available on request</strong></div>`;
    renderHighlights(venue);renderGallery(name,media);renderProfileDetails(venue,media);
    const metaDescription=`${name} in ${location}. View photos, capacity, pricing and facilities, then request a personalised quote from Select My Venue.`;
    const structuredImages=[media.cover,...media.images].filter(Boolean);
    setMeta(name,metaDescription,media.cover);setStructuredData(venue,structuredImages,description);
    byId("venueProfileLoading").hidden=true;byId("venueProfile").hidden=false;
    if(autoQuote)setTimeout(openQuoteModal,220);
  }

  function openQuoteModal(){if(!currentVenue)return;const modal=byId("venueQuoteModal");if(!modal)return;modal.hidden=false;document.body.style.overflow="hidden";setTimeout(()=>byId("venueQuoteName")?.focus(),40);}
  function closeQuoteModal(){const modal=byId("venueQuoteModal");if(!modal)return;modal.hidden=true;document.body.style.overflow="";}

  async function insertCustomerEnquiry(payload){
    if(!client) return { error: new Error("Supabase client is not initialized.") };
    const cleanPayload={...payload};
    delete cleanPayload.priority;
    delete cleanPayload.assigned_to;
    delete cleanPayload.follow_up_at;
    delete cleanPayload.last_contacted_at;
    return await client.from("customer_enquiries").insert(cleanPayload);
  }

  async function submitQuote(event){
    event.preventDefault();if(!client||!currentVenue)return;
    const name=byId("venueQuoteName").value.trim();
    const mobile=cleanMobile(byId("venueQuoteMobile").value);
    const occasion=byId("venueQuoteEvent").value;
    const eventDate=byId("venueQuoteDate").value||null;
    const guests=Number(byId("venueQuoteGuests").value||0)||null;
    const budget=Number(byId("venueQuoteBudget").value||0)||null;
    const status=byId("venueQuoteStatus"),button=byId("venueQuoteSubmit");
    if(name.length<2){status.textContent="Please enter your name.";status.className="venue-quote-status error";return;}
    if(mobile.length!==10){status.textContent="Please enter a valid 10-digit mobile number.";status.className="venue-quote-status error";return;}
    if(!occasion){status.textContent="Please select your event.";status.className="venue-quote-status error";return;}
    const location=[currentVenue.area,currentVenue.city].filter(Boolean).join(", ")||currentVenue.city||null;
    const requirements=[`Specific venue enquiry: ${currentVenue.venue_name}`,`Venue ID: ${currentVenue.id}`,location?`Venue location: ${location}`:null,"Submitted from venue profile quick quote"].filter(Boolean).join("\n");
    button.disabled=true;button.textContent="Sending your enquiry…";status.textContent="";status.className="venue-quote-status";
    const{error}=await insertCustomerEnquiry({customer_name:name,mobile,location,occasion,event_date:eventDate,guests,budget_per_person:budget,requirements,source:"Website - Venue Profile",status:"new"});
    button.disabled=false;button.textContent="Check Price & Availability →";
    if(error){
      console.error("Venue quote error:",error);
      status.textContent="We could not submit this enquiry right now. Please try again or use WhatsApp.";
      status.className="venue-quote-status error";
      return;
    }
    status.textContent="✓ Enquiry submitted. Select My Venue will use this venue and your event details to assist you.";
    status.className="venue-quote-status success";
    event.currentTarget.reset();
  }

  function installQuickEnquiryStyles(){
    if(byId("venueQuickEnquiryStyles"))return;
    const style=document.createElement("style");style.id="venueQuickEnquiryStyles";style.textContent=`
      body.venue-profile-page{font-size:18px!important;line-height:1.72!important}.venue-profile-page p,.venue-profile-page li,.venue-profile-page a,.venue-profile-page button,.venue-profile-page input,.venue-profile-page select,.venue-profile-page textarea{font-size:16px}.venue-breadcrumbs{font-size:14px!important}.venue-profile-titlebar h1,#venueProfileName{font-size:clamp(42px,5vw,66px)!important}.venue-profile-location{font-size:17px!important;font-weight:800!important}.venue-profile-facts span{font-size:12px!important}.venue-profile-facts strong{font-size:17px!important}.venue-profile-panel h2,.venue-profile-enquiry h2{font-size:clamp(32px,3.2vw,44px)!important}.venue-profile-panel>p:last-child,.venue-profile-enquiry>p,#venueProfileDescription{font-size:17px!important;line-height:1.85!important}.venue-profile-feature strong,.venue-highlight span{font-size:15px!important;line-height:1.6!important}.venue-highlight b{font-size:16px!important}.button,.venue-profile-page button,.venue-profile-page a.button{font-size:15px!important}.smv-cover-counter,.smv-view-all,.smv-profile-action{font-size:14px!important}.venue-profile-details-strip{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin:18px 0!important;padding:18px!important;border:1px solid rgba(45,210,189,.18)!important;border-radius:22px!important;background:linear-gradient(145deg,rgba(12,44,40,.95),rgba(5,30,27,.98))!important;box-shadow:0 18px 45px rgba(0,0,0,.18)!important}.venue-profile-detail-item{display:grid!important;grid-template-columns:42px 1fr!important;grid-template-rows:auto auto!important;gap:3px 12px!important;align-items:center!important;min-height:76px!important;padding:14px!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:16px!important;background:rgba(255,255,255,.035)!important}.venue-profile-detail-item b{grid-row:1/3;width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:rgba(45,210,189,.10);color:#2dd2bd;font-size:20px}.venue-profile-detail-item span{color:#9fc1bc;font-size:12px!important;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.venue-profile-detail-item strong{color:#f3fbfa;font-size:17px!important;line-height:1.35;font-weight:900}.venue-profile-detail-item:nth-child(5),.venue-profile-detail-item:nth-child(6){grid-column:auto}.venue-profile-enquiry{position:sticky!important;top:96px!important;align-self:start!important}.venue-quick-enquiry-form{display:grid;gap:11px;margin:14px 0 12px;padding:18px;border:1px solid #dfe9e5;border-radius:17px;background:#fff;box-shadow:0 10px 28px rgba(18,56,50,.055)}.venue-quick-title{color:#123f37;font-size:22px;font-weight:950;margin-bottom:0}.venue-quick-subtitle{margin:-2px 0 5px;color:#5f746e;font-size:13px;line-height:1.5;font-weight:750}.venue-quick-enquiry-form label{display:grid;gap:6px}.venue-quick-enquiry-form label span{color:#59766f;font-size:11px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}.venue-quick-enquiry-form input,.venue-quick-enquiry-form select{width:100%;box-sizing:border-box;border:1px solid #d9e5e1;border-radius:11px;background:#fbfdfc;color:#173f37;font:inherit;font-size:15px;font-weight:700;outline:none;height:46px;padding:0 12px}.venue-quick-enquiry-form input:focus,.venue-quick-enquiry-form select:focus{border-color:#0fbaa3;box-shadow:0 0 0 3px rgba(15,186,163,.08)}.venue-quick-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}.venue-quick-enquiry-form button{height:48px;border:0;border-radius:12px;background:linear-gradient(135deg,#0fbaa3,#087f71);color:#fff;font-size:15px;font-weight:950;cursor:pointer;box-shadow:0 9px 22px rgba(8,127,113,.18)}.venue-quick-enquiry-form button:disabled{opacity:.65;cursor:wait}.venue-quick-status{min-height:20px;font-size:13px;line-height:1.5;font-weight:800}.venue-quick-status.success{color:#087f71}.venue-quick-status.error{color:#b42318}#venueProfileQuoteAside{display:none!important}.venue-profile-enquiry>.venue-assist-points{margin-top:14px!important}.venue-profile-enquiry>small{display:block;margin-top:10px!important;font-size:12px!important}
      @media(max-width:900px){.venue-profile-enquiry{position:static!important}.venue-quick-enquiry-form{grid-template-columns:1fr 1fr}.venue-quick-title,.venue-quick-subtitle,.venue-quick-enquiry-form button,.venue-quick-status{grid-column:1/-1}.venue-quick-row{display:contents}.venue-profile-details-strip{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:620px){body.venue-profile-page{font-size:16px!important}.venue-profile-titlebar h1,#venueProfileName{font-size:36px!important}.venue-profile-details-strip{grid-template-columns:1fr!important;padding:12px!important}.venue-profile-detail-item strong{font-size:15px!important}.venue-quick-enquiry-form{grid-template-columns:1fr;padding:14px}.venue-quick-title,.venue-quick-subtitle,.venue-quick-enquiry-form button,.venue-quick-status{grid-column:auto}.venue-quick-row{display:grid;grid-template-columns:1fr 1fr}.venue-profile-page p,.venue-profile-page li,.venue-profile-page a,.venue-profile-page button,.venue-profile-page input,.venue-profile-page select,.venue-profile-page textarea{font-size:15px}.venue-profile-panel>p:last-child,.venue-profile-enquiry>p,#venueProfileDescription{font-size:15.5px!important}}
    `;document.head.appendChild(style);
  }

  function installQuickEnquiryForm(){
    const aside=document.querySelector(".venue-profile-enquiry");if(!aside||byId("venueQuickEnquiryForm"))return;
    const intro=aside.querySelector("p"),form=document.createElement("form");
    form.id="venueQuickEnquiryForm";form.className="venue-quick-enquiry-form";
    form.innerHTML=`<div class="venue-quick-title">Check Availability & Prices</div><div class="venue-quick-subtitle">For <strong id="venueQuickVenueName">this venue</strong> · one quick request, no long form.</div><label><span>Event *</span><select id="venueQuickEvent" required><option value="">Select event</option><option>Wedding</option><option>Engagement</option><option>Reception</option><option>Birthday</option><option>Corporate Event</option><option>Party</option><option>Anniversary</option><option>Other</option></select></label><label><span>Event Date</span><input id="venueQuickDate" type="date"></label><div class="venue-quick-row"><label><span>Guests</span><input id="venueQuickGuests" type="number" min="1" placeholder="e.g. 250"></label><label><span>Budget / Person</span><input id="venueQuickBudget" type="number" min="0" placeholder="₹ e.g. 1500"></label></div><label><span>Name *</span><input id="venueQuickName" autocomplete="name" required placeholder="Your name"></label><label><span>Mobile *</span><input id="venueQuickMobile" inputmode="numeric" autocomplete="tel" maxlength="14" required placeholder="10-digit mobile"></label><label><span>Email</span><input id="venueQuickEmail" type="email" autocomplete="email" placeholder="Email (optional)"></label><button id="venueQuickSubmit" type="submit">Check Price & Availability →</button><div id="venueQuickStatus" class="venue-quick-status" role="status" aria-live="polite"></div>`;
    if(intro)intro.insertAdjacentElement("afterend",form);else aside.prepend(form);
    form.addEventListener("submit",submitQuickEnquiry);
  }

  async function submitQuickEnquiry(event){
    event.preventDefault();if(!client||!currentVenue)return;
    const occasion=String(byId("venueQuickEvent")?.value||"").trim();
    const eventDate=byId("venueQuickDate")?.value||null;
    const guests=Number(byId("venueQuickGuests")?.value||0)||null;
    const budget=Number(byId("venueQuickBudget")?.value||0)||null;
    const name=String(byId("venueQuickName")?.value||"").trim();
    const mobile=cleanMobile(byId("venueQuickMobile")?.value||"");
    const email=String(byId("venueQuickEmail")?.value||"").trim();
    const status=byId("venueQuickStatus"),button=byId("venueQuickSubmit");
    if(!occasion){status.textContent="Please select your event.";status.className="venue-quick-status error";byId("venueQuickEvent")?.focus();return;}
    if(name.length<2){status.textContent="Please enter your name.";status.className="venue-quick-status error";byId("venueQuickName")?.focus();return;}
    if(mobile.length!==10){status.textContent="Please enter a valid 10-digit mobile number.";status.className="venue-quick-status error";byId("venueQuickMobile")?.focus();return;}
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){status.textContent="Please enter a valid email address.";status.className="venue-quick-status error";byId("venueQuickEmail")?.focus();return;}
    const location=[currentVenue.area,currentVenue.city].filter(Boolean).join(", ")||currentVenue.city||null;
    const requirements=[`Specific venue enquiry: ${currentVenue.venue_name}`,`Venue ID: ${currentVenue.id}`,location?`Venue location: ${location}`:null,"Submitted from venue profile availability panel"].filter(Boolean).join("\n");
    button.disabled=true;button.textContent="Checking…";status.textContent="";status.className="venue-quick-status";
    const{error}=await insertCustomerEnquiry({customer_name:name,mobile,email:email||null,location,occasion,event_date:eventDate,guests,budget_per_person:budget,requirements,source:"Website - Venue Profile Quick Enquiry",status:"new"});
    button.disabled=false;button.textContent="Check Price & Availability →";
    if(error){
      console.error("Venue quick enquiry error:",error);
      status.textContent="Unable to send right now. Please try again or use WhatsApp.";
      status.className="venue-quick-status error";
      return;
    }
    status.textContent="✓ Requirement received. We’ll check this venue using your event details.";
    status.className="venue-quick-status success";
    event.currentTarget.reset();
  }

  function setupActions(){
    installQuickEnquiryStyles();
    installQuickEnquiryForm();
    document.querySelectorAll(".venue-quote-trigger").forEach(button=>button.addEventListener("click",openQuoteModal));
    document.querySelectorAll("[data-close-quote]").forEach(node=>node.addEventListener("click",closeQuoteModal));
    byId("venueQuoteForm")?.addEventListener("submit",submitQuote);
    byId("venueShareBtn")?.addEventListener("click",async()=>{
      const shareData={title:currentVenue?.venue_name||"Select My Venue",url:window.location.href};
      try{
        if(navigator.share)await navigator.share(shareData);
        else{await navigator.clipboard.writeText(window.location.href);byId("venueShareBtn").textContent="Link Copied";setTimeout(()=>byId("venueShareBtn").textContent="Share",1600);}
      }catch(_){}
    });
    document.addEventListener("keydown",event=>{if(event.key==="Escape")closeQuoteModal();});
  }

  function showError(){byId("venueProfileLoading").hidden=true;byId("venueProfileError").hidden=false;}

  async function loadProfile(){
    if(!validVenueId||!client)return showError();
    const{data,error}=await client.rpc("smv_public_venues");
    if(error){console.error("Venue profile error:",error);return showError();}
    const venue=(Array.isArray(data)?data:[]).map(item=>item?.venue||item).find(item=>String(item?.id)===venueId);
    if(!venue)return showError();
    const media=await loadStorageMedia(venue);
    renderProfile(venue,media);
  }

  setupActions();
  loadProfile();
})();