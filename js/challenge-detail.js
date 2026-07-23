// Get challenge id from the URL, e.g. challenge-detail.html?id=101
const urlParams = new URLSearchParams(window.location.search);
const challengeId = urlParams.get("id");

let currentChallenge = null;

async function loadChallenge() {
  if (!challengeId) {
    window.location.href = "challenges.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/challenges/${challengeId}`);
    currentChallenge = await res.json();

    document.getElementById("challenge-title").textContent = currentChallenge.title;
    document.getElementById("challenge-description").textContent = currentChallenge.description;
    document.getElementById("code-editor").value = currentChallenge.starterCode;

    document.getElementById("challenge-tags").innerHTML = `
      <span class="difficulty-badge ${currentChallenge.difficulty}">${currentChallenge.difficulty}</span>
      <span class="topic-tag">${currentChallenge.topic}</span>
    `;
  } catch (err) {
    console.error("Failed to load challenge. Is json-server running?", err);
  }
}

// Runs the user's code against the challenge's test cases
function runTests(userCode, testCases, functionName) {
  let fn;
  try {
    fn = new Function(`${userCode}; return ${functionName};`)();
  } catch (e) {
    return { syntaxError: e.message };
  }

  const results = [];
  testCases.forEach((tc, i) => {
    let actual;
    try {
      actual = fn(...tc.input);
    } catch (e) {
      actual = `Error: ${e.message}`;
    }
    results.push({
      index: i + 1,
      passed: actual === tc.expected,
      input: tc.input,
      expected: tc.expected,
      actual
    });
  });

  return { results };
}

function renderResults(outcome) {
  const panel = document.getElementById("results-panel");
  panel.innerHTML = "";

  if (outcome.syntaxError) {
    panel.innerHTML = `<div class="result-item fail">Syntax error: ${outcome.syntaxError}</div>`;
    return;
  }

  const allPassed = outcome.results.every((r) => r.passed);

  outcome.results.forEach((r) => {
    const div = document.createElement("div");
    div.className = `result-item ${r.passed ? "pass" : "fail"}`;
    div.textContent = r.passed
      ? `Test ${r.index}: Passed (input: ${JSON.stringify(r.input)})`
      : `Test ${r.index}: Failed — expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.actual)}`;
    panel.appendChild(div);
  });

  const summary = document.createElement("div");
  if (allPassed) {
    summary.className = "result-summary success";
    summary.textContent = "All tests passed! Updating your progress...";
    panel.appendChild(summary);
    handleSuccess();
  } else {
    summary.className = "result-summary failure";
    summary.textContent = "Some tests failed. Review the feedback above and try again.";
    panel.appendChild(summary);

    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-btn";
    retryBtn.textContent = "Try Again";
    retryBtn.addEventListener("click", () => {
      panel.innerHTML = "";
    });
    panel.appendChild(retryBtn);
  }
}

// Runs when all tests pass: records submission, updates points/badges
async function handleSuccess() {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  if (!session) return;

  const userCode = document.getElementById("code-editor").value;

  try {
    // Record the submission
    await fetch(`${API_BASE}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.id,
        challengeId: currentChallenge.id,
        code: userCode,
        passed: true,
        timestamp: new Date().toISOString()
      })
    });

    // Fetch current user to update points/badges/solvedChallenges
    const userRes = await fetch(`${API_BASE}/users/${session.id}`);
    const user = await userRes.json();

    const alreadySolved = (user.solvedChallenges || []).includes(currentChallenge.id);

    const updatedSolved = alreadySolved
      ? user.solvedChallenges
      : [...(user.solvedChallenges || []), currentChallenge.id];

    const updatedPoints = alreadySolved ? user.points : (user.points || 0) + 10;

    let updatedBadges = user.badges || [];
    let newBadgeEarned = false;

    if (
      !alreadySolved &&
      currentChallenge.badgeOnComplete &&
      !updatedBadges.includes(currentChallenge.badgeOnComplete)
    ) {
      updatedBadges = [...updatedBadges, currentChallenge.badgeOnComplete];
      newBadgeEarned = true;
    }

    await fetch(`${API_BASE}/users/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: updatedPoints,
        solvedChallenges: updatedSolved,
        badges: updatedBadges
      })
    });

    if (newBadgeEarned) {
      const summary = document.querySelector(".result-summary");
      if (summary) {
        summary.textContent = `All tests passed! Badge unlocked: "${currentChallenge.badgeOnComplete}"`;
      }
    }
  } catch (err) {
    console.error("Failed to update progress. Is json-server running?", err);
  }
}

// Wire up the Run Tests button
const runBtn = document.getElementById("run-tests-btn");
if (runBtn) {
  runBtn.addEventListener("click", () => {
    if (!currentChallenge) return;
    const userCode = document.getElementById("code-editor").value;
    const outcome = runTests(userCode, currentChallenge.testCases, currentChallenge.functionName);
    renderResults(outcome);
  });
}

// Only run on the challenge detail page
if (document.getElementById("code-editor")) {
  loadChallenge();
}