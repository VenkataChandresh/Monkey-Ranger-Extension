// =============================================
// MONKEY RANGER — Popup Logic
// =============================================

// Global state — used by callGemini
let currentPanicScore = 0;
let currentUrgentName = "Unknown Assignment";

// =============================================
// INIT — runs when popup opens
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  const processed = processAssignments(fakeAssignments);
  const panicScore = getOverallPanicScore(fakeAssignments);
  const urgent = getUrgentAssignment(fakeAssignments);

  // Store globally for Gemini to use
  currentPanicScore = panicScore;
  currentUrgentName = urgent ? urgent.name : "No urgent assignments";

  renderPanicScore(panicScore);
  renderMonkeyMessage(processed);
  renderAssignments(processed);

  const ventBtn = document.getElementById("ventBtn");
  ventBtn.addEventListener("click", handleVent);
});

// =============================================
// RENDER PANIC SCORE
// =============================================
function renderPanicScore(score) {
  document.getElementById("panicScore").textContent = score;

  // Animate the bar
  setTimeout(() => {
    document.getElementById("panicFill").style.width = `${score}%`;
  }, 100);

  // Change badge color based on score
  const badge = document.getElementById("panicBadge");
  if (score >= 90) badge.style.borderColor = "#7c3aed";
  else if (score >= 70) badge.style.borderColor = "#f87171";
  else if (score >= 40) badge.style.borderColor = "#fb923c";
  else badge.style.borderColor = "#4ade80";
}

// =============================================
// RENDER MONKEY MESSAGE (most urgent assignment)
// =============================================
function renderMonkeyMessage(processed) {
  // Find the most urgent unsubmitted assignment
  const urgent = processed
    .filter((a) => !a.submitted)
    .sort((a, b) => b.threat.panicScore - a.threat.panicScore)[0];

  if (!urgent) {
    document.getElementById("monkeyMessage").textContent =
      "Monkey sees no unsubmitted assignments. Monkey is suspicious. Did you drop out?";
    return;
  }

  document.getElementById("monkeyMessage").textContent = urgent.monkeyMessage;
}

// =============================================
// RENDER ASSIGNMENTS LIST
// =============================================
function renderAssignments(processed) {
  const container = document.getElementById("assignmentsList");
  container.innerHTML = "";

  // Sort: overdue first, then by urgency
  const sorted = [...processed].sort(
    (a, b) => b.threat.panicScore - a.threat.panicScore,
  );

  sorted.forEach((a, index) => {
    const card = document.createElement("div");
    card.className = `assignment-card threat-${a.threat.level}`;
    card.style.animationDelay = `${index * 0.08}s`;
    card.title = a.monkeyMessage; // hover to see monkey message

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
// VENT BOX — Ask Monkey with Gemini API
// =============================================
async function handleVent() {
  const input = document.getElementById("ventInput").value.trim();
  const responseEl = document.getElementById("ventResponse");
  const btn = document.getElementById("ventBtn");

  if (!input) {
    responseEl.textContent =
      "Monkey needs you to actually type something first. 🐒";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Monkey is thinking... 🐒";
  responseEl.textContent = "";

  try {
    const message = await callGemini(input);
    responseEl.textContent = `🐒 ${message}`;
  } catch (err) {
    console.error("Popup Gemini error:", err);
    responseEl.textContent = `🐒 ERROR: ${err?.message || err}`;
  }

  btn.disabled = false;
  btn.textContent = "Ask Monkey 🐒";
}

// =============================================
// GEMINI API CALL
// =============================================
async function callGemini(userMessage) {
  const prompt = `
CONTEXT:
- Panic Score: ${currentPanicScore}%
- Most urgent assignment: "${currentUrgentName}"

USER MESSAGE: "${userMessage}"

STYLE:
You are an unhinged academic monkey auditor.
You exaggerate everything.
You speak like the world is ending academically.
Use phrases like:
- "you are COOKED"
- "academic obituary"
- "GPA filing for divorce"
- "banana brain crisis"
- "emotional damage in 5 minutes"

Make it dramatic, theatrical, and savage.
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
// FALLBACK RESPONSES (if API is down/key missing)
// =============================================
function getFallbackVentResponse(input) {
  const fallbacks = [
    "Wow. Incredible strategy. MonkeyRanger is speechless. Have you tried... starting?",
    "MonkeyRanger hears you. MonkeyRanger also hears the deadline laughing at you. Both are loud.",
    "That is genuinely the most student thing MonkeyRanger has ever heard. Close Reddit. NOW.",
    "MonkeyRanger processes your excuse. MonkeyRanger rejects your excuse. Open the document.",
    "You know what's funny? Your due date. You know what's not funny? Your due date.",
    "MonkeyRanger has forwarded your concern to your GPA. Your GPA is crying.",
    "Bold strategy. Let's see if it pays off. (It won't. Open your laptop.)",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
