// =============================================
// MONKEY RANGER — Gemini Bridge (MV3 Background)
// NO API KEY IN CODE ✅
// =============================================

const MODEL = "gemini-1.5-flash";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "GEMINI_CHAT") return;

  callGemini(msg.prompt)
    .then((text) => sendResponse({ ok: true, text }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));

  return true; // keep channel open for async
});

async function getApiKey() {
  const { geminiKey } = await chrome.storage.sync.get("geminiKey");
  if (!geminiKey) throw new Error("No Gemini API key set. Open Settings and paste it.");
  return geminiKey;
}

async function callGemini(prompt) {
  const key = await getApiKey();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

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
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Monkey got no words.";
}