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
  submitted: [
    "Monkahh sees you submitted. Responsible behavior? In this economy? Keep cooking like that.",
    "Submitted already? Wow. You beat the deadline without a cinematic breakdown. Respect.",
    "Monkahh confirms submission. Suspicious competence detected. Do it again on the next one.",
    "Assignment submitted on time? Monkahh is filing this under 'rare and beautiful events.'",
    "Look at you being efficient. Future-you is thriving and present-you deserves a tiny victory lap.",
    "You actually finished it before disaster mode. Monkahh approves this character development.",
  ],
  chill: [
    "You got time, which means you'll try wasting it first. Plot twist: start early and flex later.",
    "Deadline is far away. Classic setup for fake confidence. Start now and make future-you smug.",
    "Plenty of time left. Start one small piece now and you can clown the panic version of yourself later.",
    "This is the sweet spot: enough time to do it well, not enough time to keep pretending forever.",
    "You are currently in the 'I got this' phase. Prove it by doing literally one real task.",
    "Monkahh sees free points on the table. Start early and stop donating them to procrastination.",
  ],
  nervous: [
    "Monkahh is concerned. Not emergency concerned. Just 'you are procrastinating again' concerned. Still salvageable.",
    "This is fixable if you stop pretending opening the tab counts as progress. Write one paragraph. Go.",
    "You should start. Yes, real start. Not a playlist, not a snack, not a motivational reel.",
    "The assignment is not impossible. The delay strategy is the part that keeps failing.",
    "You still have time to recover, but the clock has started judging you personally.",
    "Monkahh recommends a 25-minute sprint before your brain invents a fake emergency.",
  ],
  panic: [
    "OOH OOH AH AH. Panic tier. You are COOKED... unless you lock in right now.",
    "This is where you say 'I work better under pressure' and then prove it. Open the doc.",
    "Panic unlocked. Great time to finally read the directions and speedrun competence.",
    "You wanted adrenaline? Congratulations. Now use it to finish something.",
    "Monkahh sees chaos, but also comeback potential. Start with the easiest chunk and stack wins.",
    "This can still be saved if you stop spiraling and start submitting words.",
  ],
  doomed: [
    "Less than 6 hours?! Monkahh is screaming. Touch grass later, lock in NOW.",
    "Doomed tier. Incredible strategy. Still, a focused sprint can save your grade. Move.",
    "Clock is cooking you, but panic typing beats panic thinking. Start with the easiest part.",
    "This is not the time for perfection. This is the time for progress and a working draft.",
    "Monkahh has bad news and good news. Bad: time is gone. Good: you still have hands. Type.",
    "You are one focused sprint away from turning a disaster into a survivable story.",
  ],
  dead: [
    "OVERDUE. It's giving tragedy. Still submit if allowed and email the professor like a brave person.",
    "Overdue. Professor may have moved on, but you can still try the late-submit comeback.",
    "You missed it. Academic archaeology mode activated. Learn fast and stop the next one early.",
    "Yes, it's overdue. No, that does not mean disappear. Submit what you can and communicate.",
    "Monkahh cannot time travel, but Monkahh can recommend the apology-email + late-submit combo.",
    "Take the L for this one, then use the lesson to bully the next deadline instead.",
  ],
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
  const pool = FALLBACK_MESSAGES[level];
  if (!pool) return "Monkahh is processing your chaos...";
  if (typeof pool === "string") return pool;

  for (const msg of pool) {
    if (msg && Math.random() > 0.66) return msg;
  }

  return pool[Math.floor(Math.random() * pool.length)];
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
