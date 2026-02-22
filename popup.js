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
  const ventInput = document.getElementById("ventInput");
  ventBtn.addEventListener("click", handleVent);
  ventInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleVent();
    }
  });

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
  statusEl.textContent = "Local";

  const localDifficulty = getLocalDifficultyFallback(urgent);
  const tier = getDifficultyTier(localDifficulty);

  panel.dataset.tier = tier;
  scoreEl.textContent = String(localDifficulty);
  labelEl.textContent = `${getDifficultyLabel(localDifficulty)} (Estimated)`;
  roastEl.textContent = getDifficultyRoast(urgent, localDifficulty);
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
ROAST: <one sarcastic sentence under 18 words>

Return exactly those 3 lines.
No extra lines. No markdown.
`;

  const res = await chrome.runtime.sendMessage({
    type: "GEMINI_CHAT",
    prompt,
    mode: "structured",
    temperature: 0.2,
    maxOutputTokens: 120,
  });

  if (!res?.ok) throw new Error(res?.error || "Gemini failed");

  const text = (res.text || "").trim();
  const difficultyMatch =
    text.match(/DIFFICULTY:\s*(10|[1-9])\b/i) ||
    text.match(/\b(10|[1-9])\s*\/\s*10\b/i) ||
    text.match(/\bdifficulty\b[^0-9]*(10|[1-9])\b/i);
  const reasonMatch = text.match(/REASON:\s*(.+)$/im);
  const roastMatch = text.match(/ROAST:\s*(.+)$/im);

  if (!difficultyMatch) {
    throw new Error(`Unable to parse difficulty from Gemini response: ${text}`);
  }

  const fallbackLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const unlabeledLines = fallbackLines.filter(
    (line) => !/^(DIFFICULTY|REASON|ROAST)\s*:/i.test(line),
  );
  const fallbackRoast = unlabeledLines.find((line) => line.length > 8) || "";
  const fallbackReason =
    unlabeledLines.find((line) => /because|since|requires|needs|multiple|long/i.test(line)) ||
    "";

  return {
    difficulty: Number(difficultyMatch[1]),
    reason: reasonMatch ? reasonMatch[1].trim() : fallbackReason,
    roast: roastMatch ? roastMatch[1].trim() : fallbackRoast,
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
  let options = [];

  if (score <= 3) {
    options = [
      `${score}/10. Tragic. This is easy and you're still negotiating with it. Finish it and collect free points.${shortReason}`,
      `${score}/10. Light work. You turned it into drama somehow. Do 20 minutes now and end the storyline.${shortReason}`,
      `${score}/10. Beginner level. You are adding difficulty with imagination. Start now and get the easy win.${shortReason}`,
    ];
    return pickRandom(options);
  }

  if (score <= 6) {
    options = [
      `${score}/10. Very doable. Please thank the procrastination committee you chair, then actually start.${shortReason}`,
      `${score}/10. Manageable pain. This becomes a crisis only if you wait. Knock out the first section now.${shortReason}`,
      `${score}/10. Normal assignment. Your biggest opponent is timing, so beat it with one focused sprint.${shortReason}`,
    ];
    return pickRandom(options);
  }

  if (score <= 8) {
    options = [
      `${score}/10. Real work. You survive this only if 'later' stops being your whole strategy.${shortReason}`,
      `${score}/10. Serious assignment. Stop romanticizing pressure and start typing like your grade can hear you.${shortReason}`,
      `${score}/10. This needs effort, not speeches. Start ugly, fix later, submit alive.${shortReason}`,
    ];
    return pickRandom(options);
  }

  options = [
    `${score}/10. Academic boss fight. Amazing choice to bring vibes and no prep. Lock in and clutch it anyway.${shortReason}`,
    `${score}/10. Nightmare tier. Bold strategy: confidence with no progress. Start now and steal a comeback.${shortReason}`,
    `${score}/10. Boss fight energy. Monkahh hopes your plan includes more than manifesting. Sprint mode. Go.${shortReason}`,
  ];
  return pickRandom(options);
}

function getLocalDifficultyFallback(assignment) {
  const base = Math.ceil((assignment.weight || 0) / 5);
  const threatLift = Math.round((assignment.threat?.panicScore || 0) / 20);
  return clampDifficultyScore(Math.max(1, base + threatLift));
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
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
