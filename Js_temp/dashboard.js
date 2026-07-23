// Session guard: redirect to login if not logged in
const session = JSON.parse(localStorage.getItem("session") || "null");

if (!session) {
  window.location.href = "login.html";
} else {
  // Only run dashboard-specific code if we're actually on dashboard.html
  const usernameEl = document.getElementById("dash-username");
  if (usernameEl) {
    loadDashboardStats(session.id);
  }
}

async function loadDashboardStats(userId) {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}`);
    const user = await res.json();

    document.getElementById("dash-username").textContent = user.username;
    document.getElementById("stat-points").textContent = user.points || 0;
    document.getElementById("stat-badges").textContent = (user.badges || []).length;
    document.getElementById("stat-solved").textContent = (user.solvedChallenges || []).length;
  } catch (err) {
    console.error("Failed to load dashboard stats. Is json-server running?", err);
  }
}

// Logout
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("session");
    window.location.href = "index.html";
  });
}