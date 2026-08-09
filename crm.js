const SUPABASE_URL = "https://uajqwyoqbbswkfiwosyw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "Signing in...";
    loginMessage.style.display = "block";

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error("SUPABASE LOGIN ERROR:", error);
      loginMessage.textContent = "Login failed: " + error.message;
      return;
    }

    if (!data.session) {
      loginMessage.textContent = "Login failed. No session created.";
      return;
    }

    loginMessage.textContent = "Login successful. Opening CRM...";

    window.location.href = "dashboard.html";
  });
