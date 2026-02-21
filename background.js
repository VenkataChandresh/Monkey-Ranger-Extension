// =============================================
// MONKEY RANGER — Gemini Bridge (Service Worker)
// TEMP: Hardcoded key for testing only
// =============================================

const GEMINI_API_KEY = "AIzaSyB2rZa6QxYY8DJ7ShWpxBIVPKXwN7IJ0_o";
const MODEL = "gemini-1.5-flash";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "GEMINI_CHAT") return;

  callGemini(msg.prompt)
    .then((text) => sendResponse({ ok: true, text }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));

  return true; // allow async response
});

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 90 }
    })
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini error ${res.status}: ${t}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No reply.";
}