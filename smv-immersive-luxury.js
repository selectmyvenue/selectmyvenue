/* SMV immersive luxury homepage + clear mega navigation. No form/database logic is replaced. */
(function(){
 "use strict";
 function make(tag,cls,html){var n=document.createElement(tag);if(cls)n.className=cls;if(html!==undefined)n.innerHTML=html;return n;}
 function enhanceNavigation(){
  var nav=document.getElementById("mainNav");if(!nav||nav.dataset.luxuryNav==="1")return;
  nav.classList.add("smv-lux-nav");
  nav.innerHTML=
   '<a href="index.html#home">Home</a>'+
   '<div class="smv-lux-nav-group"><button class="smv-lux-nav-trigger smv-nav-more" type="button" aria-expanded="false">Explore Venues</button><div class="smv-lux-nav-panel">'+
    '<a href="venues.html">Browse Venues</a><a href="delhi-ncr-venues.html">Delhi NCR Venue Guide</a><a href="venues-in-delhi.html">Venues in Delhi</a><a href="venues-in-gurgaon.html">Venues in Gurugram</a><a href="wedding-venues-delhi-ncr.html">Wedding Venues</a><a href="party-halls-delhi-ncr.html">Party Halls</a><a href="banquet-halls-in-delhi.html">Banquet Halls — Delhi</a><a href="banquet-halls-in-gurgaon.html">Banquet Halls — Gurugram</a><a href="wedding-lawns-delhi-ncr.html">Wedding Lawns</a><a href="wedding-farmhouses-delhi-ncr.html">Wedding Farmhouses</a>'+
    '<a class="smv-nav-feature" href="venues.html"><strong>Discover your perfect setting</strong><span>Compare real venue profiles, locations, capacity, pricing and facilities.</span></a></div></div>'+
   '<div class="smv-lux-nav-group"><button class="smv-lux-nav-trigger smv-nav-more" type="button" aria-expanded="false">Plan Your Event</button><div class="smv-lux-nav-panel">'+
    '<a href="index.html#how">How It Works</a><a href="index.html#smart">Smart Discovery</a><a href="index.html#aiPlanner">AI Event Planner</a><a href="index.html#enquiry">Get Matched</a><a href="venues-for-wedding-delhi-ncr.html">Wedding Planning</a><a href="venues-for-birthday-delhi-ncr.html">Birthday Celebrations</a><a href="venues-for-engagement-delhi-ncr.html">Engagement & Roka</a><a href="venues-for-corporate-delhi-ncr.html">Corporate Events</a><a href="venues-for-reception-delhi-ncr.html">Reception</a>'+
    '<a class="smv-nav-feature" href="index.html#aiPlanner"><strong>Make planning feel effortless</strong><span>Start with your event, guest count, budget and preferred location.</span></a></div></div>'+
   '<a href="index.html#featuredVenues">Featured Venues</a>'+
   '<div class="smv-lux-nav-group"><button class="smv-lux-nav-trigger smv-nav-more" type="button" aria-expanded="false">For Venue Owners</button><div class="smv-lux-nav-panel">'+
    '<a href="list-your-venue.html">List Your Venue</a><a href="https://partner.selectmyvenue.com/">Partner Login</a><a href="index.html#contact">Talk to SMV</a>'+
    '<a class="smv-nav-feature" href="list-your-venue.html"><strong>Grow your venue enquiries</strong><span>Start with the 7-day complimentary listing trial.</span></a></div></div>'+
   '<a class="smv-nav-cta" href="index.html#enquiry">Find My Venue <span aria-hidden="true">→</span></a>';
  nav.dataset.luxuryNav="1";
  nav.addEventListener("click",function(e){
   var trigger=e.target.closest(".smv-lux-nav-trigger");if(!trigger)return;
   e.preventDefault();e.stopPropagation();
   var group=trigger.closest(".smv-lux-nav-group"),open=group.classList.toggle("is-open");
   trigger.setAttribute("aria-expanded",open?"true":"false");
   nav.querySelectorAll(".smv-lux-nav-group").forEach(function(other){if(other!==group){other.classList.remove("is-open");var b=other.querySelector(".smv-lux-nav-trigger");if(b)b.setAttribute("aria-expanded","false");}});
  });
 }
 function enhanceHero(){
  var hero=document.querySelector(".hero"),inner=hero&&hero.querySelector(".hero-inner"),orbit=hero&&hero.querySelector(".hero-orbit");
  if(!hero||!inner||!orbit||hero.querySelector(".smv-hero-3d"))return;
  var visual=make("div","smv-hero-3d");
  visual.setAttribute("aria-label","Luxury wedding venue and celebration photography");
  visual.innerHTML=
   '<div class="smv-hero-photo smv-hero-photo-main"><img src="assets/hero/hero-bright-wedding-v2.webp" alt="Elegant wedding venue with a luxurious celebration setting" loading="eager" fetchpriority="high"><div class="smv-hero-photo-caption"><small>THE ART OF CELEBRATING</small><strong>Spaces made for forever</strong></div></div>'+
   '<div class="smv-hero-photo smv-hero-photo-left"><img src="assets/hero/hero-bright-garden-v2.webp" alt="Outdoor garden celebration venue" loading="lazy"><div class="smv-hero-photo-caption"><small>OPEN AIR</small><strong>Garden elegance</strong></div></div>'+
   '<div class="smv-hero-photo smv-hero-photo-bottom"><img src="assets/hero/hero-bright-engagement-v2.webp" alt="Beautiful engagement celebration venue" loading="lazy"><div class="smv-hero-photo-caption"><small>INTIMATE MOMENTS</small><strong>Celebrate your way</strong></div></div>'+
   '<div class="smv-hero-float-tag one"><b>✦</b><span>Curated venue discovery</span></div>'+
   '<div class="smv-hero-float-tag two"><b>⌖</b><span>Delhi · Gurugram</span></div>';
  orbit.replaceWith(visual);
 }
 function fixTrialCopy(){
  document.querySelectorAll(".smv-home-launch-strip b,.smv-launch-offer b").forEach(function(el){
   if(/10[\s-]*day/i.test(el.textContent))el.textContent="7-Day Complimentary Trial";
  });
  document.querySelectorAll(".smv-home-launch-strip,.smv-launch-offer").forEach(function(el){
   el.querySelectorAll("*").forEach(function(node){if(node.children.length===0&&/10[\s-]*day/i.test(node.textContent))node.textContent=node.textContent.replace(/10[\s-]*day/ig,"7-day");});
  });
 }
 function init(){
  var link=make("link");link.id="smvImmersiveLuxuryCss";link.rel="stylesheet";link.href="smv-immersive-luxury.css?v=20261116-1";document.head.appendChild(link);
  enhanceNavigation();enhanceHero();fixTrialCopy();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();