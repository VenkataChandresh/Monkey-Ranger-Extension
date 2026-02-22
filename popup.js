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
  renderDifficultyAnalyzer(processed);

  const ventBtn = document.getElementById("ventBtn");
  ventBtn.addEventListener("click", handleVent);

  const list = document.getElementById("assignmentsList");
  const scrollHint = document.getElementById("scrollHint");

  list.addEventListener("scroll", () => {
    const atBottom =
      list.scrollTop + list.clientHeight >= list.scrollHeight - 2;

    scrollHint.style.opacity = atBottom ? "0" : "1";
  });
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
// AI DIFFICULTY ANALYZER
// =============================================
async function renderDifficultyAnalyzer(processed) {
  const panel = document.getElementById("difficultyPanel");
  const statusEl = document.getElementById("difficultyStatus");
  const targetEl = document.getElementById("difficultyTarget");
  const scoreEl = document.getElementById("difficultyScore");
  const labelEl = document.getElementById("difficultyLabel");
  const roastEl = document.getElementById("difficultyRoast");

  const urgent = getHighestPanicAssignment(processed);

  if (!urgent) {
    panel.dataset.tier = "easy";
    statusEl.textContent = "Idle";
    targetEl.textContent = "No upcoming assignments to analyze.";
    scoreEl.textContent = "0";
    labelEl.textContent = "No target";
    roastEl.textContent =
      "Overdue assignments are ignored here. Monkahh only judges work that can still ruin your evening.";
    return;
  }

  const description = getAssignmentDescription(urgent);

  targetEl.textContent = `${urgent.name} (${urgent.course})`;
  statusEl.textContent = "Analyzing...";
  scoreEl.textContent = "--";
  labelEl.textContent = "Analyzing";
  roastEl.textContent = "Scanning assignment pain level...";

  try {
    const analysis = await getGeminiDifficultyRating(urgent, description);
    const difficulty = clampDifficultyScore(analysis.difficulty);
    const tier = getDifficultyTier(difficulty);

    panel.dataset.tier = tier;
    statusEl.textContent = "Analyzed";
    scoreEl.textContent = String(difficulty);
    labelEl.textContent = getDifficultyLabel(difficulty);
    roastEl.textContent = getDifficultyRoast(
      urgent,
      difficulty,
      analysis.reason,
    );
  } catch (err) {
    console.error("Difficulty analyzer error:", err);

    const fallbackDifficulty = getLocalDifficultyFallback(urgent);
    const tier = getDifficultyTier(fallbackDifficulty);

    panel.dataset.tier = tier;
    statusEl.textContent = "Fallback";
    scoreEl.textContent = String(fallbackDifficulty);
    labelEl.textContent = `${getDifficultyLabel(fallbackDifficulty)} (Estimated)`;
    roastEl.textContent = getDifficultyRoast(urgent, fallbackDifficulty);
  }
}

function getHighestPanicAssignment(processed) {
  const now = new Date();

  return (
    [...processed]
      .filter((a) => !a.submitted)
      .filter((a) => new Date(a.dueDate) >= now)
      .sort((a, b) => {
        const threatDiff = b.threat.panicScore - a.threat.panicScore;
        if (threatDiff !== 0) return threatDiff;
        return new Date(a.dueDate) - new Date(b.dueDate);
      })[0] || null
  );
}

function getAssignmentDescription(assignment) {
  if (assignment.description && assignment.description.trim()) {
    return assignment.description.trim();
  }

  return `No description provided for ${assignment.name}. Weight: ${assignment.weight}% of grade. Time left: ${assignment.timeLeft}.`;
}

async function getGeminiDifficultyRating(assignment, description) {
  const prompt = `
TASK:
Rate the academic difficulty of this assignment from 1 to 10.

ASSIGNMENT:
- Name: ${assignment.name}
- Course: ${assignment.course}
- Weight: ${assignment.weight}%
- Due: ${assignment.timeLeft}
- Threat level: ${assignment.threat.label}
- Description: ${description}

RESPONSE FORMAT (STRICT):
DIFFICULTY: <integer 1-10>
REASON: <one short sentence under 20 words>

No extra lines. No markdown.
`;

  const res = await chrome.runtime.sendMessage({
    type: "GEMINI_CHAT",
    prompt,
  });

  if (!res?.ok) throw new Error(res?.error || "Gemini failed");

  const text = (res.text || "").trim();
  const difficultyMatch = text.match(/DIFFICULTY:\s*(10|[1-9])\b/i);
  const reasonMatch = text.match(/REASON:\s*(.+)$/im);

  if (!difficultyMatch) {
    throw new Error(`Unable to parse difficulty from Gemini response: ${text}`);
  }

  return {
    difficulty: Number(difficultyMatch[1]),
    reason: reasonMatch ? reasonMatch[1].trim() : "",
  };
}

function clampDifficultyScore(score) {
  return Math.max(1, Math.min(10, Math.round(Number(score) || 1)));
}

function getDifficultyTier(score) {
  if (score <= 3) return "easy";
  if (score <= 6) return "medium";
  if (score <= 8) return "hard";
  return "nightmare";
}

function getDifficultyLabel(score) {
  if (score <= 3) return "Banana Easy";
  if (score <= 6) return "Manageable Chaos";
  if (score <= 8) return "Cooked Potential";
  return "Academic Boss Fight";
}

function getDifficultyRoast(assignment, score, reason = "") {
  const shortReason = reason ? ` ${reason}` : "";

  if (score <= 3) {
    return `${score}/10. Tragic. The assignment is easy and somehow you're still negotiating with it.${shortReason}`;
  }

  if (score <= 6) {
    return `${score}/10. Very doable. If this goes wrong, please blame the procrastination committee you chair.${shortReason}`;
  }

  if (score <= 8) {
    return `${score}/10. Real work. You can still survive this if you stop pretending 'later' is a strategy.${shortReason}`;
  }

  return `${score}/10. Academic boss fight. Amazing choice to bring vibes, zero prep, and blind optimism.${shortReason}`;
}

function getLocalDifficultyFallback(assignment) {
  const base = Math.ceil((assignment.weight || 0) / 5);
  const threatLift = Math.round((assignment.threat?.panicScore || 0) / 20);
  return clampDifficultyScore(Math.max(1, base + threatLift));
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
