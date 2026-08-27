(function () {
  "use strict";

  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const venueId = new URLSearchParams(window.location.search).get("id") || "";
  const validVenueId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(venueId);

  const client = window.supabase?.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  const byId = id => document.getElementById(id);

  function safeHttpUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function money(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return null;

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(number);
  }

  function capacity(venue) {
    const minimum = Number(venue.capacity_min || 0);
    const maximum = Number(venue.capacity_max || 0);

    if (minimum && maximum) return `${minimum}–${maximum} guests`;
    if (maximum) return `Up to ${maximum} guests`;
    if (minimum) return `${minimum}+ guests`;
    return "On request";
  }

  function pricing(venue) {
    const minimum = money(venue.price_min_per_person);
    const maximum = money(venue.price_max_per_person);

    if (minimum && maximum) return `${minimum}–${maximum} per person`;
    if (minimum) return `From ${minimum} per person`;
    if (maximum) return `Up to ${maximum} per person`;
    return "Quote on request";
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

  function setMeta(name, description, imageUrl) {
    const pageUrl = `https://selectmyvenue.com/venue.html?id=${encodeURIComponent(venueId)}`;
    const title = `${name} | Verified Venue | Select My Venue`;

    document.title = title;
    byId("venueMetaDescription").setAttribute("content", description);
    byId("venueCanonical").setAttribute("href", pageUrl);
    byId("venueOgTitle").setAttribute("content", title);
    byId("venueOgDescription").setAttribute("content", description);
    byId("venueOgUrl").setAttribute("content", pageUrl);
    byId("venueOgImage").setAttribute("content", imageUrl || "https://selectmyvenue.com/logo.png");
  }

  function setStructuredData(venue, imageUrl, description) {
    const location = [venue.area, venue.city].filter(Boolean).join(", ");
    const data = {
      "@context": "https://schema.org",
      "@type": "EventVenue",
      "@id": `https://selectmyvenue.com/venue.html?id=${venue.id}`,
      name: venue.venue_name,
      description,
      url: `https://selectmyvenue.com/venue.html?id=${venue.id}`,
      publicAccess: true,
      address: {
        "@type": "PostalAddress",
        streetAddress: venue.area || undefined,
        addressLocality: venue.city || location || undefined,
        addressCountry: "IN"
      },
      maximumAttendeeCapacity: Number(venue.capacity_max || 0) || undefined,
      image: imageUrl || undefined
    };

    Object.keys(data.address).forEach(key => {
      if (data.address[key] === undefined) delete data.address[key];
    });
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) delete data[key];
    });

    byId("venueStructuredData").textContent = JSON.stringify(data);
  }

  function renderProfile(venue) {
    const name = String(venue.venue_name || "Verified Venue");
    const type = String(venue.venue_type || "Venue");
    const location = [venue.area, venue.city].filter(Boolean).join(", ") || "Location on request";
    const description = String(venue.description || "Ask our team for availability, packages and detailed venue information.");
    const imageUrl = safeHttpUrl(venue.cover_image_url);
    const quoteUrl = `index.html?venue=${encodeURIComponent(venue.id)}&venue_name=${encodeURIComponent(name)}#enquiry`;
    const whatsappUrl = `https://wa.me/918368322256?text=${encodeURIComponent(`Hi Select My Venue, I am interested in ${name}. Please share details and availability.`)}`;
    const mapUrl = safeHttpUrl(venue.google_maps_url);

    byId("venueBreadcrumb").textContent = name;
    byId("venueProfileName").textContent = name;
    byId("venueProfileType").textContent = type;
    byId("venueProfileFactType").textContent = type;
    byId("venueProfileLocation").textContent = `⌖ ${location}`;
    byId("venueProfileCapacity").textContent = capacity(venue);
    byId("venueProfilePrice").textContent = pricing(venue);
    byId("venueProfileDescription").textContent = description;
    byId("venueAboutHeading").textContent = `Discover ${name}.`;

    byId("venueProfileQuote").href = quoteUrl;
    byId("venueProfileQuoteAside").href = quoteUrl;
    byId("venueProfileWhatsapp").href = whatsappUrl;

    if (imageUrl) {
      const image = byId("venueProfileImage");
      image.src = imageUrl;
      image.alt = `${name} venue`;
      image.hidden = false;
      byId("venueProfileFallback").hidden = true;
    }

    if (mapUrl) {
      const map = byId("venueProfileMap");
      map.href = mapUrl;
      map.hidden = false;
    }

    const featureList = venueFeatures(venue);
    byId("venueProfileFeatures").innerHTML = featureList.length
      ? featureList.map(([icon, label]) => `
          <div class="venue-profile-feature">
            <span>${icon}</span>
            <strong>${label}</strong>
          </div>
        `).join("")
      : `<div class="venue-profile-feature"><span>✦</span><strong>Venue details available on request</strong></div>`;

    const metaDescription = `${name} in ${location}. View capacity, pricing and facilities, then request a personalised quote from Select My Venue.`;
    setMeta(name, metaDescription, imageUrl);
    setStructuredData(venue, imageUrl, description);

    byId("venueProfileLoading").hidden = true;
    byId("venueProfile").hidden = false;
  }

  function showError() {
    byId("venueProfileLoading").hidden = true;
    byId("venueProfileError").hidden = false;
  }

  async function loadProfile() {
    if (!validVenueId || !client) {
      showError();
      return;
    }

    const { data, error } = await client.rpc("smv_public_venues");

    if (error) {
      console.error("Venue profile error:", error);
      showError();
      return;
    }

    const venue = (Array.isArray(data) ? data : [])
      .map(item => item?.venue || item)
      .find(item => String(item?.id) === venueId);

    if (!venue) {
      showError();
      return;
    }

    renderProfile(venue);
  }

  loadProfile();
})();
