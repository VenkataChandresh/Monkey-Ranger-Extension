// =============================================
// MONKEY RANGER — Popup Logic (Final Clean Version)
// =============================================

// Global state — used by Gemini
let currentPanicScore = 0;
let currentUrgentName = "Unknown Assignment";

// =============================================
// INIT — Runs when popup opens
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  const processed = processAssignments(fakeAssignments);
  const panicScore = getOverallPanicScore(fakeAssignments);
  const urgent = getUrgentAssignment(fakeAssignments);

  currentPanicScore = panicScore;
  currentUrgentName = urgent ? urgent.name : "No urgent assignments";

  renderPanicScore(panicScore);
  renderMonkeyMessage(processed);
  renderAssignments(processed);
  renderOverviewStats(fakeAssignments, processed);

  const ventBtn = document.getElementById("ventBtn");
  ventBtn.addEventListener("click", handleVent);
});

// =============================================
// RENDER PANIC SCORE
// =============================================
function renderPanicScore(score) {
  document.getElementById("panicScore").textContent = score;

  setTimeout(() => {
    document.getElementById("panicFill").style.width = `${score}%`;
  }, 100);

  const badge = document.getElementById("panicBadge");
  const dot = document.getElementById("panicDot");

  if (score >= 90) {
    badge.style.borderColor = "#a855f7";
    dot.style.background = "#a855f7";
  } else if (score >= 70) {
    badge.style.borderColor = "#f04545";
    dot.style.background = "#f04545";
  } else if (score >= 40) {
    badge.style.borderColor = "#f07d3a";
    dot.style.background = "#f07d3a";
  } else {
    badge.style.borderColor = "#34d771";
    dot.style.background = "#34d771";
  }
}

// =============================================
// RENDER OVERVIEW (Active + Next Due Only)
// =============================================
function renderOverviewStats(assignments, processed) {
  const assignmentCountEl = document.getElementById("assignmentCount");
  const nextDueEl = document.getElementById("nextDue");
  const listCountEl = document.getElementById("listCount");

  const now = new Date();
  const unsubmitted = assignments.filter((a) => !a.submitted);

  const upcoming = unsubmitted
    .filter((a) => new Date(a.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Active assignments
  assignmentCountEl.textContent = unsubmitted.length;

  // Next Due
  if (upcoming.length > 0) {
    nextDueEl.textContent = formatTimeLeft(upcoming[0].dueDate);
  } else if (unsubmitted.length > 0) {
    nextDueEl.textContent = "OVERDUE";
  } else {
    nextDueEl.textContent = "None";
  }

  // List count
  listCountEl.textContent = processed.length;
}

// =============================================
// RENDER MONKEY MESSAGE
// =============================================
function renderMonkeyMessage(processed) {
  const urgent = processed
    .filter((a) => !a.submitted)
    .sort((a, b) => b.threat.panicScore - a.threat.panicScore)[0];

  if (!urgent) {
    document.getElementById("monkeyMessage").textContent =
      "Monkahh sees no unsubmitted assignments. Suspicious productivity detected.";
    return;
  }

  document.getElementById("monkeyMessage").textContent = urgent.monkeyMessage;
}

// =============================================
// RENDER ASSIGNMENTS
// =============================================
function renderAssignments(processed) {
  const container = document.getElementById("assignmentsList");
  container.innerHTML = "";

  const sorted = [...processed].sort(
    (a, b) => b.threat.panicScore - a.threat.panicScore,
  );

  sorted.forEach((a, index) => {
    const card = document.createElement("div");
    card.className = `assignment-card threat-${a.threat.level}`;
    card.style.animationDelay = `${index * 0.05}s`;
    card.title = a.monkeyMessage;

    card.innerHTML = `
      <span class="threat-emoji">${a.threat.emoji}</span>
      <div class="assignment-info">
        <div class="assignment-name">${a.name}</div>
        <div class="assignment-course">${a.course}</div>
      </div>
      <div class="assignment-meta">
        <div class="time-left">${a.timeLeft}</div>
        <div class="threat-label">${a.threat.label}</div>
      </div>
    `;

    container.appendChild(card);
  });
}

// =============================================
// VENT — Gemini
// =============================================
async function handleVent() {
  const input = document.getElementById("ventInput").value.trim();
  const responseEl = document.getElementById("ventResponse");
  const btn = document.getElementById("ventBtn");

  if (!input) {
    responseEl.textContent = "Monkahh requires words. Not vibes.";
    return;
  }

  btn.disabled = true;
  btn.innerHTML = "Thinking… 🐒";
  responseEl.textContent = "";

  try {
    const message = await callGemini(input);
    responseEl.textContent = `🐒 ${message}`;
  } catch (err) {
    console.error("Gemini error:", err);
    responseEl.textContent = `🐒 ${getFallbackVentResponse(input)}`;
  }

  btn.disabled = false;
  btn.innerHTML = `
    <span>Send</span>
    <span class="btn-icon">→</span>
  `;
}

// =============================================
// GEMINI CALL
// =============================================
async function callGemini(userMessage) {
  const prompt = `
CONTEXT:
- Panic Score: ${currentPanicScore}%
- Most urgent assignment: "${currentUrgentName}"

USER MESSAGE: "${userMessage}"

STYLE:
You are an unhinged academic monkey auditor.
Be dramatic. Exaggerate.
Use phrases like:
- "you are COOKED"
- "academic obituary"
- "GPA filing for divorce"
- "banana brain crisis"
- "emotional damage in 5 minutes"

DO NOT suggest self-harm.
Respond in 2-3 chaotic sentences.
End with a new line containing exactly: <END>
`;

  const res = await chrome.runtime.sendMessage({
    type: "GEMINI_CHAT",
    prompt,
  });

  if (!res?.ok) throw new Error(res?.error || "Gemini failed");

  return res.text;
}

// =============================================
// FALLBACK RESPONSES
// =============================================
function getFallbackVentResponse() {
  const fallbacks = [
    "You are COOKED. Academically flambéed.",
    "Monkahh detects GPA turbulence.",
    "This is giving academic obituary vibes.",
    "Your deadline is smiling. That is not good.",
    "Banana brain crisis detected. Open the document.",
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
