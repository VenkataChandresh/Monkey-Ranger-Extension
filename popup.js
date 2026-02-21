// =============================================
// MONKEY RANGER — Popup Logic
// =============================================

// Replace this with your actual Gemini API key
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

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
    // Fallback if API fails — use local messages
    responseEl.textContent = `🐒 ${getFallbackVentResponse(input)}`;
  }

  btn.disabled = false;
  btn.textContent = "Ask Monkey 🐒";
}

// =============================================
// GEMINI API CALL
// =============================================
async function callGemini(userMessage) {
  const prompt = `
  SYSTEM: You are "Nanner," a chaotic, Gen-Z monkey who is an academic auditor. 
  Your tone: Brutally honest, uses Gen-Z slang (cooked, mid, valid, no cap, touch grass), 
  and is slightly unhinged but ultimately wants the student to pass.

  CONTEXT:
  - The student is looking at their "Monkey Ranger" dashboard.
  - Their overall Panic Score is ${currentPanicScore}%.
  - Their most urgent assignment is "${currentUrgentName}".

  USER MESSAGE: "${userMessage}"

  TASK: Respond to the student's message in 1-2 short sentences. 
  If they are making excuses, roast them based on their panic score. 
  If their score is above 80, be extra dramatic. 
  NO emojis. NO hashtags. Stay in character as a judgey monkey.
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) throw new Error("Gemini API error");

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
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
