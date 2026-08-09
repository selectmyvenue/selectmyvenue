```javascript
/* =========================================================
   SELECT MY VENUE — CRM LOGIN
   Authentication Only
========================================================= */


/* =========================================================
   1. SUPABASE CONFIG
   ONLY PLACE WHERE URL + KEY ARE USED
========================================================= */

const SUPABASE_URL =
  "https://uajqwyoqbbswkfiwosyw.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_hfiuO4ZRn4VZmEkrN2RV-A_lZX_R3z7";


/* =========================================================
   2. SUPABASE CLIENT
========================================================= */

let supabaseClient = null;

if (
  window.supabase &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY
) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}


/* =========================================================
   3. LOGIN
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const loginForm =
    document.getElementById("loginForm");

  const loginMessage =
    document.getElementById("loginMessage");


  if (!loginForm) {
    return;
  }


  loginForm.addEventListener(
    "submit",
    async function (event) {

      /* VERY IMPORTANT:
         Prevent page refresh
      */
      event.preventDefault();


      const emailInput =
        document.getElementById("email");

      const passwordInput =
        document.getElementById("password");


      const email =
        emailInput.value.trim();

      const password =
        passwordInput.value;


      if (!email || !password) {

        showMessage(
          "Please enter your email and password.",
          true
        );

        return;
      }


      if (!supabaseClient) {

        showMessage(
          "CRM connection is not available. Please refresh the page.",
          true
        );

        return;
      }


      showMessage(
        "Signing in...",
        false
      );


      try {

        const result =
          await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

          });


        const data =
          result.data;

        const error =
          result.error;


        if (error) {

          console.error(
            "SUPABASE LOGIN ERROR:",
            error
          );

          showMessage(
            error.message ||
            "Login failed. Please check your email and password.",
            true
          );

          return;
        }


        if (!data || !data.session) {

          showMessage(
            "Login was not completed. Please try again.",
            true
          );

          return;
        }


        showMessage(
          "Login successful. Opening CRM...",
          false
        );


        /*
          Give Supabase a moment to save
          the authenticated session.
        */

        setTimeout(function () {

          window.location.href =
            "dashboard.html";

        }, 300);


      } catch (error) {

        console.error(
          "LOGIN EXCEPTION:",
          error
        );

        showMessage(
          error.message ||
          "Something went wrong during login.",
          true
        );

      }

    }
  );


  /* =======================================================
     MESSAGE DISPLAY
  ======================================================= */

  function showMessage(
    message,
    isError
  ) {

    if (!loginMessage) {
      return;
    }


    loginMessage.textContent =
      message;


    loginMessage.style.display =
      "block";


    loginMessage.style.visibility =
      "visible";


    loginMessage.style.opacity =
      "1";


    if (isError) {

      loginMessage.style.color =
        "#dc2626";

    } else {

      loginMessage.style.color =
        "#16a34a";

    }

  }

});
```
