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
    "OOH OOH. You submitted on time? Monkahh almost called National Geographic. Rare academic wildlife spotted.",
    "Submitted already? BANANA RESPECT. You skipped the usual midnight crying orchestra. Historic behavior.",
    "Monkahh confirms submission. Suspiciously competent ape behavior. Repeat this dark magic immediately.",
    "On-time submission detected. GPA stopped screaming, lit a candle, and found inner peace for 8 seconds.",
    "You did it early? Monkahh filing this under: myth, legend, and protected species.",
    "Look at you being efficient. Future-you is eating bananas while everyone else is typing through tears.",
  ],
  chill: [
    "You got time, which means banana brain is already planning a 6-hour detour. Start now, flex later.",
    "Deadline is far away. Fake confidence season has begun. Do one task before the clown drums start.",
    "Plenty of time left. Start early so future-you can roast panic-you with receipts.",
    "Sweet spot unlocked: enough time to win, not enough time for 14 fake 'productive' rituals.",
    "You are in the 'I got this' phase. Gorgeous delusion. Prove it with actual work, jungle champion.",
    "Monkahh sees free grade points on the ground. Pick them up before procrastination steals your lunch too.",
  ],
  nervous: [
    "Monkahh concerned. Not funeral concerned yet. Just 'same procrastination season finale' concerned.",
    "Still fixable. Opening the tab is not progress, banana scholar. Write one paragraph and stop acting new.",
    "Start for real. Not a playlist. Not snacks. Not a TED Talk to your ceiling fan.",
    "Assignment is manageable. Your delay strategy is the unstable jungle bridge collapsing under vibes.",
    "You can recover, but the clock is now side-eyeing you like an unpaid landlord.",
    "Monkahh prescribes one 25-minute lock-in sprint before your brain invents a fake emotional emergency.",
  ],
  panic: [
    "OOH OOH AH AH. Panic tier unlocked. You are half-cooked with garnish. Lock in and un-cook yourself.",
    "Ah yes, the 'I work better under pressure' episode. Prove it, jungle legend. Open the doc immediately.",
    "Panic unlocked. Amazing time to read the directions you ignored with premium confidence.",
    "You wanted adrenaline? Congratulations. Use the jungle panic buff and produce actual sentences.",
    "Chaos detected, comeback possible. Start tiny, stack wins, stop performing a collapse.",
    "Still savable if you type words instead of refreshing tabs like a haunted banana goblin.",
  ],
  doomed: [
    "Less than 6 hours?! Monkahh screaming from the tree in 4K. Touch grass after submission. LOCK IN.",
    "Doomed tier. Elite bad planning, hall-of-fame edition. Still salvageable if you sprint like rent is due.",
    "Clock is frying you, but panic typing beats panic philosophizing. Start the easiest chunk and keep swinging.",
    "Perfection is cancelled. Submit-able is the mission. Build the ugly draft and save your grade.",
    "Bad news: time evaporated. Good news: your fingers still work. TYPE, BANANA WARRIOR, TYPE.",
    "This can still be a comeback story if you stop holding a funeral and start producing.",
  ],
  dead: [
    "OVERDUE. Academic jungle funeral vibes. Still submit if allowed and send the brave apology scroll.",
    "Overdue. Professor may ignore it, but coward mode is worse. Try the late-submit comeback anyway.",
    "You missed it. Archaeology mode active. Dig up the mistakes and stop reenacting this tragedy.",
    "Yes, it is overdue. No, vanishing into the trees is not a strategy. Communicate like a grown ape.",
    "Monkahh cannot time travel. Monkahh can demand apology-email plus late-upload combo, immediately.",
    "Take the L, learn the spell, then absolutely body the next deadline before it even blinks.",
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
