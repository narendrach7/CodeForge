async function loadProgress() {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  if (!session) return; // dashboard.js already redirects to login in this case

  try {
    const [userRes, submissionsRes, challengesRes] = await Promise.all([
      fetch(`${API_BASE}/users/${session.id}`),
      fetch(`${API_BASE}/submissions?userId=${session.id}&passed=true`),
      fetch(`${API_BASE}/challenges`)
    ]);

    const user = await userRes.json();
    const submissions = await submissionsRes.json();
    const allChallenges = await challengesRes.json();

    renderProgressBar(user, allChallenges);
    renderSolvedList(user, submissions, allChallenges);
  } catch (err) {
    console.error("Failed to load progress. Is json-server running?", err);
  }
}

function renderProgressBar(user, allChallenges) {
  const solvedCount = (user.solvedChallenges || []).length;
  const totalCount = allChallenges.length;
  const percent = totalCount === 0 ? 0 : Math.round((solvedCount / totalCount) * 100);

  document.getElementById("progress-bar-fill").style.width = `${percent}%`;
  document.getElementById("progress-text").textContent =
    `${solvedCount} of ${totalCount} challenges solved (${percent}%)`;
}

function renderSolvedList(user, submissions, allChallenges) {
  const listEl = document.getElementById("solved-list");
  const emptyMsg = document.getElementById("empty-msg");

  const solvedIds = user.solvedChallenges || [];

  if (solvedIds.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

  // For each solved challenge, find its details and the earliest passing submission date
  solvedIds.forEach((challengeId) => {
    const challenge = allChallenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    const relatedSubmission = submissions.find((s) => s.challengeId === challengeId);
    const dateStr = relatedSubmission
      ? new Date(relatedSubmission.timestamp).toLocaleDateString()
      : "";

    const item = document.createElement("div");
    item.className = "solved-item";
    item.innerHTML = `
      <div class="solved-item-info">
        <h4>${challenge.title}</h4>
        <div class="solved-date">${dateStr}</div>
      </div>
      <span class="difficulty-badge ${challenge.difficulty}">${challenge.difficulty}</span>
    `;
    listEl.appendChild(item);
  });
}

if (document.getElementById("progress-bar-fill")) {
  loadProgress();
}