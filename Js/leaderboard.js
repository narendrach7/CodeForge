async function loadLeaderboard() {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  if (!session) return; // dashboard.js already redirects to login in this case

  try {
    const res = await fetch(`${API_BASE}/users?_sort=points&_order=desc`);
    const users = await res.json();

    renderLeaderboard(users, session.id);
  } catch (err) {
    console.error("Failed to load leaderboard. Is json-server running?", err);
  }
}

function renderLeaderboard(users, currentUserId) {
  const body = document.getElementById("leaderboard-body");
  body.innerHTML = "";

  if (users.length === 0) {
    body.innerHTML = `<tr><td colspan="4">No users yet.</td></tr>`;
    return;
  }

  users.forEach((user, index) => {
    const row = document.createElement("tr");
    if (user.id === currentUserId) {
      row.classList.add("current-user");
    }

    row.innerHTML = `
      <td class="rank-cell">#${index + 1}</td>
      <td>${user.username}</td>
      <td>${user.points || 0}</td>
      <td>${(user.badges || []).length}</td>
    `;
    body.appendChild(row);
  });
}

if (document.getElementById("leaderboard-body")) {
  loadLeaderboard();
}