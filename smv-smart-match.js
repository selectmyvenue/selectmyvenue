(function () {
  "use strict";

  const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  function cleanMobile(value) {
    return String(value || "").replace(/\D/g, "").slice(-10);
  }

  function createPublicClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      return null;
    }

    return window.supabase.createClient(
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
  }

  ready(function () {
    const section = el("enquiry");
    const originalForm = el("customerEnquiryForm");

    if (!section || !originalForm || el("smvSmartMatch")) return;

    const style = document.createElement("style");
    style.id = "smvSmartMatchStyles";
    style.textContent = `
      #enquiry{
        position:relative;
        overflow:hidden;
        padding-top:46px!important;
        padding-bottom:58px!important;
        background:
          radial-gradient(circle at 10% 10%,rgba(25,216,189,.12),transparent 27%),
          radial-gradient(circle at 92% 8%,rgba(243,200,75,.07),transparent 22%),
          linear-gradient(180deg,#031817,#041f1d)!important;
      }

      #enquiry>.section-heading{display:none!important}

      #customerEnquiryForm{
        position:absolute!important;
        left:-10000px!important;
        width:1px!important;
        height:1px!important;
        overflow:hidden!important;
        opacity:0!important;
        pointer-events:none!important;
      }

      .smv-match{width:min(1080px,calc(100% - 30px));margin:0 auto;color:#f3fbfa}
      .smv-match-head{text-align:center;max-width:760px;margin:0 auto 20px}
      .smv-ai-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border:1px solid rgba(25,216,189,.4);border-radius:999px;background:rgba(25,216,189,.06);color:#2ce3ca;font-size:10px;font-weight:900;letter-spacing:.1em}
      .smv-ai-pill i{width:7px;height:7px;border-radius:50%;background:#19d8bd;box-shadow:0 0 14px #19d8bd;animation:smvPulse 1.5s infinite}
      .smv-match-head h2{margin:12px 0 8px;font-size:clamp(34px,4.7vw,56px);line-height:1.02;font-weight:1000;letter-spacing:-.04em}
      .smv-match-head h2 span{color:#19d8bd}
      .smv-match-head p{margin:0;color:#9fc5c0;font-size:14px;line-height:1.55}

      .smv-shell{border:1px solid rgba(25,216,189,.32);border-radius:26px;background:linear-gradient(145deg,rgba(7,45,41,.97),rgba(3,28,26,.99));box-shadow:0 26px 64px rgba(0,0,0,.27);overflow:hidden}
      .smv-top{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.07)}
      .smv-progress{height:5px;flex:1;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
      .smv-progress b{display:block;height:100%;width:20%;border-radius:99px;background:linear-gradient(90deg,#19d8bd,#f3c84b);transition:.3s ease}
      .smv-count{font-size:10px;font-weight:900;color:#82aaa5;letter-spacing:.08em;white-space:nowrap}

      .smv-body{min-height:340px;padding:30px 36px 26px}
      .smv-step{display:none;animation:smvIn .25s ease}
      .smv-step.active{display:block}
      .smv-q{margin-bottom:7px;color:#f3c84b;font-size:11px;font-weight:900;letter-spacing:.12em}
      .smv-step h3{margin:0 0 6px;font-size:clamp(25px,3vw,36px);font-weight:950;letter-spacing:-.025em}
      .smv-help{margin:0 0 21px;color:#83aaa5;font-size:12px}

      .smv-chips{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .smv-chip{appearance:none;min-height:66px;padding:11px 9px;border:1px solid rgba(255,255,255,.11);border-radius:15px;background:rgba(255,255,255,.025);color:#eaf8f6;font:inherit;font-size:12px;font-weight:850;cursor:pointer;transition:.18s ease}
      .smv-chip span{display:block;margin-bottom:4px;font-size:20px}
      .smv-chip:hover,.smv-chip.selected{transform:translateY(-2px);border-color:rgba(25,216,189,.62);background:rgba(25,216,189,.09);color:#fff;box-shadow:0 10px 24px rgba(0,0,0,.14)}
      .smv-chip.selected:after{content:" ✓";color:#19d8bd}
      .smv-city,.smv-budget{grid-template-columns:repeat(5,minmax(0,1fr))}

      .smv-input{box-sizing:border-box;width:100%;min-height:52px;padding:0 14px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:rgba(0,0,0,.16);color:#fff;font-size:14px;outline:none}
      .smv-input:focus{border-color:#19d8bd;box-shadow:0 0 0 3px rgba(25,216,189,.08)}
      .smv-custom{display:none;margin-top:12px}
      .smv-custom.show{display:block}

      .smv-nav{display:flex;align-items:center;justify-content:space-between;margin-top:22px}
      .smv-back{border:0;background:transparent;color:#7fa8a3;font-size:12px;font-weight:800;cursor:pointer;padding:9px}
      .smv-next{min-height:47px;padding:0 19px;border:0;border-radius:13px;background:linear-gradient(135deg,#20dcc3,#0fc8b0);color:#02211c;font-size:12px;font-weight:1000;cursor:pointer}
      .smv-next:disabled{opacity:.35;cursor:not-allowed}

      .smv-ready{display:grid;grid-template-columns:1fr 1fr;gap:20px}
      .smv-summary,.smv-contact{padding:21px;border-radius:18px}
      .smv-summary{border:1px solid rgba(25,216,189,.22);background:rgba(25,216,189,.045)}
      .smv-contact{border:1px solid rgba(243,200,75,.24);background:rgba(243,200,75,.035)}
      .smv-summary-badge{color:#19d8bd;font-size:10px;font-weight:950;letter-spacing:.11em}
      .smv-summary h3{margin:8px 0 12px;font-size:27px}
      .smv-tags{display:flex;flex-wrap:wrap;gap:7px}
      .smv-tags span{padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.055);color:#c5dcda;font-size:10px;font-weight:800}
      .smv-why{margin:15px 0 0;color:#8db4af;font-size:11px;line-height:1.55}
      .smv-contact h4{margin:0 0 5px;font-size:21px}
      .smv-contact>p{margin:0 0 14px;color:#90b4b0;font-size:11px}
      .smv-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .smv-optional{margin-top:10px}
      .smv-optional summary{cursor:pointer;color:#8fb8b3;font-size:10px;font-weight:800}
      .smv-opt-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
      .smv-submit{width:100%;min-height:53px;margin-top:11px;border:0;border-radius:13px;background:linear-gradient(135deg,#f3c84b,#e8b82f);color:#241b02;font-size:12px;font-weight:1000;cursor:pointer}
      .smv-submit:disabled{opacity:.55;cursor:wait}
      .smv-privacy{text-align:center;color:#688f8a;font-size:9px;margin-top:9px}
      .smv-status{min-height:18px;margin-top:10px;text-align:center;font-size:11px;font-weight:800}
      .smv-status.error{color:#ff9c9c}
      .smv-status.success{color:#55e3cf}

      @keyframes smvPulse{50%{opacity:.35;transform:scale(.72)}}
      @keyframes smvIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}

      @media(max-width:760px){
        #enquiry{padding-top:34px!important;padding-bottom:40px!important}
        .smv-match{width:min(100% - 18px,1080px)}
        .smv-match-head h2{font-size:36px}
        .smv-match-head p{font-size:12px;padding:0 6px}
        .smv-shell{border-radius:20px}
        .smv-top{padding:13px 14px}
        .smv-body{min-height:390px;padding:22px 14px 18px}
        .smv-step h3{font-size:26px}
        .smv-chips,.smv-city,.smv-budget{grid-template-columns:1fr 1fr;gap:8px}
        .smv-chip{min-height:62px;font-size:11px}
        .smv-ready{grid-template-columns:1fr}
        .smv-summary,.smv-contact{padding:16px}
        .smv-contact-grid,.smv-opt-grid{grid-template-columns:1fr}
      }

      @media(prefers-reduced-motion:reduce){.smv-ai-pill i,.smv-step{animation:none!important}}
    `;
    document.head.appendChild(style);

    const wrap = document.createElement("div");
    wrap.id = "smvSmartMatch";
    wrap.className = "smv-match";
    wrap.innerHTML = `
      <div class="smv-match-head">
        <div class="smv-ai-pill"><i></i> SMART VENUE MATCH</div>
        <h2>Find the right venue <span>for your event.</span></h2>
        <p>Choose a few details first. Add your name and mobile only when your venue requirement is ready.</p>
      </div>

      <div class="smv-shell">
        <div class="smv-top">
          <div class="smv-progress"><b id="smvBar"></b></div>
          <span class="smv-count" id="smvCount">1 OF 5</span>
        </div>

        <div class="smv-body">
          <div class="smv-step active" data-step="1">
            <div class="smv-q">01 · EVENT</div>
            <h3>What are you planning?</h3>
            <p class="smv-help">Start with your event — one tap is enough.</p>
            <div class="smv-chips" data-key="event">
              <button type="button" class="smv-chip" data-v="Wedding"><span>💍</span>Wedding</button>
              <button type="button" class="smv-chip" data-v="Engagement"><span>💞</span>Engagement</button>
              <button type="button" class="smv-chip" data-v="Birthday"><span>🎂</span>Birthday</button>
              <button type="button" class="smv-chip" data-v="Reception"><span>✨</span>Reception</button>
              <button type="button" class="smv-chip" data-v="Corporate Event"><span>🏢</span>Corporate</button>
              <button type="button" class="smv-chip" data-v="Party"><span>🎉</span>Party</button>
              <button type="button" class="smv-chip" data-v="Anniversary"><span>🥂</span>Anniversary</button>
              <button type="button" class="smv-chip" data-v="Other"><span>✦</span>Other</button>
            </div>
          </div>

          <div class="smv-step" data-step="2">
            <div class="smv-q">02 · LOCATION</div>
            <h3>Where do you need the venue?</h3>
            <p class="smv-help">Choose a city or enter your preferred area.</p>
            <div class="smv-chips smv-city" data-key="city">
              <button type="button" class="smv-chip" data-v="Delhi"><span>📍</span>Delhi</button>
              <button type="button" class="smv-chip" data-v="Gurgaon"><span>📍</span>Gurgaon</button>
              <button type="button" class="smv-chip" data-v="Noida"><span>📍</span>Noida</button>
              <button type="button" class="smv-chip" data-v="Faridabad"><span>📍</span>Faridabad</button>
              <button type="button" class="smv-chip" data-v="Other"><span>⌕</span>Other</button>
            </div>
            <div class="smv-custom" id="smvCustomCity">
              <input class="smv-input" id="smvCityText" placeholder="Type city / area">
            </div>
            <div class="smv-nav">
              <button type="button" class="smv-back" data-back>← Back</button>
              <button type="button" class="smv-next" data-next disabled>Continue →</button>
            </div>
          </div>

          <div class="smv-step" data-step="3">
            <div class="smv-q">03 · GUESTS</div>
            <h3>How many guests are expected?</h3>
            <p class="smv-help">An approximate number is completely fine.</p>
            <div class="smv-chips" data-key="guests">
              <button type="button" class="smv-chip" data-v="40"><span>👥</span>Under 50</button>
              <button type="button" class="smv-chip" data-v="75"><span>👥</span>50–100</button>
              <button type="button" class="smv-chip" data-v="175"><span>👥</span>100–250</button>
              <button type="button" class="smv-chip" data-v="375"><span>👥</span>250–500</button>
              <button type="button" class="smv-chip" data-v="600"><span>👥</span>500+</button>
            </div>
            <div class="smv-nav">
              <button type="button" class="smv-back" data-back>← Back</button>
              <button type="button" class="smv-next" data-next disabled>Continue →</button>
            </div>
          </div>

          <div class="smv-step" data-step="4">
            <div class="smv-q">04 · BUDGET</div>
            <h3>What budget range works per guest?</h3>
            <p class="smv-help">Choose the closest range. You can refine it later.</p>
            <div class="smv-chips smv-budget" data-key="budget">
              <button type="button" class="smv-chip" data-v="900"><span>₹</span>Under ₹1,000</button>
              <button type="button" class="smv-chip" data-v="1250"><span>₹</span>₹1,000–1,500</button>
              <button type="button" class="smv-chip" data-v="1750"><span>₹</span>₹1,500–2,000</button>
              <button type="button" class="smv-chip" data-v="2500"><span>₹</span>₹2,000–3,000</button>
              <button type="button" class="smv-chip" data-v="3500"><span>₹</span>₹3,000+</button>
            </div>
            <div class="smv-nav">
              <button type="button" class="smv-back" data-back>← Back</button>
              <button type="button" class="smv-next" data-next disabled>See My Match →</button>
            </div>
          </div>

          <div class="smv-step" data-step="5">
            <div class="smv-ready">
              <div class="smv-summary">
                <div class="smv-summary-badge">✦ YOUR VENUE REQUIREMENT</div>
                <h3 id="smvSummaryTitle">Your event</h3>
                <div class="smv-tags" id="smvTags"></div>
                <p class="smv-why">We’ll use these details to identify suitable venue options based on your event, location, guest count and budget.</p>
                <button type="button" class="smv-back" data-back style="padding-left:0">← Change choices</button>
              </div>

              <div class="smv-contact">
                <h4>Where should we send your matches?</h4>
                <p>Only your name and mobile are required.</p>
                <div class="smv-contact-grid">
                  <input class="smv-input" id="smvName" placeholder="Your name" autocomplete="name">
                  <input class="smv-input" id="smvMobile" inputmode="numeric" maxlength="10" placeholder="10-digit mobile" autocomplete="tel">
                </div>
                <details class="smv-optional">
                  <summary>+ Add optional event details</summary>
                  <div class="smv-opt-grid">
                    <input class="smv-input" id="smvDate" type="date" aria-label="Event date">
                    <select class="smv-input" id="smvFood" aria-label="Food preference">
                      <option value="">Food preference</option>
                      <option>Veg</option>
                      <option>Non-Veg</option>
                      <option>Both</option>
                      <option>Jain</option>
                    </select>
                  </div>
                </details>
                <button type="button" class="smv-submit" id="smvSubmit">SHOW ME SUITABLE VENUES →</button>
                <div class="smv-privacy">🔒 Your details are used only for your venue requirement.</div>
                <div class="smv-status" id="smvStatus"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    originalForm.parentNode.insertBefore(wrap, originalForm);

    const state = {
      event: "",
      city: "",
      guests: "",
      budget: ""
    };

    let step = 1;

    function currentCity() {
      if (state.city === "Other") {
        return (el("smvCityText").value || "").trim();
      }
      return state.city;
    }

    function showStep(nextStep) {
      step = nextStep;
      wrap.querySelectorAll(".smv-step").forEach(function (node) {
        node.classList.toggle("active", String(node.dataset.step) === String(step));
      });

      const numericStep = Number(step) || 1;
      el("smvBar").style.width = (Math.min(numericStep, 5) * 20) + "%";
      el("smvCount").textContent = numericStep + " OF 5";
    }

    function goNext() {
      if (step < 5) showStep(step + 1);
    }

    function goBack() {
      if (step > 1) showStep(step - 1);
    }

    function renderSummary() {
      const city = currentCity() || "Delhi NCR";
      el("smvSummaryTitle").textContent = (state.event || "Event") + " in " + city;
      el("smvTags").innerHTML = [
        state.event,
        city,
        state.guests + " guests",
        "₹" + Number(state.budget).toLocaleString("en-IN") + "/guest"
      ].filter(Boolean).map(function (value) {
        return "<span>" + escapeHtml(value) + "</span>";
      }).join("");
    }

    wrap.querySelectorAll(".smv-chip").forEach(function (button) {
      button.addEventListener("click", function () {
        const group = button.closest("[data-key]");
        const key = group.dataset.key;

        group.querySelectorAll(".smv-chip").forEach(function (item) {
          item.classList.remove("selected");
        });

        button.classList.add("selected");
        state[key] = button.dataset.v;

        const nextButton = button.closest(".smv-step").querySelector("[data-next]");
        if (nextButton) nextButton.disabled = false;

        if (key === "city") {
          const custom = el("smvCustomCity");
          custom.classList.toggle("show", state.city === "Other");
          if (state.city !== "Other") setTimeout(goNext, 160);
        } else if (key === "budget") {
          renderSummary();
          setTimeout(goNext, 160);
        } else {
          setTimeout(goNext, 160);
        }
      });
    });

    wrap.querySelectorAll("[data-next]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (step === 4) renderSummary();
        goNext();
      });
    });

    wrap.querySelectorAll("[data-back]").forEach(function (button) {
      button.addEventListener("click", goBack);
    });

    el("smvCityText").addEventListener("input", function () {
      const button = wrap.querySelector('[data-step="2"] [data-next]');
      button.disabled = !this.value.trim();
    });

    el("smvSubmit").addEventListener("click", async function () {
      const name = (el("smvName").value || "").trim();
      const mobile = cleanMobile(el("smvMobile").value);
      const city = currentCity();
      const status = el("smvStatus");
      const submitButton = el("smvSubmit");

      status.className = "smv-status";
      status.textContent = "";

      if (!name) {
        status.textContent = "Please enter your name.";
        status.classList.add("error");
        el("smvName").focus();
        return;
      }

      if (!/^[0-9]{10}$/.test(mobile)) {
        status.textContent = "Please enter a valid 10-digit mobile number.";
        status.classList.add("error");
        el("smvMobile").focus();
        return;
      }

      if (!state.event || !city || !state.guests || !state.budget) {
        status.textContent = "Please complete the event details first.";
        status.classList.add("error");
        return;
      }

      const client = createPublicClient();
      if (!client) {
        status.textContent = "Unable to connect right now. Please try again.";
        status.classList.add("error");
        return;
      }

      const eventDate = el("smvDate").value || null;
      const food = el("smvFood").value || null;
      const requirements = [
        "Smart Venue Match",
        "Event: " + state.event,
        "Location: " + city,
        "Guests: " + state.guests,
        "Budget per person: ₹" + Number(state.budget).toLocaleString("en-IN"),
        eventDate ? "Event date: " + eventDate : "",
        food ? "Food preference: " + food : ""
      ].filter(Boolean).join("\n");

      const payload = {
        customer_name: name,
        mobile: mobile,
        email: null,
        location: city,
        occasion: state.event,
        event_date: eventDate,
        guests: Number(state.guests),
        budget_per_person: Number(state.budget),
        food_preference: food,
        requirements: requirements,
        source: "Website - Smart Match",
        status: "new",
        assigned_to: null,
        follow_up_at: null,
        last_contacted_at: null
      };

      submitButton.disabled = true;
      submitButton.textContent = "SENDING YOUR REQUIREMENT…";
      status.textContent = "Saving your venue requirement…";
      status.classList.add("success");

      try {
        const result = await client
          .from("customer_enquiries")
          .insert(payload);

        if (result.error) throw result.error;

        status.textContent = "✓ Thank you! Your requirement is received. We’ll contact you with suitable venue options.";
        status.className = "smv-status success";
        submitButton.textContent = "REQUIREMENT SENT ✓";

        el("smvName").value = "";
        el("smvMobile").value = "";
      } catch (error) {
        console.error("Smart Match enquiry error:", error);
        status.textContent = "We couldn't submit your requirement. Please try again.";
        status.className = "smv-status error";
        submitButton.disabled = false;
        submitButton.textContent = "SHOW ME SUITABLE VENUES →";
      }
    });
  });
})();
