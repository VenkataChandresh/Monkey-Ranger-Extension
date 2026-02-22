// =============================================
// MONKEY RANGER — Panic Logic Engine
// =============================================

const THREAT_LEVELS = {
  SUBMITTED: {
    level: "submitted",
    emoji: "✅",
    label: "Submitted",
    color: "#4ade80",
    panicScore: 0,
  },
  CHILL: {
    level: "chill",
    emoji: "🟢",
    label: "Chill",
    color: "#86efac",
    panicScore: 10,
  },
  NERVOUS: {
    level: "nervous",
    emoji: "🟡",
    label: "Nervous",
    color: "#fde68a",
    panicScore: 40,
  },
  PANIC: {
    level: "panic",
    emoji: "🟠",
    label: "PANIC",
    color: "#fb923c",
    panicScore: 70,
  },
  DOOMED: {
    level: "doomed",
    emoji: "🔴",
    label: "DOOMED",
    color: "#f87171",
    panicScore: 90,
  },
  DEAD: {
    level: "dead",
    emoji: "💀",
    label: "RIP GPA",
    color: "#6b21a8",
    panicScore: 100,
  },
};

// Fallback messages — only used if Gemini API fails
// These are shown on the dashboard before user types anything
const FALLBACK_MESSAGES = {
  submitted:
    "Monkahh sees you submitted. Monkahh is shook. Valid behavior, no cap.",
  chill:
    "You got time. Don't waste it, that's mid behavior. Monkahh is watching.",
  nervous:
    "Monkahh is concerned no cap. Maybe start... thinking about starting?",
  panic: "OOH OOH AH AH. Monkahh PANICKING ON YOUR BEHALF. YOU ARE COOKED.",
  doomed:
    "Less than 6 hours?! Monkahh is screaming into the void. Touch grass later, study NOW.",
  dead: "OVERDUE. Your GPA is gone. Monkahh is at your funeral. It's giving tragedy.",
};

// Calculate hours until due
function getHoursUntilDue(dueDate) {
  return (new Date(dueDate) - new Date()) / (1000 * 60 * 60);
}

// Get threat level based on hours remaining
function getThreatLevel(assignment) {
  if (assignment.submitted) return THREAT_LEVELS.SUBMITTED;

  const hours = getHoursUntilDue(assignment.dueDate);

  if (hours < 0) return THREAT_LEVELS.DEAD;
  if (hours < 6) return THREAT_LEVELS.DOOMED;
  if (hours < 24) return THREAT_LEVELS.PANIC;
  if (hours < 96) return THREAT_LEVELS.NERVOUS;
  if (hours < 120) return THREAT_LEVELS.CHILL;
  return THREAT_LEVELS.CHILL;
}

// Get fallback message for a threat level (used before Gemini responds)
function getMonkeyMessage(level) {
  return FALLBACK_MESSAGES[level] || "Monkahh is processing your chaos...";
}

// Get the most urgent unsubmitted assignment (used by popup.js for Gemini context)
function getUrgentAssignment(assignments) {
  return (
    assignments
      .filter((a) => !a.submitted)
      .sort(
        (a, b) => getThreatLevel(b).panicScore - getThreatLevel(a).panicScore,
      )[0] || null
  );
}

// Calculate overall panic score across all assignments
function getOverallPanicScore(assignments) {
  const unsubmitted = assignments.filter((a) => !a.submitted);
  if (unsubmitted.length === 0) return 0;

  const scores = unsubmitted.map((a) => {
    const threat = getThreatLevel(a);
    return (threat.panicScore * a.weight) / 100;
  });

  return Math.min(100, Math.round(scores.reduce((a, b) => a + b, 0)));
}

// Format time remaining nicely
function formatTimeLeft(dueDate) {
  const hours = getHoursUntilDue(dueDate);
  if (hours < 0) return "OVERDUE";
  if (hours < 1) return `${Math.round(hours * 60)}m left`;
  if (hours < 24) return `${Math.round(hours)}h left`;
  return `${Math.round(hours / 24)}d left`;
}

// Process all assignments
function processAssignments(assignments) {
  return assignments.map((a) => ({
    ...a,
    threat: getThreatLevel(a),
    timeLeft: formatTimeLeft(a.dueDate),
    monkeyMessage: getMonkeyMessage(getThreatLevel(a).level),
  }));
}
