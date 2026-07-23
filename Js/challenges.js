let allChallenges = [];
let activeDifficulty = "All";
let activeTopic = "All";

async function loadChallenges() {
  try {
    const res = await fetch(`${API_BASE}/challenges`);
    allChallenges = await res.json();
    populateTopicDropdown(allChallenges);
    renderChallenges();
  } catch (err) {
    console.error("Failed to load challenges. Is json-server running?", err);
  }
}
// Build the topic dropdown options from whatever topics actually exist in the data
function populateTopicDropdown(challenges) {
  const dropdown = document.getElementById("topic-filter");
  const uniqueTopics = [...new Set(challenges.map((c) => c.topic))];

  uniqueTopics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    dropdown.appendChild(option);
  });
}

function renderChallenges() {
  const grid = document.getElementById("challenge-grid");
  const emptyMsg = document.getElementById("empty-msg");

  const filtered = allChallenges.filter((c) => {
    const matchesDifficulty = activeDifficulty === "All" || c.difficulty === activeDifficulty;
    const matchesTopic = activeTopic === "All" || c.topic === activeTopic;
    return matchesDifficulty && matchesTopic;
  });

  // Clear existing cards (but keep the empty message element)
  grid.querySelectorAll(".challenge-card").forEach((card) => card.remove());

  if (filtered.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

  filtered.forEach((challenge) => {
    const card = document.createElement("div");
    card.className = "challenge-card";
    card.innerHTML = `
      <h3>${challenge.title}</h3>
      <div class="card-tags">
        <span class="difficulty-badge ${challenge.difficulty}">${challenge.difficulty}</span>
        <span class="topic-tag">${challenge.topic}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `challenge-detail.html?id=${challenge.id}`;
    });
    grid.appendChild(card);
  });
}

// Difficulty pill clicks
document.querySelectorAll(".pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    activeDifficulty = pill.dataset.difficulty;
    renderChallenges();
  });
});

// Topic dropdown change
const topicFilterEl = document.getElementById("topic-filter");
if (topicFilterEl) {
  topicFilterEl.addEventListener("change", (e) => {
    activeTopic = e.target.value;
    renderChallenges();
  });
}

// Only run on the challenges page
if (document.getElementById("challenge-grid")) {
  loadChallenges();
}