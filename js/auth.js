const API_BASE = "https://codeforge-rwoy.onrender.com";

// Helper: show an error message in the #error-msg element on the page
function showError(message) {
  const errorEl = document.getElementById("error-msg");
  if (errorEl) errorEl.textContent = message;
}

// Helper: save session info so other pages know who's logged in
function saveSession(user) {
  localStorage.setItem("session", JSON.stringify({ id: user.id, username: user.username }));
}

// ---------------------------
// SHOW/HIDE PASSWORD TOGGLE
// ---------------------------
document.querySelectorAll(".toggle-password").forEach((toggleIcon) => {
  toggleIcon.addEventListener("click", () => {
    const targetInput = document.getElementById(toggleIcon.dataset.target);
    if (!targetInput) return;

    const isHidden = targetInput.type === "password";
    targetInput.type = isHidden ? "text" : "password";
    toggleIcon.textContent = isHidden ? "🙈" : "👁️";
  });
});

// ---------------------------
// REGISTER FORM
// ---------------------------
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !email || !password) {
      showError("Please fill out all fields.");
      return;
    }

    try {
      // Check if email already exists
      const existingRes = await fetch(`${API_BASE}/users?email=${encodeURIComponent(email)}`);
      const existingUsers = await existingRes.json();

      if (existingUsers.length > 0) {
        showError("An account with this email already exists.");
        return;
      }

      // Create the new user
      const newUser = {
        username,
        email,
        password,
        authProvider: "email",
        emailVerified: false,
        points: 0,
        badges: [],
        solvedChallenges: []
      };

      const createRes = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      const createdUser = await createRes.json();

      // Store id so verify-email.html knows which user to verify
      localStorage.setItem("pendingVerificationUserId", createdUser.id);

      window.location.href = "verify-email.html";
    } catch (err) {
      showError("Something went wrong. Is json-server running?");
    }
  });
}

// ---------------------------
// LOGIN FORM
// ---------------------------
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const res = await fetch(`${API_BASE}/users?email=${encodeURIComponent(email)}`);
      const users = await res.json();

      if (users.length === 0 || users[0].password !== password) {
        showError("Incorrect email or password.");
        return;
      }

      saveSession(users[0]);
      window.location.href = "dashboard.html";
    } catch (err) {
      showError("Something went wrong. Is json-server running?");
    }
  });
}

// ---------------------------
// MOCKED GOOGLE SIGN-IN (register page)
// ---------------------------
const googleSignup = document.getElementById("google-signup");
if (googleSignup) {
  googleSignup.addEventListener("click", async () => {
    const confirmed = confirm("Continue as demo@gmail.com?");
    if (!confirmed) return;

    try {
      const existingRes = await fetch(`${API_BASE}/users?email=demo@gmail.com`);
      const existingUsers = await existingRes.json();

      let user;
      if (existingUsers.length > 0) {
        user = existingUsers[0];
      } else {
        const newUser = {
          username: "demo_google_user",
          email: "demo@gmail.com",
          password: "",
          authProvider: "google",
          emailVerified: true,
          points: 0,
          badges: [],
          solvedChallenges: []
        };
        const createRes = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUser)
        });
        user = await createRes.json();
      }

      saveSession(user);
      window.location.href = "dashboard.html"; // Google path skips email verification
    } catch (err) {
      showError("Something went wrong. Is json-server running?");
    }
  });
}

// ---------------------------
// MOCKED GOOGLE SIGN-IN (login page)
// ---------------------------
const googleLogin = document.getElementById("google-login");
if (googleLogin) {
  googleLogin.addEventListener("click", async () => {
    const confirmed = confirm("Continue as demo@gmail.com?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/users?email=demo@gmail.com`);
      const users = await res.json();

      if (users.length === 0) {
        showError("No Google account found. Try signing up first.");
        return;
      }

      saveSession(users[0]);
      window.location.href = "dashboard.html";
    } catch (err) {
      showError("Something went wrong. Is json-server running?");
    }
  });
}

// ---------------------------
// EMAIL VERIFICATION
// ---------------------------
const verifyForm = document.getElementById("verify-form");
if (verifyForm) {
  const pendingUserId = localStorage.getItem("pendingVerificationUserId");

  // Guard: if someone lands here without an in-progress registration, send them back
  if (!pendingUserId) {
    window.location.href = "register.html";
  } else {
    // Generate a fake 6-digit code and display it on screen
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById("demo-code").textContent = `Your code: ${generatedCode}`;

    verifyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showError("");

      const enteredCode = document.getElementById("code").value.trim();

      if (enteredCode !== generatedCode) {
        showError("Incorrect code. Please try again.");
        return;
      }

      try {
        // Mark user as verified
        await fetch(`${API_BASE}/users/${pendingUserId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailVerified: true })
        });

        // Fetch the full user so we can save their session
        const userRes = await fetch(`${API_BASE}/users/${pendingUserId}`);
        const user = await userRes.json();

        saveSession(user);
        localStorage.removeItem("pendingVerificationUserId");

        window.location.href = "dashboard.html";
      } catch (err) {
        showError("Something went wrong. Is json-server running?");
      }
    });
  }
}

// ---------------------------
// FORGOT PASSWORD
// ---------------------------
let resetUserId = null;
let resetCode = null;

const forgotEmailForm = document.getElementById("forgot-email-form");
if (forgotEmailForm) {
  forgotEmailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");

    const email = document.getElementById("forgot-email").value.trim();

    try {
      const res = await fetch(`${API_BASE}/users?email=${encodeURIComponent(email)}`);
      const users = await res.json();

      if (users.length === 0) {
        showError("No account found with that email.");
        return;
      }

      resetUserId = users[0].id;
      resetCode = String(Math.floor(100000 + Math.random() * 900000));

      document.getElementById("demo-code").textContent = `Your reset code: ${resetCode}`;
      document.getElementById("reset-section").style.display = "block";
      forgotEmailForm.querySelector("button").disabled = true;
      document.getElementById("forgot-email").disabled = true;
    } catch (err) {
      showError("Something went wrong. Is json-server running?");
    }
  });
}

const resetForm = document.getElementById("reset-form");
if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");

    const enteredCode = document.getElementById("reset-code").value.trim();
    const newPassword = document.getElementById("new-password").value;

    if (enteredCode !== resetCode) {
      showError("Incorrect reset code.");
      return;
    }

    if (!newPassword) {
      showError("Please enter a new password.");
      return;
    }

    try {
      await fetch(`${API_BASE}/users/${resetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });

      alert("Password reset successfully. Please log in with your new password.");
      window.location.href = "login.html";
    } catch (err) {
      showError("Something went wrong. Is json-server running?");
    }
  });
}