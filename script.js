/* =========================================================
   SELECT MY VENUE — COMPLETE WEBSITE JAVASCRIPT
   Compatible with the exact supplied index.html.

   Features:
   - Hero search
   - Popular event shortcuts
   - AI Event Planner
   - Match score
   - Budget estimator
   - Venue / food / theme / photography / entertainment recommendations
   - Lead intent + confidence
   - Planning timeline + countdown
   - Interactive checklist
   - Save / restore plan
   - Planner → enquiry autofill
   - Customer enquiry → Supabase
   - Mobile navigation
   - No HTML injection / no duplicate planner
   ========================================================= */

"use strict";

const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";
const SMV_AI_STORAGE_KEY = "smv_ai_event_plan_v2";

let supabaseClient = null;
let currentAIPlan = null;
let toastTimer = null;

try {
  if (window.supabase && typeof window.supabase.createClient === "function") {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.error("Supabase initialization error:", error);
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupHeroSearch();
  setupPopularEvents();
  setupAIPlanner();
  setupCustomerEnquiry();
  setupSmartFormEnhancements();
  restoreSavedAIPlan();
});

function $(id) { return document.getElementById(id); }
function getValue(id) { const el = $(id); return el ? String(el.value || "").trim() : ""; }
function setValue(id, value) { const el = $(id); if (el) el.value = value == null ? "" : value; }
function escapeHTML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
function formatIndianNumber(value) {
  const n = Math.round(Number(value) || 0);
  return n.toLocaleString("en-IN");
}
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function parseGuestNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const s = String(value || "").toLowerCase().replace(/,/g, "");
  const direct = Number(s);
  if (Number.isFinite(direct) && direct > 0) return direct;
  if (s.includes("500+")) return 500;
  if (s.includes("250")) return 250;
  if (s.includes("100")) return 100;
  if (s.includes("50")) return 50;
  return 0;
}
function parseBudget(value) {
  const n = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function normalizeEventType(value) { return String(value || "Event").trim() || "Event"; }
function showMessage(el, text, type) {
  if (!el) return;
  el.textContent = text || "";
  el.className = el.className.replace(/\b(success|error)\b/g, "").trim();
  if (type) el.classList.add(type);
}
function showToast(message) {
  const toast = $("toastMessage");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}
function setLoading(button, text) {
  if (!button) return;
  button.dataset.originalText = button.textContent;
  button.disabled = true;
  button.textContent = text;
}
function restoreButton(button) {
  if (!button) return;
  button.disabled = false;
  if (button.dataset.originalText) button.textContent = button.dataset.originalText;
}

/* ================= NAV ================= */
function setupMobileMenu() {
  const toggle = $("menuToggle");
  const nav = $("mainNav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

/* ================= HERO SEARCH ================= */
function setupHeroSearch() {
  const form = $("searchForm");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const eventType = getValue("eventType");
    const location = getValue("location");
    if (!eventType) { showMessage($("heroFormMessage"), "Please select your event type.", "error"); $("eventType")?.focus(); return; }
    if (!location) { showMessage($("heroFormMessage"), "Please enter your city or location.", "error"); $("location")?.focus(); return; }

    const plan = generateAIEventPlan({
      eventType, location,
      guests: parseGuestNumber(getValue("guests")),
      eventDate: getValue("date")
    });
    currentAIPlan = plan;
    saveAIPlan(plan);
    fillPlannerFromPlan(plan);
    renderAIPlan(plan);
    showMessage($("heroFormMessage"), "✓ Your smart event plan is ready below. Add your details and submit an enquiry to reach our team.", "success");
    scrollToElement("aiPlanner");
  });
}

/* ================= POPULAR EVENTS ================= */
function setupPopularEvents() {
  document.querySelectorAll("[data-event-shortcut]").forEach(card => {
    card.addEventListener("click", () => {
      const eventType = card.getAttribute("data-event-shortcut") || "Wedding";
      setValue("plannerEventType", eventType);
      setValue("customerEventType", eventType);
      scrollToElement("aiPlanner");
      const plan = generateAIEventPlan({ eventType, location: getValue("plannerLocation") || "", guests: getValue("plannerGuests"), eventDate: getValue("plannerDate"), budget: getValue("plannerBudget"), food: getValue("plannerFood") });
      currentAIPlan = plan;
      renderAIPlan(plan);
    });
  });
}

/* ================= AI PLANNER ================= */
function setupAIPlanner() {
  const generate = $("generateEventPlan");
  const save = $("saveEventPlan");
  const restore = $("restoreEventPlan");
  const toEnquiry = $("plannerToEnquiry");
  const refreshSummary = $("refreshPlannerSummary");

  generate?.addEventListener("click", () => {
    const plan = buildPlanFromPlannerFields();
    if (!plan.eventType) { showPlannerMessage("Select an event type first.", "error"); $("plannerEventType")?.focus(); return; }
    if (!plan.location) { showPlannerMessage("Enter your city / location so recommendations can be more useful.", "error"); $("plannerLocation")?.focus(); return; }
    currentAIPlan = plan;
    saveAIPlan(plan);
    renderAIPlan(plan);
    showPlannerMessage("✓ AI event plan generated. You can now save it or send it with your enquiry.", "success");
    scrollToElement("aiPlannerResults");
  });

  save?.addEventListener("click", () => {
    if (!currentAIPlan) {
      const plan = buildPlanFromPlannerFields();
      if (!plan.eventType) { showPlannerMessage("Generate a plan first.", "error"); return; }
      currentAIPlan = plan;
      renderAIPlan(plan);
    }
    saveAIPlan(currentAIPlan);
    showToast("✓ Your AI event plan has been saved on this device.");
  });

  restore?.addEventListener("click", () => {
    const saved = readSavedPlan();
    if (!saved) { showToast("No saved event plan was found on this device."); return; }
    currentAIPlan = saved;
    fillPlannerFromPlan(saved);
    renderAIPlan(saved);
    showPlannerMessage("✓ Saved plan restored.", "success");
    scrollToElement("aiPlanner");
  });

  toEnquiry?.addEventListener("click", () => {
    const plan = currentAIPlan || buildPlanFromPlannerFields();
    if (!plan.eventType) { showToast("Generate your event plan first."); return; }
    currentAIPlan = plan;
    saveAIPlan(plan);
    fillEnquiryFromPlan(plan);
    updatePlannerSummary(plan);
    scrollToElement("enquiry");
    setTimeout(() => $("customerName")?.focus(), 650);
  });

  refreshSummary?.addEventListener("click", () => {
    const plan = currentAIPlan || buildPlanFromPlannerFields();
    if (!plan.eventType) { showToast("Generate an AI plan first."); return; }
    currentAIPlan = plan;
    updatePlannerSummary(plan);
    showToast("✓ AI plan summary updated.");
  });
}

function buildPlanFromPlannerFields() {
  return generateAIEventPlan({
    eventType: getValue("plannerEventType"),
    location: getValue("plannerLocation"),
    eventDate: getValue("plannerDate"),
    guests: getValue("plannerGuests"),
    budget: getValue("plannerBudget"),
    food: getValue("plannerFood"),
    venueType: getValue("plannerVenueType"),
    style: getValue("plannerStyle"),
    other: getValue("plannerRequirements")
  });
}
function showPlannerMessage(text, type) { showMessage($("plannerMessage"), text, type); }

function fillPlannerFromPlan(plan) {
  if (!plan) return;
  setValue("plannerEventType", plan.eventType);
  setValue("plannerLocation", plan.location === "Your City" ? "" : plan.location);
  setValue("plannerDate", plan.eventDate);
  setValue("plannerGuests", plan.guests || "");
  setValue("plannerBudget", plan.budget || "");
  setValue("plannerFood", plan.food || "");
}

function renderAIPlan(plan) {
  if (!plan) return;
  currentAIPlan = plan;
  const score = $("eventMatchScore");
  if (score) score.textContent = `${plan.matchScore}%`;
  const badge = $("eventMatchBadge");
  if (badge) badge.textContent = plan.matchScore >= 85 ? "Excellent" : plan.matchScore >= 70 ? "Strong" : "Good";
  const label = $("eventMatchLabel");
  if (label) label.textContent = getMatchLabel(plan.matchScore);
  const reason = $("eventMatchReason");
  if (reason) reason.textContent = `${plan.eventType} in ${plan.location || "your city"}${plan.guests ? ` • ${plan.guests} guests` : ""}. Score improves as date, guest count and budget become clearer.`;

  const breakdown = plan.budgetPlan.breakdown;
  setText("budgetEstimate", `₹${formatIndianNumber(plan.budgetPlan.total)}`);
  setText("budgetRange", `Approx. ₹${formatIndianNumber(plan.budgetPlan.perGuest)} per guest • planning estimate`);
  setText("budgetFood", `₹${formatIndianNumber(breakdown.food)}`);
  setText("budgetVenue", `₹${formatIndianNumber(breakdown.venue)}`);
  setText("budgetOther", `₹${formatIndianNumber(breakdown.decor + breakdown.photography + breakdown.entertainment + breakdown.buffer)}`);

  setHTML("guestIntelligence", renderGuestIntelligence(plan));
  setHTML("venueRecommendations", renderRecommendationList(plan.venueTypes));
  setHTML("foodRecommendations", renderRecommendationList(plan.foodRecommendations));
  setHTML("themeRecommendations", renderRecommendationList(plan.theme));
  setHTML("photographyRecommendations", renderRecommendationList(plan.photography));
  setHTML("entertainmentRecommendations", renderRecommendationList(plan.entertainment));

  setText("leadQuality", getLeadQuality(plan));
  setText("planningStage", plan.intent === "HOT" ? "Ready to shortlist" : plan.intent === "WARM" ? "Actively planning" : "Early planning");
  setText("dateConfidence", plan.eventDate ? "High" : "To confirm");
  setText("budgetConfidence", plan.budget ? "High" : "Estimated");
  const intentBadge = $("leadIntentBadge"); if (intentBadge) intentBadge.textContent = plan.intent;

  renderTimeline(plan);
  renderChecklist(plan);
  updatePlannerSummary(plan);
}

function setText(id, value) { const el = $(id); if (el) el.textContent = value; }
function setHTML(id, html) { const el = $(id); if (el) el.innerHTML = html; }
function getMatchLabel(score) { if (score >= 90) return "Excellent event fit"; if (score >= 80) return "Strong event fit"; if (score >= 70) return "Good event fit"; return "Complete more details"; }
function getLeadQuality(plan) { if (plan.intent === "HOT") return "HIGH"; if (plan.intent === "WARM") return "MEDIUM-HIGH"; return "QUALIFIED"; }
function renderRecommendationList(items) { return (items || []).map((item, i) => `<span class="recommendation-item"><strong>${i + 1}</strong> ${escapeHTML(item)}</span>`).join("") || `<div class="recommendation-placeholder">Add more event details for recommendations.</div>`; }
function renderGuestIntelligence(plan) {
  const g = plan.guests;
  if (!g) return `<p>Add your guest count to receive planning insights.</p>`;
  const size = g >= 500 ? "Large-scale event" : g >= 250 ? "Large celebration" : g >= 100 ? "Medium event" : "Intimate gathering";
  const seating = g >= 300 ? "Choose a venue with flexible seating, parking and service access." : "Prioritize ambience, guest comfort and easy venue access.";
  return `<p><strong>${size}</strong> • ${g} guests.</p><p style="margin-top:6px">${seating}</p>`;
}

function renderTimeline(plan) {
  const box = $("planningTimeline");
  if (!box) return;
  box.innerHTML = plan.timeline.map((item, i) => `<div class="timeline-item"><div class="timeline-dot">${i + 1}</div><div><strong>${escapeHTML(item.period)}</strong><p>${escapeHTML(item.task)}</p></div></div>`).join("");
  const countdown = $("planningCountdown");
  if (countdown) countdown.textContent = plan.daysUntilEvent == null ? "Flexible" : plan.daysUntilEvent < 0 ? "Date passed" : `${plan.daysUntilEvent} days to go`;
}

function renderChecklist(plan) {
  const box = $("eventChecklist");
  if (!box) return;
  box.innerHTML = plan.checklist.map((item, i) => `<label><input type="checkbox" data-check-index="${i}"><span>${escapeHTML(item)}</span></label>`).join("");
  const savedChecks = plan.checkedItems || [];
  box.querySelectorAll("input").forEach(input => {
    const index = Number(input.dataset.checkIndex);
    input.checked = savedChecks.includes(index);
    input.addEventListener("change", () => updateChecklistProgress(plan));
  });
  updateChecklistProgress(plan);
}
function updateChecklistProgress(plan) {
  const box = $("eventChecklist"); if (!box) return;
  const inputs = [...box.querySelectorAll("input[type=checkbox]")];
  const checked = inputs.filter(i => i.checked).length;
  const pct = inputs.length ? Math.round(checked / inputs.length * 100) : 0;
  setText("checklistProgress", `${pct}%`);
  if (currentAIPlan) currentAIPlan.checkedItems = inputs.filter(i => i.checked).map(i => Number(i.dataset.checkIndex));
  saveAIPlan(currentAIPlan);
}

/* ================= PLAN LOGIC ================= */
function getEventCategory(eventType) {
  const value = String(eventType || "").toLowerCase();
  if (value.includes("wedding") || value.includes("marriage") || value.includes("shaadi")) return "wedding";
  if (value.includes("birthday")) return "birthday";
  if (value.includes("engagement") || value.includes("ring")) return "engagement";
  if (value.includes("corporate") || value.includes("conference") || value.includes("seminar") || value.includes("office")) return "corporate";
  if (value.includes("anniversary")) return "anniversary";
  if (value.includes("baby") || value.includes("shower")) return "baby";
  if (value.includes("kitty")) return "party";
  if (value.includes("party") || value.includes("celebration")) return "party";
  if (value.includes("reception")) return "reception";
  return "general";
}

function getVenueRecommendations(category, guests, selected) {
  if (selected) return [selected, ...getVenueRecommendations(category, guests)].filter((v,i,a) => a.indexOf(v) === i).slice(0,4);
  const large = guests >= 300, medium = guests >= 100;
  const map = {
    wedding: large ? ["Luxury Banquet","Wedding Lawn","Resort","5-Star Hotel"] : medium ? ["Banquet Hall","Wedding Lawn","Boutique Hotel","Resort"] : ["Banquet Hall","Boutique Venue","Restaurant","Private Lawn"],
    birthday: large ? ["Party Lawn","Banquet Hall","Resort","Club"] : ["Party Hall","Restaurant","Cafe","Private Venue"],
    corporate: ["Business Hotel","Conference Hall","Banquet Hall","Convention Centre"],
    engagement: ["Banquet Hall","Boutique Venue","Hotel","Lawn"],
    anniversary: ["Restaurant","Boutique Hotel","Private Dining","Rooftop Venue"],
    baby: ["Banquet Hall","Boutique Restaurant","Lawn","Community Hall"],
    party: ["Party Venue","Rooftop","Lounge","Banquet Hall"],
    reception: ["Luxury Banquet","Hotel","Wedding Lawn","Resort"],
    general: ["Banquet Hall","Hotel","Restaurant","Lawn"]
  };
  return map[category] || map.general;
}
function getThemeRecommendations(category, selected) {
  const map = {
    wedding:["Royal Elegant","Pastel Romance","Modern Luxury","Traditional Indian"],
    birthday:["Luxury Birthday","Neon Party","Bollywood","Elegant Dinner"],
    engagement:["Elegant Romance","Floral Luxury","Pastel Garden","Modern Minimal"],
    corporate:["Modern Professional","Executive Luxury","Tech & Innovation","Classic Corporate"],
    anniversary:["Romantic Dinner","Candlelight","Luxury Gold","Garden Romance"],
    baby:["Pastel Dreams","Floral Baby Shower","Cute & Elegant","Minimal Modern"],
    party:["Cocktail Night","Bollywood","Neon","Luxury Celebration"],
    reception:["Royal Reception","Modern Luxury","Floral Elegance","Classic Indian"],
    general:["Elegant Celebration","Modern Luxury","Classic Indian","Minimal Premium"]
  };
  const arr = map[category] || map.general;
  return selected ? [selected,...arr].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4) : arr;
}
function getFoodRecommendations(category, preference) {
  if (preference && preference !== "Not Specified") return [preference,"Live Food Counters","Welcome Drinks","Dessert Station"];
  if (category === "wedding") return ["Multi-Cuisine Buffet","Live Chaat Counter","North Indian","Dessert & Mithai Counter"];
  if (category === "corporate") return ["Executive Buffet","Tea & Coffee","Light Snacks","Working Lunch"];
  if (category === "birthday" || category === "party") return ["Multi-Cuisine Buffet","Live Counters","Mocktails","Dessert Station"];
  return ["Multi-Cuisine","Live Counters","Welcome Drinks","Desserts"];
}
function getPhotography(category) { if (category === "corporate") return ["Event Photography","Candid Highlights","Speaker / Stage Coverage"]; if (category === "wedding") return ["Candid Photography","Cinematic Video","Couple & Family Portraits"]; return ["Candid Coverage","Event Highlights","Group & Family Photos"]; }
function getEntertainment(category) { if (category === "corporate") return ["Professional AV","Anchor / Host","Background Music"]; if (category === "wedding") return ["DJ / Live Music","Dhol / Baraat","Stage Entertainment"]; if (category === "party" || category === "birthday") return ["DJ / Music","Games & Activities","Dance / Entertainment"]; return ["DJ / Music","Live Performance","Guest Activities"]; }
function getChecklist(category) {
  const common = ["Finalize event date","Set total budget","Shortlist venues","Compare venue packages","Confirm guest count","Finalize food menu","Confirm decoration","Book photographer","Confirm entertainment","Send invitations","Confirm final guest count","Create event-day schedule"];
  if (category === "wedding") return ["Finalize wedding date","Shortlist ceremony venue","Shortlist reception venue","Book photographer & videographer","Finalize decoration theme","Book caterer / food package","Book makeup artist","Book mehndi artist","Book DJ / music","Finalize invitations","Confirm guest accommodation","Plan transport","Confirm final guest list","Create wedding-day timeline"];
  if (category === "corporate") return ["Finalize event objective","Confirm attendee count","Book conference venue","Arrange AV equipment","Finalize catering","Confirm stage & branding","Arrange photography","Confirm host / anchor","Prepare presentation material","Send attendee communication","Confirm seating plan","Create event run sheet"];
  return common;
}
function getPlanningTimeline(eventDate) {
  if (!eventDate) return [{period:"ASAP",task:"Confirm date, budget and guest count."},{period:"NEXT",task:"Shortlist and compare venues."},{period:"AFTER VENUE",task:"Book major vendors."},{period:"FINAL WEEK",task:"Confirm guests, vendors and schedule."}];
  const date = new Date(`${eventDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return [];
  const today = new Date(); today.setHours(0,0,0,0);
  const days = Math.ceil((date - today) / 86400000);
  if (days <= 7) return [{period:"TODAY",task:"Confirm venue, guests and vendors."},{period:"48 HOURS",task:"Confirm menu, decoration and schedule."},{period:"EVENT DAY",task:"Execute the final event plan."}];
  if (days <= 30) return [{period:"THIS WEEK",task:"Finalize venue and major vendors."},{period:"NEXT 2 WEEKS",task:"Finalize food, decor, photography and entertainment."},{period:"FINAL WEEK",task:"Confirm guests, payments and schedule."}];
  if (days <= 90) return [{period:"NOW",task:"Finalize venue, budget and guest estimate."},{period:"30–60 DAYS",task:"Book vendors and finalize event style."},{period:"FINAL 30 DAYS",task:"Invitations, menu, decor and logistics."},{period:"FINAL WEEK",task:"Final confirmations and run sheet."}];
  return [{period:"NOW",task:"Define your event vision and budget."},{period:"NEXT 30 DAYS",task:"Shortlist venues and compare packages."},{period:"2–3 MONTHS",task:"Book important vendors."},{period:"FINAL MONTH",task:"Finalize guests, food, decor and schedule."}];
}
function calculateSmartBudget(category, guests, suppliedBudget) {
  const guestCount = guests || 100;
  const defaults = {wedding:1800,corporate:1200,birthday:900,engagement:1400,anniversary:1100,baby:1000,party:1000,reception:1600,general:1000};
  const perGuest = suppliedBudget > 0 ? suppliedBudget : (defaults[category] || 1000);
  const total = guestCount * perGuest;
  const venue = Math.round(total*.35), food = Math.round(total*.30), decor = Math.round(total*.12), photography = Math.round(total*.08), entertainment = Math.round(total*.06);
  const buffer = Math.max(0,total-venue-food-decor-photography-entertainment);
  return {perGuest,total,breakdown:{venue,food,decor,photography,entertainment,buffer}};
}
function calculateMatchScore(data) { let score=48; if(data.eventType)score+=12; if(data.location)score+=10; if(data.guests)score+=10; if(data.date)score+=10; if(data.budget)score+=10; if(data.food)score+=3; return Math.min(99,Math.max(45,score)); }
function calculateLeadIntent(data) { let score=0; if(data.eventType)score+=20;if(data.location)score+=20;if(data.guests)score+=15;if(data.date)score+=25;if(data.budget)score+=20; return score>=85?"HOT":score>=60?"WARM":"EARLY PLANNER"; }
function calculateLeadPriority(plan) { return plan.intent === "HOT" ? "high" : "normal"; }

function generateAIEventPlan(data={}) {
  const eventType = normalizeEventType(data.eventType);
  const location = data.location || "Your City";
  const guests = parseGuestNumber(data.guests);
  const budget = parseBudget(data.budget);
  const eventDate = data.eventDate || "";
  const food = data.food || "";
  const category = getEventCategory(eventType);
  const venueTypes = getVenueRecommendations(category, guests, data.venueType);
  const theme = getThemeRecommendations(category, data.style);
  const foodRecommendations = getFoodRecommendations(category, food);
  const photography = getPhotography(category);
  const entertainment = getEntertainment(category);
  const checklist = getChecklist(category);
  const timeline = getPlanningTimeline(eventDate);
  const budgetPlan = calculateSmartBudget(category, guests, budget);
  const matchScore = calculateMatchScore({eventType,location,guests,date:eventDate,budget,food});
  const intent = calculateLeadIntent({eventType,location,guests,date:eventDate,budget});
  let daysUntilEvent = null;
  if (eventDate) { const d = new Date(`${eventDate}T00:00:00`); if (!Number.isNaN(d.getTime())) { const t=new Date();t.setHours(0,0,0,0);daysUntilEvent=Math.ceil((d-t)/86400000); } }
  return {eventType,category,location,guests,eventDate,budget,food,venueType:data.venueType||"",style:data.style||"",other:data.other||"",matchScore,intent,venueTypes,theme,foodRecommendations,photography,entertainment,checklist,timeline,budgetPlan,daysUntilEvent,checkedItems:[],generatedAt:new Date().toISOString()};
}

/* ================= ENQUIRY ================= */
function setupCustomerEnquiry() {
  const form = $("customerEnquiryForm");
  if (!form) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const message = $("customerEnquiryMessage");
    const button = $("customerEnquirySubmit");
    showMessage(message,"","");

    const customerName=getValue("customerName"), customerMobile=getValue("customerMobile"), customerEmail=getValue("customerEmail"), customerLocation=getValue("customerLocation"), customerEventType=getValue("customerEventType"), customerEventDate=getValue("customerEventDate"), customerGuests=getValue("customerGuests"), customerBudget=getValue("customerBudget"), customerFood=getValue("customerFood"), customerRequirements=getValue("customerRequirements"), leadSource=getValue("leadSource")||"Website";
    if(!customerName){showMessage(message,"Please enter your name.","error");$("customerName")?.focus();return;}
    const cleanMobile=customerMobile.replace(/[^0-9]/g,"");
    if(!/^\d{10}$/.test(cleanMobile)){showMessage(message,"Please enter a valid 10-digit mobile number.","error");$("customerMobile")?.focus();return;}
    if(customerEmail && !isValidEmail(customerEmail)){showMessage(message,"Please enter a valid email address.","error");$("customerEmail")?.focus();return;}
    if(!customerLocation){showMessage(message,"Please enter your city or location.","error");$("customerLocation")?.focus();return;}
    if(!customerEventType){showMessage(message,"Please select your event type.","error");$("customerEventType")?.focus();return;}

    const plan=generateAIEventPlan({eventType:customerEventType,location:customerLocation,eventDate:customerEventDate,guests:customerGuests,budget:customerBudget,food:customerFood,other:customerRequirements});
    currentAIPlan=plan; saveAIPlan(plan); renderAIPlan(plan); updatePlannerSummary(plan);
    if(!supabaseClient){showMessage(message,"Your plan is ready, but the enquiry service could not connect to Supabase. Please try again shortly.","error");return;}

    setLoading(button,"Submitting Enquiry...");
    try {
      const {error}=await supabaseClient.from("customer_enquiries").insert({
        customer_name:customerName,mobile:cleanMobile,email:customerEmail||null,location:customerLocation,occasion:customerEventType,event_date:customerEventDate||null,guests:customerGuests?Number(customerGuests):null,budget_per_person:customerBudget?Number(customerBudget):null,food_preference:customerFood||null,requirements:buildFullAIRequirements(plan,customerRequirements),source:leadSource,status:"new",priority:calculateLeadPriority(plan),assigned_to:null,follow_up_at:null,internal_notes:`AI Planner Qualified Lead | Match Score: ${plan.matchScore}% | Intent: ${plan.intent}`,last_contacted_at:null
      });
      if(error) throw error;
      form.reset();
      showMessage(message,"✓ Enquiry submitted successfully. Our team will contact you with suitable venue options.","success");
      showToast("✓ Your enquiry has reached Select My Venue.");
      setTimeout(()=>scrollToElement("enquiry"),100);
    } catch(error) {
      console.error("CUSTOMER ENQUIRY ERROR",error);
      showMessage(message,friendlySupabaseError(error),"error");
    } finally { restoreButton(button); }
  });
}
function buildFullAIRequirements(plan, other) {
  const lines=["=== AI EVENT PLAN ===",`Event: ${plan.eventType}`,`Category: ${plan.category}`,`Location: ${plan.location}`];
  if(plan.guests)lines.push(`Guests: ${plan.guests}`); if(plan.eventDate)lines.push(`Event Date: ${plan.eventDate}`); if(plan.budget)lines.push(`Budget/Person: ₹${plan.budget}`); if(plan.food)lines.push(`Food: ${plan.food}`); lines.push(`AI Match Score: ${plan.matchScore}%`,`Lead Intent: ${plan.intent}`,`Suggested Venues: ${plan.venueTypes.join(", ")}`,`Suggested Themes: ${plan.theme.join(", ")}`,`Food Ideas: ${plan.foodRecommendations.join(", ")}`,`Photography: ${plan.photography.join(", ")}`,`Entertainment: ${plan.entertainment.join(", ")}`); if(other)lines.push("=== CUSTOMER REQUIREMENTS ===",other); return lines.join("\n");
}
function friendlySupabaseError(error) {
  const msg=String(error?.message||"");
  if(/row-level security|policy/i.test(msg)) return "The form reached the database, but Supabase security policy blocked the insert. Please check the public INSERT policy for customer_enquiries.";
  if(/column .* does not exist/i.test(msg)) return "The enquiry table is missing a field expected by the website. Please check the customer_enquiries columns.";
  return "We could not submit the enquiry right now. Please check your connection and try again.";
}

/* ================= SUMMARY / AUTOFILL ================= */
function fillEnquiryFromPlan(plan) {
  setValue("customerLocation", plan.location === "Your City" ? "" : plan.location);
  setValue("customerEventType", plan.eventType);
  setValue("customerEventDate", plan.eventDate);
  setValue("customerGuests", plan.guests || "");
  setValue("customerBudget", plan.budget || "");
  setValue("customerFood", plan.food || "");
  if (plan.other && !getValue("customerRequirements")) setValue("customerRequirements", plan.other);
}
function updatePlannerSummary(plan) {
  const box=$("plannerSummaryPreview"); if(!box || !plan || !plan.eventType){if(box)box.textContent="No AI event plan generated yet.";return;}
  box.textContent=[`Event: ${plan.eventType}`,`Location: ${plan.location}`,plan.guests?`Guests: ${plan.guests}`:null,plan.eventDate?`Date: ${plan.eventDate}`:null,`Budget estimate: ₹${formatIndianNumber(plan.budgetPlan.total)}`,`Match score: ${plan.matchScore}%`,`Lead intent: ${plan.intent}`,`Venue ideas: ${plan.venueTypes.join(", ")}`].filter(Boolean).join("\n");
}

/* ================= SAVE / RESTORE ================= */
function saveAIPlan(plan) { if(!plan)return; try{localStorage.setItem(SMV_AI_STORAGE_KEY,JSON.stringify(plan));}catch(e){console.warn("Could not save plan",e);} }
function readSavedPlan(){try{const raw=localStorage.getItem(SMV_AI_STORAGE_KEY);return raw?JSON.parse(raw):null;}catch(e){return null;}}
function restoreSavedAIPlan(){const plan=readSavedPlan();if(!plan?.eventType)return;currentAIPlan=plan;fillPlannerFromPlan(plan);renderAIPlan(plan);}

/* ================= FORM HELPERS ================= */
function setupSmartFormEnhancements(){
  const today=new Date().toISOString().split("T")[0];
  document.querySelectorAll('input[type="date"]').forEach(field=>field.setAttribute("min",today));
  document.querySelectorAll('input[type="tel"]').forEach(field=>{field.setAttribute("inputmode","numeric");field.setAttribute("maxlength","10");});
  ["plannerGuests","plannerBudget","customerGuests","customerBudget"].forEach(id=>$(id)?.addEventListener("input",()=>{if(currentAIPlan){} }));
}

/* ================= SCROLL ================= */
function scrollToElement(id){const el=$(id);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});}

/* ================= EXPORT FOR DEBUGGING ================= */
window.SMV = { generateAIEventPlan, renderAIPlan, getSavedPlan: readSavedPlan, getCurrentPlan: ()=>currentAIPlan };
