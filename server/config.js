import { TEST_TURNSTILE_SECRET, TEST_TURNSTILE_SECRETS } from "./turnstile.js";

const LOCAL_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

export function readServerConfig(env = process.env) {
  const port = Number(env.PORT || 3001);
  const trustProxy = Number(env.TRUST_PROXY || 0);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT doit être un entier entre 1 et 65535.");
  }
  if (!Number.isInteger(trustProxy) || trustProxy < 0 || trustProxy > 10) {
    throw new Error("TRUST_PROXY doit être un entier entre 0 et 10.");
  }
  const production = env.NODE_ENV === "production";
  const configuredOrigins = (env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (production && configuredOrigins.length === 0) {
    throw new Error("CORS_ORIGIN est obligatoire en production.");
  }
  for (const origin of configuredOrigins) {
    let url;
    try {
      url = new URL(origin);
    } catch {
      throw new Error("CORS_ORIGIN contient une origine invalide.");
    }
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin ||
        (production && url.protocol !== "https:")) {
      throw new Error("CORS_ORIGIN doit contenir des origines HTTP(S), sans chemin ni slash final, et HTTPS en production.");
    }
  }
  const allowedOrigins = configuredOrigins.length ? configuredOrigins : LOCAL_ORIGINS;
  const turnstileSecretKey = env.TURNSTILE_SECRET_KEY?.trim() || (production ? "" : TEST_TURNSTILE_SECRET);
  if (!turnstileSecretKey || /\s/.test(turnstileSecretKey) ||
      (production && TEST_TURNSTILE_SECRETS.includes(turnstileSecretKey))) {
    throw new Error("TURNSTILE_SECRET_KEY doit être renseignée avec une vraie clé en production.");
  }
  return { port, trustProxy, allowedOrigins, turnstileSecretKey,
    turnstileHostnames: [...new Set(allowedOrigins.map((origin) => new URL(origin).hostname))] };
}
