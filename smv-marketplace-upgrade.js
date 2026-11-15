(function(){
  "use strict";
  if(document.getElementById("smvMarketplaceUpgrade"))return;
  const enquiry=document.getElementById("enquiry");
  const featured=document.getElementById("featuredVenues");
  if(!enquiry||!featured)return;
  const css=document.createElement("link");
  css.rel="stylesheet";css.href="smv-marketplace-upgrade.css?v=20261116-premium-1";
  document.head.appendChild(css);
  const section=document.createElement("section");
  section.id="smvMarketplaceUpgrade";
  section.innerHTML=`
    <section class="smv-difference" aria-labelledby="smvDifferenceTitle">
      <div class="smv-difference-inner">
        <span class="smv-section-eyebrow">THE SELECT MY VENUE DIFFERENCE</span>
        <div class="smv-difference-heading">
          <h2 id="smvDifferenceTitle">A better way to find a venue. <span>A more confident way to plan.</span></h2>
          <p>Not just a list of places. Share what matters for your celebration, explore published venue details and get thoughtful support from the SMV team as you move towards a site visit.</p>
        </div>
        <div class="smv-difference-grid">
          <article class="smv-difference-card"><span class="smv-difference-icon" aria-hidden="true">⌕</span><h3>Search around your event</h3><p>Start with your occasion, city, locality, guest count and budget—not endless scrolling through unrelated listings.</p></article>
          <article class="smv-difference-card"><span class="smv-difference-icon" aria-hidden="true">✦</span><h3>Understand your matches</h3><p>Explore venue options with clear reasons, published details and honest notes wherever information needs confirmation.</p></article>
          <article class="smv-difference-card"><span class="smv-difference-icon" aria-hidden="true">◇</span><h3>Compare with clarity</h3><p>Shortlist and compare up to three venues using available details such as location, capacity, price guidance and facilities.</p></article>
          <article class="smv-difference-card"><span class="smv-difference-icon" aria-hidden="true">♡</span><h3>Real people, helpful support</h3><p>Our team can help clarify requirements, coordinate follow-up and guide you towards venue conversations and site visits.</p></article>
        </div>
        <nav class="smv-discovery-links" aria-label="Popular venue discovery pages">
          <a href="wedding-venues-in-delhi.html">Wedding venues in Delhi</a>
          <a href="wedding-venues-in-gurgaon.html">Wedding venues in Gurgaon</a>
          <a href="banquet-halls-in-delhi.html">Banquet halls in Delhi</a>
          <a href="banquet-halls-in-gurgaon.html">Banquet halls in Gurgaon</a>
          <a href="venues-for-birthday-delhi-ncr.html">Birthday venues</a>
          <a href="venues-for-corporate-delhi-ncr.html">Corporate venues</a>
        </nav>
      </div>
    </section>
    <section class="smv-owner-showcase" aria-labelledby="smvOwnerTitle">
      <div class="smv-owner-inner">
        <div class="smv-owner-copy">
          <span class="smv-section-eyebrow">FOR VENUE OWNERS & HOSPITALITY PARTNERS</span>
          <h2 id="smvOwnerTitle">Your venue deserves more than just an online listing.</h2>
          <p>Showcase your space to people actively exploring venues for weddings, celebrations and corporate events. SMV is building a discovery and enquiry platform designed to help the right customers find the right venue.</p>
          <div class="smv-owner-benefits">
            <div class="smv-owner-benefit"><b>01</b><span>Present your venue with photos, facilities and useful profile details.</span></div>
            <div class="smv-owner-benefit"><b>02</b><span>Receive relevant customer enquiries through the SMV team.</span></div>
            <div class="smv-owner-benefit"><b>03</b><span>Access your partner workspace for assigned enquiry follow-up.</span></div>
            <div class="smv-owner-benefit"><b>04</b><span>Improve your profile as your venue information and offerings grow.</span></div>
          </div>
          <div class="smv-owner-actions"><a class="smv-owner-primary" href="list-your-venue.html">Showcase Your Venue <span aria-hidden="true">→</span></a><a class="smv-owner-secondary" href="tel:+918368322256">Talk to our team</a></div>
          <p class="smv-owner-note">No guaranteed-lead or booking claims. Enquiry quality and volume depend on customer demand, venue fit and profile information.</p>
        </div>
        <aside class="smv-owner-panel">
          <span class="smv-owner-panel-label">A clearer partner journey</span>
          <h3>From venue profile to customer conversation</h3>
          <div class="smv-owner-journey">
            <div class="smv-owner-step"><span class="smv-owner-step-number">1</span><div><strong>Introduce your venue</strong><span>Share the basics and let our team understand your space.</span></div></div>
            <div class="smv-owner-step"><span class="smv-owner-step-number">2</span><div><strong>Build a useful profile</strong><span>Add genuine photos, capacity, pricing guidance and facilities.</span></div></div>
            <div class="smv-owner-step"><span class="smv-owner-step-number">3</span><div><strong>Get discovered</strong><span>Customers can explore eligible public venue information on SMV.</span></div></div>
            <div class="smv-owner-step"><span class="smv-owner-step-number">4</span><div><strong>Manage assigned enquiries</strong><span>Follow up on customer enquiries shared with your venue.</span></div></div>
          </div>
        </aside>
      </div>
    </section>
    <section class="smv-home-faq" aria-labelledby="smvHomeFaqTitle">
      <div class="smv-home-faq-inner">
        <span class="smv-section-eyebrow">HELPFUL ANSWERS</span><h2 id="smvHomeFaqTitle">A little more clarity before you begin.</h2>
        <details><summary>How does Select My Venue help me find a venue?</summary><p>Share your event type, city, preferred area, guest count and budget. Explore public venue listings and use the enquiry form when you would like the SMV team to help with your requirement.</p></details>
        <details><summary>Are venue prices and availability guaranteed?</summary><p>No. Prices, packages, facilities and event-date availability must be confirmed directly with the venue. SMV displays the information currently supplied in eligible public listings.</p></details>
        <details><summary>Can I compare more than one venue?</summary><p>The venue directory supports shortlisting and comparing up to three venues using available listing information.</p></details>
        <details><summary>How can a venue owner join Select My Venue?</summary><p>Use the List Your Venue page to share your venue details. The SMV team can guide you through the listing and partner onboarding process.</p></details>
      </div>
    </section>`;
  enquiry.parentNode.insertBefore(section,enquiry);
})();