(function () {
  "use strict";
  const hero = document.querySelector("main .hero");
  if (!hero || document.getElementById("smvHomepageSearchForm")) return;

  const style = document.createElement("style");
  style.textContent = `
    .smv-home-search{width:min(1120px,calc(100% - 36px));margin:26px auto;padding:20px;border:1px solid rgba(243,200,75,.4);border-radius:22px;background:#f9fbfa;color:#243b35;box-shadow:0 20px 55px #0005;position:relative;z-index:4}
    .smv-home-search h2{font-size:22px;color:#173d35}.smv-home-search p{font-size:12px;color:#62736e}
    .smv-search-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
    .smv-search-field label{display:block;margin-bottom:5px;color:#41534e;font-size:10px;font-weight:900;text-transform:uppercase}
    .smv-search-field input,.smv-search-field select{width:100%;min-height:45px;padding:0 10px;border:1px solid #d9e2de;border-radius:9px;background:#fff;color:#263c37;font:inherit}
    .smv-search-submit{width:100%;min-height:50px;margin-top:14px;border:0;border-radius:11px;background:linear-gradient(110deg,#e9bd4b,#d2a133);color:#1d342d;font-size:16px;font-weight:950}
    .smv-search-contact{margin-top:14px;padding:15px;border:1px solid #d8e4df;border-radius:13px;background:#f0f7f4}.smv-search-contact[hidden]{display:none}
    .smv-search-contact h3{margin:0 0 5px;color:#173d35;font-size:17px}.smv-search-contact p{margin:0 0 12px}
    .smv-search-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .smv-search-consent{display:flex;gap:8px;align-items:flex-start;margin-top:12px;color:#526b63;font-size:11px}.smv-search-consent input{margin-top:2px}
    .smv-search-status{min-height:18px;margin-top:8px;color:#355e52}
    .smv-search-results{width:min(1200px,calc(100% - 36px));margin:30px auto;padding:22px;border-radius:18px;background:#062b26;color:#fff}
    .smv-search-results[hidden]{display:none}.smv-search-result-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
    .smv-search-result{overflow:hidden;border:1px solid #ffffff22;border-radius:12px;background:#0b3932}
    .smv-search-result img{width:100%;height:155px;object-fit:cover}.smv-search-result div{padding:12px}
    .smv-search-result h3{font-size:17px;color:#fff}.smv-search-result p{margin-top:5px;color:#c5dbd4;font-size:12px}
    .smv-search-result .price{color:#f3d37d;font-weight:800}
    @media(max-width:760px){.smv-home-search{width:calc(100% - 20px);padding:14px}.smv-search-grid,.smv-search-contact-grid{grid-template-columns:1fr 1fr}.smv-search-results{width:calc(100% - 20px);padding:14px}.smv-search-result-grid{grid-template-columns:1fr}}
    @media(max-width:420px){.smv-search-grid,.smv-search-contact-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const box = document.createElement("section");
  box.className = "smv-home-search";
  box.innerHTML = '<h2>Find the Perfect Venue for Your Celebration</h2><p>Share your event details and contact details to see suitable public listings and let our team assist you.</p>' +
    '<form id="smvHomepageSearchForm"><div class="smv-search-grid">' +
    '<div class="smv-search-field"><label>Occasion *</label><select name="eventType" required><option value="">Select occasion</option><option>Wedding</option><option>Engagement</option><option>Reception</option><option>Birthday</option><option>Anniversary</option><option>Corporate Event</option><option>Party</option><option>Other</option></select></div>' +
    '<div class="smv-search-field"><label>City *</label><select name="city" required><option value="">Select city</option><option>Delhi</option><option>Gurgaon</option></select></div>' +
    '<div class="smv-search-field"><label>Preferred area</label><input name="area" maxlength="100" placeholder="e.g. Dwarka, Gurgaon"></div>' +
    '<div class="smv-search-field"><label>Event date</label><input type="date" name="eventDate"></div>' +
    '<div class="smv-search-field"><label>Guests</label><input type="number" min="1" max="100000" name="guests" placeholder="e.g. 250"></div>' +
    '<div class="smv-search-field"><label>Max budget / person (₹)</label><input type="number" min="0" max="10000000" name="budgetPerPerson" placeholder="e.g. 1500"></div>' +
    '<div class="smv-search-field"><label>Venue type</label><select name="venueType"><option value="">Any type</option><option>Banquet Hall</option><option>Hotel</option><option>Restaurant</option><option>Farmhouse</option><option>Resort</option></select></div>' +
    '<div class="smv-search-field"><label>Food preference</label><select name="food"><option value="">Any</option><option>Veg</option><option>Non-Veg</option><option>Both</option><option>Jain</option></select></div>' +
    '<div class="smv-search-field" style="position:absolute;left:-10000px" aria-hidden="true"><label>Website</label><input name="website" tabindex="-1" autocomplete="off"></div></div>' +
    '<div id="smvSearchContact" class="smv-search-contact" hidden><h3>Where should we send your venue matches?</h3><p>Please share your contact details so our team can help with your requirements.</p><div class="smv-search-contact-grid">' +
    '<div class="smv-search-field"><label>Your name *</label><input name="customerName" maxlength="100" autocomplete="name" placeholder="Enter your full name"></div>' +
    '<div class="smv-search-field"><label>Mobile number *</label><input name="mobile" type="tel" inputmode="numeric" maxlength="14" autocomplete="tel" placeholder="10-digit mobile number"></div></div>' +
    '<label class="smv-search-consent"><input type="checkbox" name="contactConsent" value="yes"><span>I agree that Select My Venue may contact me about this venue enquiry.</span></label></div>' +
    '<button class="smv-search-submit" type="submit">Search Suitable Venues →</button><p id="smvHomepageSearchStatus" class="smv-search-status" role="status" aria-live="polite"></p></form>';
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

    const payload = {...p, customerName:name, mobile:digits};
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