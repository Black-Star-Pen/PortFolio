import { createApp } from "./app.js";
import { readServerConfig } from "./config.js";
import { sendContactEmail, verifyMailer } from "./mailer.js";
import { createTurnstileVerifier, TEST_TURNSTILE_SECRETS } from "./turnstile.js";

const { port, allowedOrigins, trustProxy, turnstileSecretKey, turnstileHostnames } = readServerConfig();
const verifyChallenge = createTurnstileVerifier({ secretKey: turnstileSecretKey, allowedHostnames: turnstileHostnames });
const app = createApp({ allowedOrigins, trustProxy, sendEmail: sendContactEmail, verifyChallenge });
const server = app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
  console.log(`Vérification anti-bots : ${TEST_TURNSTILE_SECRETS.includes(turnstileSecretKey) ? "mode test local" : "activée"}.`);
  verifyMailer();
});
// Borne l’attente des en-têtes et du corps d’une requête lente.
server.headersTimeout = 15000;
server.requestTimeout = 30000;
