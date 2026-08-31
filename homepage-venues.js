(function () {
  "use strict";

  function installFoundingPartnerOffer() {
    if (document.getElementById("smvFoundingPartnerOffer")) return;

    const style = document.createElement("style");
    style.id = "smvFoundingPartnerOfferStyles";
    style.textContent = `
      .smv-owner-launch-wrap{position:relative;z-index:30;width:100%;padding:18px 28px;overflow:hidden;background:radial-gradient(circle at 8% 20%,rgba(25,216,189,.13),transparent 24%),radial-gradient(circle at 92% 12%,rgba(243,200,75,.09),transparent 22%),linear-gradient(180deg,#031b19 0%,#031817 100%);border-bottom:1px solid rgba(25,216,189,.13)}
      .smv-owner-launch-panel{position:relative;width:min(100%,1760px);margin:0 auto;padding:22px 28px;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(420px,.95fr);gap:28px;align-items:center;overflow:hidden;border:1px solid rgba(25,216,189,.42);border-radius:28px;color:#f3fbfa;background:radial-gradient(circle at 0% 0%,rgba(25,216,189,.11),transparent 34%),radial-gradient(circle at 100% 0%,rgba(243,200,75,.07),transparent 30%),linear-gradient(135deg,#06322d 0%,#03231f 42%,#031a18 100%);box-shadow:0 24px 58px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.025)}
      .smv-owner-launch-panel::after{content:"";position:absolute;inset:-70% -25%;background:linear-gradient(110deg,transparent 45%,rgba(255,255,255,.055) 50%,transparent 55%);transform:translateX(-74%);animation:smvHomepageOfferShine 7s ease-in-out infinite;pointer-events:none}
      .smv-owner-launch-left,.smv-owner-launch-right{position:relative;z-index:1}
      .smv-owner-launch-kicker{display:inline-flex;align-items:center;gap:10px;min-height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(25,216,189,.45);color:#20dcc3;background:rgba(25,216,189,.055);font-size:10px;font-weight:950;letter-spacing:.13em;text-transform:uppercase}
      .smv-owner-launch-kicker::before{content:"";width:8px;height:8px;border-radius:50%;background:#19d8bd;box-shadow:0 0 14px rgba(25,216,189,.75);animation:smvHomepageDotPulse 1.6s ease-in-out infinite}
      .smv-owner-launch-heading{margin:14px 0 8px;max-width:900px;color:#f3fbfa;font-size:clamp(36px,4vw,66px);line-height:.98;font-weight:1000;letter-spacing:-.045em}
      .smv-owner-launch-heading span{color:#19d8bd;text-shadow:0 0 24px rgba(25,216,189,.17);animation:smvHomepageFreePulse 1.9s ease-in-out infinite}
      .smv-owner-launch-copy{max-width:880px;margin:0;color:#a9cbc6;font-size:14px;line-height:1.65}
      .smv-owner-launch-chips{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}
      .smv-owner-launch-chips span{display:inline-flex;align-items:center;min-height:38px;padding:0 14px;border-radius:13px;border:1px solid rgba(25,216,189,.25);color:#f3fbfa;background:rgba(25,216,189,.055);font-size:10px;font-weight:900;white-space:nowrap}
      .smv-owner-launch-chips .trial-chip{color:#ffe47a;border-color:rgba(243,200,75,.46);background:rgba(243,200,75,.06);animation:smvTrialGlow 2.1s ease-in-out infinite}
      .smv-owner-launch-limited{display:flex;align-items:center;justify-content:center;margin-top:14px;min-height:46px;padding:8px 14px;border-radius:15px;border:1px solid rgba(243,200,75,.62);background:linear-gradient(90deg,rgba(243,200,75,.11),rgba(243,200,75,.035));color:#ffe9a0;font-size:11px;font-weight:1000;letter-spacing:.035em;text-align:center}
      .smv-owner-launch-right{padding:20px 22px;border:1px solid rgba(25,216,189,.22);border-radius:22px;background:rgba(2,28,25,.77);box-shadow:0 18px 38px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.02)}
      .smv-owner-launch-right h3{margin:0 0 12px;color:#fff;font-size:18px;line-height:1.2;font-weight:950}
      .smv-owner-launch-benefit-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}
      .smv-owner-launch-benefit{display:flex;gap:9px;align-items:flex-start;color:#c4dcda;font-size:11px;line-height:1.35}
      .smv-owner-launch-benefit::before{content:"✓";flex:0 0 auto;color:#19d8bd;font-size:15px;font-weight:1000;line-height:1;margin-top:1px}
      .smv-owner-launch-cta-row{display:flex;align-items:center;gap:12px;margin-top:18px}
      .smv-owner-launch-cta{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 20px;border-radius:14px;border:1px solid rgba(31,235,207,.52);background:linear-gradient(135deg,#20dcc3,#0fc8b0);color:#02211c;font-size:12px;font-weight:1000;text-decoration:none;white-space:nowrap;box-shadow:0 12px 30px rgba(15,200,176,.18);animation:smvHomepageCtaPulse 2.1s ease-in-out infinite;transition:.2s ease}
      .smv-owner-launch-cta:hover{transform:translateY(-2px);filter:brightness(1.05)}
      .smv-owner-launch-trust{margin-top:11px;color:#6f9c96;font-size:9px;line-height:1.45}

      /* Header desktop balance */
      .header-inner{padding-left:22px!important;padding-right:22px!important;gap:16px!important}
      .brand{width:180px!important;flex:0 0 180px!important}
      .brand img{width:168px!important}
      #mainNav{min-width:0!important;gap:clamp(8px,.72vw,15px)!important;margin-left:auto!important;justify-content:flex-end!important}
      #mainNav>a{font-size:clamp(14px,.86vw,16px)!important;font-weight:800!important;flex:0 0 auto!important}
      #mainNav .smv-header-action{min-height:44px;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;transition:transform .2s ease,border-color .2s ease,background .2s ease,box-shadow .2s ease,color .2s ease}
      #mainNav a.smv-find-nav{padding:0 15px!important;border:1px solid rgba(25,216,189,.48)!important;background:linear-gradient(180deg,rgba(25,216,189,.09),rgba(25,216,189,.025))!important;color:#2ce3ca!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 7px 20px rgba(0,0,0,.11)}
      #mainNav a.smv-find-nav::after{display:none!important}
      #mainNav a.smv-header-phone{position:relative;padding:0 13px!important;gap:7px;color:#f3fbfa!important;font-weight:950!important;white-space:nowrap;border:1px solid rgba(25,216,189,.18);background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(25,216,189,.025));box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
      #mainNav a.smv-header-phone::before{content:"☎";width:25px;height:25px;display:grid;place-items:center;border-radius:50%;color:#02211c;background:linear-gradient(135deg,#2ce3ca,#19d8bd);font-size:12px;line-height:1;box-shadow:0 0 14px rgba(25,216,189,.16)}
      #mainNav a.smv-header-phone::after{display:none!important}
      #mainNav a.smv-owner-nav-offer{position:relative;padding:0 16px!important;border:1px solid rgba(243,200,75,.52);border-radius:999px;color:#ffe47a!important;background:linear-gradient(180deg,rgba(243,200,75,.09),rgba(243,200,75,.025));box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 7px 20px rgba(0,0,0,.11);animation:smvOwnerNavGlow 2.4s ease-in-out infinite}
      #mainNav a.smv-owner-nav-offer::before{content:"FREE";position:absolute;top:-9px;right:9px;min-width:32px;height:17px;padding:0 5px;display:grid;place-items:center;border-radius:999px;border:2px solid #031817;background:#19d8bd;color:#02211c;font-size:7px;font-weight:1000;letter-spacing:.08em;box-shadow:0 0 12px rgba(25,216,189,.25)}
      #mainNav a.smv-owner-nav-offer::after{display:none!important}
      #mainNav a.smv-find-nav:hover,#mainNav a.smv-header-phone:hover,#mainNav a.smv-owner-nav-offer:hover{transform:translateY(-1px)}

      @media(max-width:1650px){
        .header-inner{padding-left:16px!important;padding-right:16px!important;gap:9px!important}
        .brand{width:160px!important;flex-basis:160px!important}.brand img{width:150px!important}
        #mainNav{gap:7px!important}
        #mainNav>a{font-size:14px!important}
        #mainNav .smv-header-action{min-height:42px}
        #mainNav a.smv-find-nav{padding:0 12px!important}
        #mainNav a.smv-header-phone{padding:0 10px!important;gap:5px}
        #mainNav a.smv-owner-nav-offer{padding:0 12px!important}
      }
      @media(max-width:1450px){
        #mainNav{gap:7px!important}
        #mainNav>a{font-size:13.5px!important}
        #mainNav a[href="#aiPlanner"],#mainNav a[href="delhi-ncr-venues.html"]{display:none!important}
        .brand{width:158px!important;flex-basis:158px!important}.brand img{width:148px!important}
      }

      #home{min-height:430px!important}#home .hero-inner{min-height:430px!important;padding-top:54px!important;padding-bottom:48px!important}#home h1{font-size:clamp(42px,4.6vw,72px)!important;line-height:1.01!important}
      @keyframes smvHomepageDotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.78)}}
      @keyframes smvHomepageFreePulse{0%,100%{opacity:1;filter:brightness(1)}50%{opacity:.82;filter:brightness(1.18)}}
      @keyframes smvTrialGlow{0%,100%{box-shadow:0 0 0 rgba(243,200,75,0)}50%{box-shadow:0 0 18px rgba(243,200,75,.14)}}
      @keyframes smvHomepageCtaPulse{0%,100%{box-shadow:0 12px 30px rgba(15,200,176,.18)}50%{box-shadow:0 12px 32px rgba(15,200,176,.23)}}
      @keyframes smvOwnerNavGlow{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 7px 20px rgba(0,0,0,.11)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 7px 23px rgba(243,200,75,.09)}}
      @keyframes smvHomepageOfferShine{0%,72%,100%{transform:translateX(-74%)}86%{transform:translateX(74%)}}
      @media(max-width:1100px){.smv-owner-launch-panel{grid-template-columns:1fr;gap:16px;padding:22px}.smv-owner-launch-right{padding:18px 20px}.smv-owner-launch-heading{font-size:clamp(38px,7vw,58px)}}
      @media(max-width:760px){.smv-owner-launch-wrap{padding:12px}.smv-owner-launch-panel{padding:18px 16px;border-radius:21px}.smv-owner-launch-heading{font-size:clamp(38px,11vw,52px)}.smv-owner-launch-benefit-grid{grid-template-columns:1fr}.smv-owner-launch-copy{font-size:12px}.smv-owner-launch-limited{font-size:9px}#home{min-height:390px!important}#home .hero-inner{min-height:390px!important;padding-top:42px!important;padding-bottom:40px!important}}
      @media(max-width:520px){.smv-owner-launch-kicker{font-size:8px;min-height:32px;padding:0 11px}.smv-owner-launch-heading{font-size:40px}.smv-owner-launch-chips{gap:7px}.smv-owner-launch-chips span{min-height:34px;padding:0 10px;font-size:8px}.smv-owner-launch-right{padding:16px}.smv-owner-launch-right h3{font-size:16px}.smv-owner-launch-cta{width:100%;font-size:11px}}
      @media(prefers-reduced-motion:reduce){.smv-owner-launch-panel::after,.smv-owner-launch-kicker::before,.smv-owner-launch-heading span,.smv-owner-launch-chips .trial-chip,.smv-owner-launch-cta,#mainNav a.smv-owner-nav-offer{animation:none!important}}
    `;
    document.head.appendChild(style);

    const main = document.querySelector("main");
    const hero = document.getElementById("home");
    if (main && hero) {
      const section = document.createElement("section");
      section.id = "smvFoundingPartnerOffer";
      section.className = "smv-owner-launch-wrap";
      section.setAttribute("aria-label", "Founding Venue Partner launch offer");
      section.innerHTML = `<div class="smv-owner-launch-panel"><div class="smv-owner-launch-left"><div class="smv-owner-launch-kicker">Launch Offer · Founding Venue Partners</div><h2 class="smv-owner-launch-heading">List Your Venue <span>FREE.</span></h2><p class="smv-owner-launch-copy">Join the Select My Venue partner network during our launch phase. We help create your venue profile and give eligible partners access to tools for managing relevant customer enquiry opportunities.</p><div class="smv-owner-launch-chips"><span>₹0 JOINING FEE</span><span>FREE VENUE LISTING</span><span>PARTNER CRM ACCESS</span><span class="trial-chip">10-DAY COMPLIMENTARY LAUNCH TRIAL</span></div><div class="smv-owner-launch-limited">✨ LIMITED LAUNCH OFFER — NO PAYMENT REQUIRED TO GET STARTED ✨</div></div><aside class="smv-owner-launch-right"><h3>Your Founding Partner launch benefits</h3><div class="smv-owner-launch-benefit-grid"><div class="smv-owner-launch-benefit">Professional venue profile</div><div class="smv-owner-launch-benefit">₹0 joining fee</div><div class="smv-owner-launch-benefit">Partner CRM access</div><div class="smv-owner-launch-benefit">Relevant enquiry opportunities</div><div class="smv-owner-launch-benefit">Verified Partner opportunity</div><div class="smv-owner-launch-benefit">No commission to join</div><div class="smv-owner-launch-benefit">10-day complimentary trial</div><div class="smv-owner-launch-benefit">No long-term commitment</div></div><div class="smv-owner-launch-cta-row"><a class="smv-owner-launch-cta" href="list-your-venue.html">LIST YOUR VENUE FREE →</a></div><p class="smv-owner-launch-trust">You stay in control. Joining does not guarantee enquiries or bookings, and there is no obligation to continue after the complimentary period.</p></aside></div>`;
      main.insertBefore(section, hero);
    }

    const findLink = document.querySelector('#mainNav a.nav-cta[href="#enquiry"]');
    if (findLink) findLink.classList.add("smv-header-action", "smv-find-nav");

    const navOffer = document.querySelector('#mainNav a[href="list-your-venue.html"]');
    if (navOffer) {
      navOffer.classList.add("smv-header-action", "smv-owner-nav-offer");
      navOffer.setAttribute("title", "Founding Venue Partner Offer — List Your Venue FREE");
      navOffer.setAttribute("aria-label", "List Your Venue FREE — Founding Venue Partner Offer");
    }

    const contactLink = document.querySelector('#mainNav a[href="#contact"]');
    if (contactLink) {
      contactLink.textContent = "+91 83683 22256";
      contactLink.href = "tel:+918368322256";
      contactLink.classList.add("smv-header-action", "smv-header-phone");
      contactLink.setAttribute("aria-label", "Call Select My Venue at +91 83683 22256");
      contactLink.setAttribute("title", "Call +91 83683 22256");
    }
  }

  installFoundingPartnerOffer();

  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
  const section = document.getElementById("featuredVenues");
  const grid = document.getElementById("homeVenueGrid");
  if (!section || !grid) return;
  const client = window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const escapeHtml=value=>String(value??"").replace(/[&<>'\"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'\"':"&quot;"})[character]);
  function safeHttpUrl(value){try{const url=new URL(String(value||""));return["http:","https:"].includes(url.protocol)?url.href:""}catch(_){return""}}
  function money(value){const number=Number(value);if(!Number.isFinite(number)||number<=0)return null;return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(number)}
  function capacity(venue){const minimum=Number(venue.capacity_min||0),maximum=Number(venue.capacity_max||0);if(minimum&&maximum)return`${minimum}–${maximum} guests`;if(maximum)return`Up to ${maximum} guests`;if(minimum)return`${minimum}+ guests`;return"On request"}
  function pricing(venue){const minimum=money(venue.price_min_per_person),maximum=money(venue.price_max_per_person);if(minimum&&maximum)return`${minimum}–${maximum}/person`;if(minimum)return`${minimum}+/person`;if(maximum)return`Up to ${maximum}/person`;return"Quote on request"}
  function features(venue){const items=[];if(venue.food_veg)items.push("Vegetarian");if(venue.food_non_veg)items.push("Non-Vegetarian");if(venue.parking_available)items.push("Parking");if(venue.rooms_available)items.push("Rooms");if(venue.catering_available)items.push("Catering");if(venue.decoration_available)items.push("Decoration");return items.slice(0,4)}
  function renderVenue(venue){const id=encodeURIComponent(String(venue.id||""));const name=String(venue.venue_name||"Venue Partner");const imageUrl=safeHttpUrl(venue.cover_image_url);const location=[venue.area,venue.city].filter(Boolean).join(", ")||"Location on request";const featureList=features(venue);const profileUrl=`venue.html?id=${id}`;const quoteUrl=`index.html?venue=${id}&venue_name=${encodeURIComponent(name)}#enquiry`;const media=imageUrl?`<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)} venue" loading="lazy" decoding="async">`:`<div class="home-venue-image-fallback" aria-hidden="true">🏨</div>`;const featureHtml=featureList.length?featureList.map(item=>`<span>✓ ${escapeHtml(item)}</span>`).join(""):`<span>Details on request</span>`;return`<article class="home-venue-card"><div class="home-venue-media">${media}<div class="home-venue-badges"><span class="home-venue-badge">${escapeHtml(venue.venue_type||"Venue")}</span><span class="home-venue-badge verified">✓ Verified</span></div></div><div class="home-venue-content"><h3>${escapeHtml(name)}</h3><p class="home-venue-location">⌖ ${escapeHtml(location)}</p><div class="home-venue-facts"><div class="home-venue-fact"><span>Capacity</span><strong>${escapeHtml(capacity(venue))}</strong></div><div class="home-venue-fact"><span>Starting range</span><strong>${escapeHtml(pricing(venue))}</strong></div></div><div class="home-venue-features">${featureHtml}</div><div class="home-venue-actions"><a class="secondary-btn" href="${profileUrl}">View Profile</a><a class="primary-btn" href="${quoteUrl}">Get Quote</a></div></div></article>`}
  function hideShowcase(){grid.innerHTML="";section.hidden=true;section.setAttribute("aria-busy","false")}
  function showShowcase(){section.hidden=false;section.setAttribute("aria-busy","false")}
  async function loadHomepageVenues(){if(!client){hideShowcase();return}const{data,error}=await client.rpc("smv_public_venues");if(error){console.error("Homepage venue showcase error:",error);hideShowcase();return}const venues=Array.isArray(data)?data.map(item=>item?.venue||item).filter(Boolean):[];if(!venues.length){hideShowcase();return}showShowcase();grid.innerHTML=venues.slice(0,6).map(renderVenue).join("")}
  loadHomepageVenues();
})();