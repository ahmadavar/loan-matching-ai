const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.loanmatchai.app";

// Lazily generate a session ID per browser session (no login required)
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("lm_sid");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("lm_sid", id);
  }
  return id;
}

export function track(
  eventType: string,
  page?: string,
  metadata?: Record<string, unknown>
) {
  // Fire-and-forget — never block the UI
  fetch(`${API}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: eventType,
      page: page ?? (typeof window !== "undefined" ? window.location.pathname : null),
      session_id: getSessionId(),
      metadata: metadata ?? null,
    }),
  }).catch(() => {}); // silently ignore errors
}
