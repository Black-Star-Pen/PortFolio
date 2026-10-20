import { createApp } from "./app.js";
import { readServerConfig } from "./config.js";
import { sendContactEmail, verifyMailer } from "./mailer.js";

const { port, allowedOrigins, trustProxy } = readServerConfig();
const app = createApp({ allowedOrigins, trustProxy, sendEmail: sendContactEmail });
const server = app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
  verifyMailer();
});
// Borne l’attente des en-têtes et du corps d’une requête lente.
server.headersTimeout = 15000;
server.requestTimeout = 30000;
