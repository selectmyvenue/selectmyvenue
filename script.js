const WHATSAPP_NUMBER = ""; // Put your WhatsApp number here, e.g. "919876543210" (country code, no + or spaces).

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
if (menuToggle) {
  menuToggle.addEventListener("click", () => mainNav.classList.toggle("open"));
}
document.querySelectorAll("#mainNav a").forEach(a => {
  a.addEventListener("click", () => mainNav.classList.remove("open"));
});

const modal = document.getElementById("enquiryModal");
const modalClose = document.getElementById("modalClose");
const customerForm = document.getElementById("customerForm");
const searchForm = document.getElementById("venueSearch");

function openModal() {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("customerName").focus();
}
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

searchForm.addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(searchForm);
  const summary = `Location: ${data.get("location")}\nEvent: ${data.get("eventType")}\nGuests: ${data.get("guests")}\nBudget: ${data.get("budget")}`;
  document.getElementById("searchSummary").value = summary;
  openModal();
});

function sendToWhatsApp(title, fields) {
  if (!WHATSAPP_NUMBER) {
    alert("The form is working, but WhatsApp is not connected yet. Open script.js and add your WhatsApp number in WHATSAPP_NUMBER.");
    return false;
  }
  const message = `*${title}*\n\n${fields.join("\n")}`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
  return true;
}

customerForm.addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(customerForm);
  sendToWhatsApp("New Customer Venue Enquiry", [
    `Name: ${data.get("customerName")}`,
    `Mobile: ${data.get("customerPhone")}`,
    `Event date: ${data.get("customerDate") || "Not provided"}`,
    `Search details:\n${data.get("searchSummary")}`,
    `Requirements: ${data.get("customerRequirements") || "None"}`
  ]);
  if (WHATSAPP_NUMBER) {
    customerForm.reset();
    closeModal();
  }
});

document.getElementById("venueOwnerForm").addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  sendToWhatsApp("New Venue Registration — Select My Venue", [
    `Owner/Manager: ${data.get("ownerName")}`,
    `Venue: ${data.get("venueName")}`,
    `WhatsApp: ${data.get("ownerPhone")}`,
    `City/Location: ${data.get("venueCity")}`,
    `Venue type: ${data.get("venueType")}`,
    `Capacity: ${data.get("capacity")}`,
    `Starting price: ${data.get("venuePrice") || "Not provided"}`,
    `Google Maps: ${data.get("venueMap") || "Not provided"}`,
    `Facilities: ${data.get("venueFacilities") || "Not provided"}`
  ]);
  if (WHATSAPP_NUMBER) e.currentTarget.reset();
});
