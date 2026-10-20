export const TEST_TURNSTILE_SECRET = "1x0000000000000000000000000000000AA";
export const TEST_TURNSTILE_SECRETS = [
  TEST_TURNSTILE_SECRET,
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
];

export function createTurnstileVerifier({ secretKey, allowedHostnames, fetchImpl = fetch }) {
  if (!secretKey || !allowedHostnames?.length) throw new Error("Configuration Turnstile manquante.");
  const testMode = TEST_TURNSTILE_SECRETS.includes(secretKey);
  return async function verifyChallenge(token) {
    if (typeof token !== "string" || !token.trim() || token.length > 2048) {
      return { ok: false, status: 403, code: "ANTIBOT_REQUIRED" };
    }
    try {
      const response = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // L'IP est facultative : elle n'est pas transmise par notre API.
        body: JSON.stringify({ secret: secretKey, response: token }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("Service indisponible");
      const result = await response.json();
      if (result?.success !== true || (!testMode &&
          (result.action !== "contact" || !allowedHostnames.includes(result.hostname)))) {
        return { ok: false, status: 403, code: "ANTIBOT_REQUIRED" };
      }
      return { ok: true };
    } catch {
      return { ok: false, status: 503, code: "ANTIBOT_UNAVAILABLE" };
    }
  };
}
