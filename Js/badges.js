async function loadBadges() {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  if (!session) return; // dashboard.js already redirects to login in this case

  try {
    const [badgesRes, userRes, challengesRes] = await Promise.all([
      fetch(`${API_BASE}/badges`),
      fetch(`${API_BASE}/users/${session.id}`),
      fetch(`${API_BASE}/challenges`)
    ]);

    const allBadges = await badgesRes.json();
    const user = await userRes.json();
    const allChallenges = await challengesRes.json();

    renderBadges(allBadges, user, allChallenges);
  } catch (err) {
    console.error("Failed to load badges. Is json-server running?", err);
  }
}

function renderBadges(allBadges, user, allChallenges) {
  const grid = document.getElementById("badge-grid");
  grid.innerHTML = "";

  const earnedBadgeNames = user.badges || [];

  allBadges.forEach((badge) => {
    const isEarned = earnedBadgeNames.includes(badge.name);

    // Find which challenge unlocks this badge, to show a hint if locked
    const unlockChallenge = allChallenges.find((c) => c.badgeOnComplete === badge.name);
    const hintText = unlockChallenge ? `Solve "${unlockChallenge.title}" to unlock` : badge.description;

    const card = document.createElement("div");
    card.className = `badge-card ${isEarned ? "earned" : "locked"}`;
    card.innerHTML = `
      <div class="badge-icon">${badge.icon || "🏅"}</div>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-description">${isEarned ? badge.description : hintText}</div>
      <div class="badge-status">${isEarned ? "Earned" : "Locked"}</div>
    `;
    grid.appendChild(card);
  });
}

if (document.getElementById("badge-grid")) {
  loadBadges();
}