/* Select My Venue marketplace content layer - 2026-09-22 */
(function(){
"use strict";
function ready(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn,{once:true});else fn();}
function make(tag,cls,html){var n=document.createElement(tag);if(cls)n.className=cls;if(html!=null)n.innerHTML=html;return n;}

function enhanceHero(){
  var hero=document.querySelector(".hero"),copy=hero&&hero.querySelector(".hero-copy");
  if(!hero||!copy||document.getElementById("smvHeroFinder"))return;
  var badge=copy.querySelector(".ai-badge");if(badge)badge.innerHTML="<span></span> DELHI NCR · WEDDINGS · CELEBRATIONS";
  var eyebrow=copy.querySelector(".eyebrow");if(eyebrow)eyebrow.textContent="FIND THE RIGHT PLACE FOR YOUR MOMENT";
  var h1=copy.querySelector("h1");if(h1)h1.innerHTML='Find a venue that feels right.<br><span>And fits your celebration.</span>';
  var heroText=copy.querySelector(".hero-text");if(heroText)heroText.textContent="Explore verified wedding venues, banquet halls, farmhouses and party spaces across Delhi NCR. Compare location, capacity, pricing and facilities — or let us shortlist suitable venues for you.";

  var finder=make("form","smv-hero-finder");
  finder.id="smvHeroFinder";finder.setAttribute("aria-label","Find venues");
  finder.innerHTML=
    '<label><span>Where?</span><input id="smvHeroLocation" type="text" list="smvHeroLocations" placeholder="Delhi, Chattarpur, Gurgaon…" autocomplete="off"><datalist id="smvHeroLocations"><option value="Delhi"></option><option value="Chattarpur"></option><option value="GT Karnal Road"></option><option value="Kapashera"></option><option value="Dwarka"></option><option value="Alipur"></option><option value="Gurgaon"></option><option value="Noida"></option><option value="Faridabad"></option></datalist></label>'+
    '<label><span>Event</span><select id="smvHeroEvent"><option value="">Any event</option><option>Wedding</option><option>Engagement</option><option>Reception</option><option>Birthday</option><option>Corporate Event</option><option>Party</option></select></label>'+
    '<label><span>Guests</span><select id="smvHeroGuests"><option value="">Any size</option><option value="Less than 50">Under 50</option><option value="50–99">50–99</option><option value="100–199">100–199</option><option value="200–299">200–299</option><option value="300–499">300–499</option><option value="500–699">500–699</option><option value="700–999">700–999</option><option value="1000+">1000+</option></select></label>'+
    '<label><span>Budget / person</span><select id="smvHeroBudget"><option value="">Any budget</option><option value="Up to ₹1,000">Up to ₹1,000</option><option value="₹1,001–1,500">₹1,001–1,500</option><option value="₹1,501–2,000">₹1,501–2,000</option><option value="₹2,001–3,000">₹2,001–3,000</option><option value="₹3,000+">₹3,000+</option></select></label>'+
    '<button type="submit">SHOW VENUES →</button>';

  var popular=make("div","smv-hero-popular",
    '<span>Popular:</span><a href="venues.html?q=Chattarpur">Chattarpur</a><a href="venues.html?q=GT%20Karnal%20Road">GT Karnal Road</a><a href="venues.html?city=Gurgaon">Gurgaon</a><a href="venues.html?city=Noida">Noida</a><a href="venues.html?q=Kapashera">Kapashera</a>');
  if(heroText){heroText.insertAdjacentElement("afterend",finder);finder.insertAdjacentElement("afterend",popular);}else{copy.append(finder,popular);}

  finder.addEventListener("submit",function(e){
    e.preventDefault();
    var p=new URLSearchParams(),loc=(document.getElementById("smvHeroLocation")&&document.getElementById("smvHeroLocation").value||"").trim();
    var occasion=document.getElementById("smvHeroEvent")&&document.getElementById("smvHeroEvent").value||"";
    var capacity=document.getElementById("smvHeroGuests")&&document.getElementById("smvHeroGuests").value||"";
    var budget=document.getElementById("smvHeroBudget")&&document.getElementById("smvHeroBudget").value||"";
    if(loc)p.set("q",loc);if(occasion)p.set("occasion",occasion);if(capacity)p.set("capacity",capacity);if(budget)p.set("budget",budget);
    window.location.href="venues.html"+(p.toString()?"?"+p.toString():"");
  });

  var visual=make("div","smv-hero-visual",
    '<div class="smv-hero-visual-main"><img src="assets/hero/hero-bright-celebration-v2.webp" alt="Elegant wedding celebration venue"></div>'+
    '<div class="smv-hero-visual-small"><img src="assets/hero/sangeet-engagement.webp" alt="Indian engagement celebration"></div>'+
    '<div class="smv-hero-visual-label"><strong>Wedding-ready venues</strong><span>Browse photos, capacity, pricing &amp; facilities</span></div>');
  var orbit=hero.querySelector(".hero-orbit");if(orbit)orbit.insertAdjacentElement("afterend",visual);else hero.querySelector(".hero-inner").appendChild(visual);
  var secondary=copy.querySelector(".hero-actions .secondary-btn");if(secondary){secondary.textContent="Browse All Venues →";secondary.href="venues.html";}
  var note=hero.querySelector(".micro-note");if(note)note.textContent="✓ Verified venue details  •  ✓ Requirement-based matching  •  ✓ Free discovery assistance";
}

function addSections(){
  var main=document.querySelector("main");if(!main||document.querySelector(".smv-celebrations-section"))return;
  var celebrations=make("section","smv-market-section smv-celebrations-section",
    '<div class="smv-market-inner"><div class="smv-market-heading"><div><span class="section-kicker">BROWSE BY CELEBRATION</span><h2>Start with the moment you’re planning.</h2></div><p>Explore venue ideas for weddings, engagements, receptions and every celebration around them.</p></div>'+
    '<div class="smv-celebration-grid">'+
    '<a class="smv-celebration-card" href="venues.html?occasion=Wedding"><img loading="lazy" src="assets/hero/hero-bright-wedding-v2.webp" alt="Wedding venues"><div><strong>Wedding</strong><span>Banquets, lawns &amp; farmhouses</span></div></a>'+
    '<a class="smv-celebration-card" href="venues.html?occasion=Engagement"><img loading="lazy" src="assets/hero/hero-bright-engagement-v2.webp" alt="Engagement venues"><div><strong>Engagement &amp; Roka</strong><span>Intimate to grand celebrations</span></div></a>'+
    '<a class="smv-celebration-card" href="venues.html?occasion=Reception"><img loading="lazy" src="assets/hero/hero-bright-celebration-v2.webp" alt="Reception venues"><div><strong>Reception</strong><span>Elegant evening venues</span></div></a>'+
    '<a class="smv-celebration-card" href="venues.html?occasion=Birthday"><img loading="lazy" src="assets/hero/hero-bright-garden-v2.webp" alt="Birthday party venues"><div><strong>Birthday</strong><span>Party spaces for every age</span></div></a>'+
    '<a class="smv-celebration-card" href="venues.html?occasion=Corporate%20Event"><img loading="lazy" src="assets/hero/hero-bright-garden-v2.webp" alt="Corporate event venues"><div><strong>Corporate Event</strong><span>Meetings, launches &amp; socials</span></div></a>'+
    '<a class="smv-celebration-card" href="venues.html?occasion=Party"><img loading="lazy" src="assets/hero/sangeet-engagement.webp" alt="Party halls"><div><strong>Party &amp; Celebration</strong><span>Fun spaces for special moments</span></div></a>'+
    '</div></div>');

  var locations=make("section","smv-market-section alt smv-locations-section",
    '<div class="smv-market-inner"><div class="smv-market-heading"><div><span class="section-kicker">EXPLORE BY LOCATION</span><h2>Find a celebration space near the places that matter.</h2></div><p>Search major Delhi NCR markets and popular wedding belts without filling a form first.</p></div>'+
    '<div class="smv-location-grid">'+
    '<a class="smv-location-card" href="venues.html?city=Delhi"><img loading="lazy" src="assets/hero/hero-bright-wedding-v2.webp" alt="Venues in Delhi"><div><strong>Delhi</strong><span>Banquets, hotels, lawns &amp; farmhouses</span></div></a>'+
    '<a class="smv-location-card" href="venues.html?city=Gurgaon"><img loading="lazy" src="assets/hero/hero-bright-garden-v2.webp" alt="Venues in Gurgaon"><div><strong>Gurgaon</strong><span>Modern hotels &amp; premium celebrations</span></div></a>'+
    '<a class="smv-location-card" href="venues.html?city=Noida"><img loading="lazy" src="assets/hero/hero-bright-engagement-v2.webp" alt="Venues in Noida"><div><strong>Noida</strong><span>Banquets &amp; event spaces</span></div></a>'+
    '<a class="smv-location-card" href="venues.html?q=Chattarpur"><img loading="lazy" src="assets/hero/hero-bright-celebration-v2.webp" alt="Venues in Chattarpur"><div><strong>Chattarpur</strong><span>Farmhouses &amp; wedding venues</span></div></a>'+
    '<a class="smv-location-card" href="venues.html?q=GT%20Karnal%20Road"><img loading="lazy" src="assets/hero/hero-bright-garden-v2.webp" alt="Venues on GT Karnal Road"><div><strong>GT Karnal Road</strong><span>Large lawns, resorts &amp; banquets</span></div></a>'+
    '<a class="smv-location-card" href="venues.html?city=Faridabad"><img loading="lazy" src="assets/hero/sangeet-engagement.webp" alt="Venues in Faridabad"><div><strong>Faridabad</strong><span>Celebration venues across the city</span></div></a>'+
    '</div><div class="smv-location-more"><a href="venues.html?q=Kapashera">Kapashera</a><a href="venues.html?q=Dwarka">Dwarka</a><a href="venues.html?q=Alipur">Alipur</a><a href="venues.html?q=Peeragarhi">Peeragarhi</a><a href="venues.html">Explore all Delhi NCR →</a></div></div>');

  var discovery=make("section","smv-market-section smv-discovery-section",
    '<div class="smv-market-inner"><div class="smv-market-heading"><div><span class="section-kicker">FIND A VENUE YOUR WAY</span><h2>Shortlist faster with the details that actually matter.</h2></div><p>Browse by venue style, budget and practical requirements before asking for availability.</p></div>'+
    '<div class="smv-discovery-groups">'+
    '<div class="smv-discovery-group"><h3>By venue style</h3><div class="smv-discovery-list"><a class="smv-discovery-pill" href="venues.html?q=Banquet">Banquet Halls</a><a class="smv-discovery-pill" href="wedding-farmhouses-delhi-ncr.html">Farmhouses</a><a class="smv-discovery-pill" href="wedding-lawns-delhi-ncr.html">Wedding Lawns</a><a class="smv-discovery-pill" href="luxury-wedding-venues-delhi-ncr.html">Luxury Venues</a></div></div>'+
    '<div class="smv-discovery-group"><h3>By budget</h3><div class="smv-discovery-list"><a class="smv-discovery-pill" href="venues.html?budget=Up%20to%20%E2%82%B91%2C000">Up to ₹1,000 / person</a><a class="smv-discovery-pill" href="venues.html?budget=%E2%82%B91%2C001%E2%80%931%2C500">₹1,001–1,500</a><a class="smv-discovery-pill" href="venues.html?budget=%E2%82%B91%2C501%E2%80%932%2C000">₹1,501–2,000</a><a class="smv-discovery-pill" href="venues.html?budget=%E2%82%B93%2C000%2B">₹3,000+</a></div></div>'+
    '<div class="smv-discovery-group"><h3>Useful facilities</h3><div class="smv-discovery-list"><a class="smv-discovery-pill" href="wedding-venues-with-parking-delhi-ncr.html">Parking</a><a class="smv-discovery-pill" href="wedding-venues-with-rooms-delhi-ncr.html">Rooms</a><a class="smv-discovery-pill" href="pure-veg-wedding-venues-delhi-ncr.html">Pure Veg</a><a class="smv-discovery-pill" href="affordable-wedding-venues-delhi-ncr.html">Affordable Venues</a></div></div>'+
    '</div></div>');

  var inspiration=make("section","smv-market-section alt smv-inspiration-section",
    '<div class="smv-market-inner"><div class="smv-market-heading"><div><span class="section-kicker">CELEBRATION INSPIRATION</span><h2>Plan the venue decision with more confidence.</h2></div><p>Helpful starting points for comparing budget, venue style and guest comfort across Delhi NCR.</p></div>'+
    '<div class="smv-inspiration-grid">'+
    '<a class="smv-inspiration-card" href="affordable-wedding-venues-delhi-ncr.html"><img loading="lazy" src="assets/hero/hero-bright-wedding-v2.webp" alt="Affordable wedding venue planning"><div><small>BUDGET GUIDE</small><h3>Finding a beautiful wedding venue without overspending</h3><p>Start with the areas, venue types and pricing signals that make shortlisting easier.</p></div></a>'+
    '<a class="smv-inspiration-card" href="wedding-farmhouses-delhi-ncr.html"><img loading="lazy" src="assets/hero/hero-bright-garden-v2.webp" alt="Wedding farmhouse inspiration"><div><small>VENUE STYLE</small><h3>Banquet hall or farmhouse — what suits your celebration?</h3><p>Think about guest count, season, décor freedom and the overall experience you want.</p></div></a>'+
    '<a class="smv-inspiration-card" href="wedding-venues-with-rooms-delhi-ncr.html"><img loading="lazy" src="assets/hero/sangeet-engagement.webp" alt="Wedding venues with rooms"><div><small>GUEST COMFORT</small><h3>When rooms and parking should influence your shortlist</h3><p>Practical facilities can make a major difference for family events and outstation guests.</p></div></a>'+
    '</div></div>');

  var owner=make("section","smv-owner-cta",
    '<div class="smv-owner-inner"><div class="smv-owner-copy"><span class="section-kicker">FOR VENUE OWNERS · LAUNCH OFFER</span><h2>Own a venue? Get discovered by the right customers.</h2><p>Build your Select My Venue presence and receive relevant enquiry opportunities through our growing Delhi NCR venue network.</p><div class="smv-owner-points"><span>✓ Professional venue profile</span><span>✓ Relevant enquiry opportunities</span><span>✓ Partner CRM access</span><span>✓ 10-day complimentary launch trial</span></div><a class="primary-btn" href="list-your-venue.html">List Your Venue FREE →</a></div><div class="smv-owner-visual"><img loading="lazy" src="assets/hero/hero-bright-celebration-v2.webp" alt="Wedding venue ready for a celebration"></div></div>');

  main.append(celebrations,locations,discovery,inspiration,owner);
}

function polishHome(){
  var featured=document.getElementById("featuredVenues");
  if(featured){
    var k=featured.querySelector(".section-kicker"),h=featured.querySelector("h2"),p=featured.querySelector(".home-venues-heading-actions p");
    if(k)k.textContent="VERIFIED VENUES TO EXPLORE";
    if(h)h.innerHTML='Venues worth exploring <span>before you enquire.</span>';
    if(p)p.textContent="Compare live venue profiles with location, capacity, pricing and facilities. Open a venue to see more before checking availability.";
  }
  var enquiry=document.getElementById("enquiry");
  if(enquiry){
    var ek=enquiry.querySelector(".section-heading .section-kicker"),eh=enquiry.querySelector(".section-heading h2"),ep=enquiry.querySelector(".section-heading>p"),submit=document.getElementById("customerEnquirySubmit");
    if(ek)ek.textContent="PERSONALISED VENUE MATCHING";
    if(eh)eh.innerHTML='Too many options? <span>Let us shortlist them for you.</span>';
    if(ep)ep.textContent="Tell us your event, preferred location, guest count and budget. We’ll focus on relevant venue options and contact you about the shortlist.";
    if(submit)submit.textContent="Find Matching Venues →";
  }
  var trust=[].slice.call(document.querySelectorAll(".trust-strip>div"));
  var copy=[["✓","Verified Venues","Published venue details"],["⌖","Delhi NCR Focus","Local discovery first"],["◎","Smarter Matching","Event, guests & budget"],["✦","Free Assistance","Help with your shortlist"]];
  trust.forEach(function(item,i){if(!copy[i])return;var icon=item.querySelector(".trust-icon"),strong=item.querySelector("strong"),small=item.querySelector("small");if(icon)icon.textContent=copy[i][0];if(strong)strong.textContent=copy[i][1];if(small)small.textContent=copy[i][2];});
}

function enhanceProfile(){
  if(!document.querySelector(".venue-profile-main"))return;
  var g=document.querySelector("#venueProfileGallerySection h2");if(g)g.textContent="Explore the spaces, décor and celebration setting.";
  var v=document.querySelector("#venueProfileVideosSection h2");if(v)v.textContent="See how the venue feels in motion.";
  var headings=[].slice.call(document.querySelectorAll(".venue-profile-panel h2"));
  var smart=headings.find(function(x){return /Why this venue/i.test(x.textContent||"");});if(smart)smart.textContent="Why this venue could fit your celebration";
  var aside=document.querySelector(".venue-profile-enquiry p");if(aside)aside.textContent="Share your event details once to check pricing, availability and site-visit options for this venue without repeating the venue information already shown here.";
}

function run(){if(document.querySelector(".venue-profile-main")){enhanceProfile();return;}enhanceHero();addSections();polishHome();}
ready(run);
})();