(function () {
  "use strict";
  const hero = document.querySelector("main .hero");
  if (!hero || document.getElementById("smvHomepageSearchForm")) return;

  const style = document.createElement("style");
  style.textContent = `
    .smv-home-search{position:relative;isolation:isolate;overflow:hidden;width:100%;max-width:none;box-sizing:border-box;margin:0;padding:clamp(42px,5vw,76px) max(18px,calc((100vw - 1220px)/2));border:0;border-radius:0;background:linear-gradient(90deg,rgba(3,27,23,.94) 0%,rgba(3,37,31,.84) 48%,rgba(3,31,27,.62) 100%),url('assets/hero/hero-bright-wedding-v2.webp') center 48%/cover no-repeat;color:#fff8e9;box-shadow:0 24px 65px rgba(0,0,0,.22);z-index:4}
    .smv-home-search:before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(ellipse at 78% 18%,rgba(224,190,111,.2),transparent 38%),linear-gradient(0deg,rgba(2,24,20,.28),transparent 42%);pointer-events:none}
    .smv-home-search h2{max-width:900px;margin:0 auto 10px;color:#fff8e9;font-family:Georgia,"Times New Roman",serif;font-size:clamp(30px,4.2vw,54px);font-weight:500;line-height:1.06;letter-spacing:-.035em;text-align:center;text-wrap:balance}
    .smv-home-search>p{max-width:760px;margin:0 auto;color:rgba(255,249,235,.9);font-size:14px;line-height:1.7;text-align:center}
    .smv-search-trust{display:flex;justify-content:center;flex-wrap:wrap;gap:9px;margin:19px auto 22px}
    .smv-search-trust span{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:0 13px;border:1px solid rgba(235,215,168,.35);border-radius:999px;background:rgba(4,35,29,.58);color:#fff7e7;font-size:11px;font-weight:800;backdrop-filter:blur(10px)}
    .smv-search-trust span:before{content:"✓";color:#e6c77d;font-weight:950}
    #smvHomepageSearchForm{width:min(1120px,100%);box-sizing:border-box;margin:0 auto;padding:clamp(18px,2.4vw,30px);border:1px solid rgba(226,195,125,.62);border-radius:22px;background:rgba(251,249,243,.97);color:#173d35;box-shadow:0 25px 65px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.9);backdrop-filter:blur(14px)}
    .smv-search-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px 14px;margin-top:0}
    .smv-search-field{min-width:0}
    .smv-search-field label{display:block;margin-bottom:7px;color:#36534a;font-size:10px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}
    .smv-search-field input,.smv-search-field select{width:100%;min-height:49px;box-sizing:border-box;padding:0 13px;border:1px solid #d8dfd8;border-radius:11px;background:#fff;color:#193d34;font:inherit;font-size:13px;outline:none;transition:border-color .18s,box-shadow .18s}
    .smv-search-field input:focus,.smv-search-field select:focus{border-color:#b89549;box-shadow:0 0 0 3px rgba(184,149,73,.15)}
    .smv-search-field input::placeholder{color:#8b9992}
    .smv-search-submit{display:block;width:100%;min-height:54px;margin-top:19px;border:1px solid rgba(145,107,28,.35);border-radius:12px;background:linear-gradient(110deg,#e9c76f,#c99a32);color:#17382f;font-size:17px;font-weight:950;letter-spacing:.005em;box-shadow:0 9px 22px rgba(153,112,30,.2);cursor:pointer;transition:transform .18s,filter .18s,box-shadow .18s}
    .smv-search-submit:hover{transform:translateY(-2px);filter:brightness(1.035);box-shadow:0 13px 26px rgba(153,112,30,.25)}
    .smv-search-contact{margin-top:16px;padding:16px;border:1px solid #e4d7b7;border-radius:14px;background:#fffdf7}.smv-search-contact[hidden]{display:none}
    .smv-search-contact h3{margin:0 0 5px;color:#173d35;font-size:18px}.smv-search-contact p{margin:0 0 12px;color:#62736e;font-size:12px}
    .smv-search-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .smv-search-consent{display:flex;gap:8px;align-items:flex-start;margin-top:12px;color:#526b63;font-size:11px}.smv-search-consent input{margin-top:2px;accent-color:#0b6656}
    .smv-search-status{min-height:18px;margin:10px 0 0;color:#355e52;font-size:12px;text-align:center}
    .smv-search-owner{display:flex;align-items:center;justify-content:space-between;gap:20px;width:min(1120px,100%);box-sizing:border-box;margin:18px auto 0;padding:17px 20px;border:1px solid rgba(231,207,151,.28);border-radius:15px;background:rgba(3,34,29,.76);color:#f8f1df;backdrop-filter:blur(12px)}
    .smv-search-owner strong{display:block;margin-bottom:4px;color:#f2d48e;font-size:14px}.smv-search-owner p{margin:0;color:#e2e8df;font-size:11px;line-height:1.5}
    .smv-search-owner a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border:1px solid rgba(232,199,118,.65);border-radius:10px;background:linear-gradient(110deg,#e9c76f,#c99a32);color:#17382f;font-size:11px;font-weight:950;text-decoration:none;white-space:nowrap}
    .smv-search-results{width:min(1200px,calc(100% - 36px));margin:30px auto;padding:22px;border-radius:18px;background:#062b26;color:#fff}
    .smv-search-results[hidden]{display:none}.smv-search-result-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
    .smv-search-result{overflow:hidden;border:1px solid #ffffff22;border-radius:12px;background:#0b3932}
    .smv-search-result img{width:100%;height:155px;object-fit:cover}.smv-search-result div{padding:12px}
    .smv-search-result h3{font-size:17px;color:#fff}.smv-search-result p{margin-top:5px;color:#c5dbd4;font-size:12px}
    .smv-search-result .price{color:#f3d37d;font-weight:800}
    @media(max-width:760px){.smv-home-search{padding:38px 14px 28px;background-position:58% center}.smv-home-search h2{font-size:clamp(29px,7vw,40px)}.smv-home-search>p{font-size:12px}.smv-search-grid,.smv-search-contact-grid{grid-template-columns:1fr 1fr;gap:12px}.smv-search-owner{align-items:flex-start;flex-direction:column;gap:12px}.smv-search-owner a{width:100%}.smv-search-results{width:calc(100% - 20px);padding:14px}.smv-search-result-grid{grid-template-columns:1fr}}
    @media(max-width:480px){.smv-search-grid,.smv-search-contact-grid{grid-template-columns:1fr}.smv-home-search{padding:30px 10px 22px}#smvHomepageSearchForm{padding:15px;border-radius:16px}.smv-search-trust{gap:6px;margin:15px auto}.smv-search-trust span{min-height:30px;padding:0 10px;font-size:9px}.smv-search-submit{font-size:15px}}
    @media(prefers-reduced-motion:reduce){.smv-search-submit{transition:none}}
  `;
  document.head.appendChild(style);

  const box = document.createElement("section");
  box.className = "smv-home-search";
  box.innerHTML = '<h2>Find a Venue Worth Celebrating In</h2><p>Discover verified venues across Delhi &amp; Gurugram for weddings, parties and every special occasion.</p>' +
    '<div class="smv-search-trust"><span>Free for customers &amp; families</span><span>No customer booking fees</span><span>No booking commission for venue partners</span></div>' +
    '<form id="smvHomepageSearchForm"><div class="smv-search-grid">' +
    '<div class="smv-search-field"><label>Occasion *</label><select name="eventType" required><option value="">Select occasion</option><option>Wedding</option><option>Engagement</option><option>Reception</option><option>Birthday</option><option>Anniversary</option><option>Corporate Event</option><option>Party</option><option>Other</option></select></div>' +
    '<div class="smv-search-field"><label>City *</label><select name="city" required><option value="">Select city</option><option>Delhi</option><option>Gurgaon</option></select></div>' +
    '<div class="smv-search-field"><label>Preferred area</label><input name="area" maxlength="100" placeholder="e.g. Dwarka, Gurgaon"></div>' +
    '<div class="smv-search-field"><label>Event date (optional)</label><input type="date" name="eventDate"><label class="smv-date-flexible"><input type="checkbox" name="eventDateNotDecided" value="yes"> Date not decided</label></div>' +
    '<div class="smv-search-field"><label>Guests</label><input type="number" min="1" max="100000" name="guests" placeholder="e.g. 250"></div>' +
    '<div class="smv-search-field"><label>Max budget / person (₹)</label><input type="number" min="0" max="10000000" name="budgetPerPerson" placeholder="e.g. 1500"></div>' +
    '<div class="smv-search-field"><label>Venue type</label><select name="venueType"><option value="">Any type</option><option>Banquet Hall</option><option>Hotel</option><option>Restaurant</option><option>Farmhouse</option><option>Resort</option></select></div>' +
    '<div class="smv-search-field"><label>Food preference</label><select name="food"><option value="">Any</option><option>Veg</option><option>Non-Veg</option><option>Both</option><option>Jain</option></select></div>' +
    '<div class="smv-search-field" style="position:absolute;left:-10000px" aria-hidden="true"><label>Website</label><input name="website" tabindex="-1" autocomplete="off"></div></div>' +
    '<div id="smvSearchContact" class="smv-search-contact" hidden><h3>Where should we send your venue matches?</h3><p>Please share your contact details so our team can help with your requirements.</p><div class="smv-search-contact-grid">' +
    '<div class="smv-search-field"><label>Your name *</label><input name="customerName" maxlength="100" autocomplete="name" placeholder="Enter your full name"></div>' +
    '<div class="smv-search-field"><label>Mobile number *</label><input name="mobile" type="tel" inputmode="numeric" maxlength="14" autocomplete="tel" placeholder="10-digit mobile number"></div></div>' +
    '<label class="smv-search-consent"><input type="checkbox" name="contactConsent" value="yes"><span>I agree that Select My Venue may contact me about this venue enquiry.</span></label></div>' +
    '<button class="smv-search-submit" type="submit">Find My Perfect Venue →</button><p id="smvHomepageSearchStatus" class="smv-search-status" role="status" aria-live="polite"></p></form>' +
    '<div class="smv-search-owner"><div><strong>Own a venue? Get discovered by customers.</strong><p>Build your venue presence, receive relevant enquiries and manage opportunities with Partner CRM. You keep your booking value—SMV charges no booking commission. Partner listing plans are separate.</p></div><a href="list-your-venue.html">List Your Venue →</a></div>';
  hero.after(box);

  const results = document.createElement("section");
  results.id = "smvHomepageSearchResults";
  results.className = "smv-search-results";
  results.hidden = true;
  results.innerHTML = '<h2>Suitable venues for your search</h2><p>Based on published venue information. Price and availability must be confirmed.</p><div id="smvHomepageSearchGrid" class="smv-search-result-grid"></div>';
  box.after(results);

  const form = box.querySelector("form");
  const status = box.querySelector("#smvHomepageSearchStatus");
  const contact = box.querySelector("#smvSearchContact");
  const grid = results.querySelector("#smvHomepageSearchGrid");
  const esc = v => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  let contactStepShown = false;
  let submitted = false;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (submitted) return;
    const p = Object.fromEntries(new FormData(form).entries());
    if (!p.eventType || !p.city) {
      status.textContent = "Please select occasion and city.";
      return;
    }
    if (!contactStepShown) {
      contact.hidden = false;
      contactStepShown = true;
      form.querySelector('[name="customerName"]').required = true;
      form.querySelector('[name="mobile"]').required = true;
      form.querySelector('[name="contactConsent"]').required = true;
      form.querySelector(".smv-search-submit").textContent = "Find My Venues →";
      status.textContent = "Please add your name and mobile number to continue.";
      contact.scrollIntoView({behavior:"smooth",block:"center"});
      form.querySelector('[name="customerName"]').focus();
      return;
    }

    const name = String(p.customerName || "").trim();
    const mobile = String(p.mobile || "").replace(/[\s()-]/g, "");
    const digits = mobile.replace(/^\+91/, "").replace(/^91(?=\d{10}$)/, "");
    if (name.length < 2) { status.textContent = "Please enter your name."; form.querySelector('[name="customerName"]').focus(); return; }
    if (!/^\d{10}$/.test(digits) || !/^[6-9]\d{9}$/.test(digits)) { status.textContent = "Please enter a valid 10-digit Indian mobile number."; form.querySelector('[name="mobile"]').focus(); return; }
    if (!p.contactConsent) { status.textContent = "Please confirm that we may contact you about this enquiry."; return; }

    const payload = {...p, eventDate:p.eventDateNotDecided==="yes"?"":p.eventDate, customerName:name, mobile:digits};
    const button = form.querySelector("button");
    submitted = true;
    button.disabled = true;
    button.textContent = "Saving enquiry & finding venues…";
    status.textContent = "Submitting your requirements securely…";
    try {
      const r = await fetch("https://uajqwyoqbbswkfiwosyw.supabase.co/functions/v1/smv-homepage-search", {
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":"sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7","Authorization":"Bearer sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7"},
        body:JSON.stringify(payload)
      });
      const d = await r.json();
      if (!r.ok || !d.success || !d.crmLeadCreated) throw new Error(d.error || "Your enquiry could not be saved. Please try again.");
      grid.innerHTML = "";
      if (!d.venues.length) grid.innerHTML = "<p>No exact public listing matched. Our team has received your enquiry and can help find suitable options.</p>";
      d.venues.forEach(v => {
        const c = document.createElement("article");
        c.className = "smv-search-result";
        const image = v.cover_image_url ? '<img loading="lazy" src="' + esc(v.cover_image_url) + '" alt="' + esc(v.venue_name) + '">' : "";
        c.innerHTML = image + '<div><h3>' + esc(v.venue_name) + '</h3><p>' + esc(v.venue_type || "Venue") + ' · ' + esc([v.area,v.city].filter(Boolean).join(", ")) + '</p><p>' + (v.capacity_max ? "Up to " + Number(v.capacity_max).toLocaleString("en-IN") + " guests" : "Capacity to confirm") + '</p><p class="price">' + (v.price_min_per_person == null ? "Price on request" : "₹" + Number(v.price_min_per_person).toLocaleString("en-IN") + "/person") + '</p><p>' + esc([...(v.matchReasons || []), ...(v.needsConfirmation || [])].join(" · ")) + '</p></div>';
        grid.append(c);
      });
      results.hidden = false;
      status.textContent = "Thank you! Your enquiry has been received by our team. Here are suitable public listings.";
      results.scrollIntoView({behavior:"smooth",block:"start"});
      button.textContent = "Enquiry Submitted ✓";
    } catch (err) {
      status.textContent = err.message || "Submission failed. Please try again.";
      submitted = false;
      button.disabled = false;
      button.textContent = "Try Again →";
    }
  });
})();