import express from "express";
import { rateLimit } from "express-rate-limit";
import { validateContact } from "./validation.js";
import { sendContactEmail, verifyMailer } from "./mailer.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Ne révèle pas qu'Express tourne derrière le serveur
app.disable("x-powered-by");

// Lit le JSON reçu, en refusant les corps de plus de 10 Ko
app.use(express.json({ limit: "10kb" }));

// Limite d'envoi : 5 messages maximum par visiteur toutes les 15 minutes
const contactLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Trop de messages envoyés. Réessayez dans quelques minutes.",
  },
});

// Route de test : "le serveur est-il vivant ?"
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Route du formulaire de contact
app.post("/api/contact", contactLimiter, async (req, res) => {
  // Champ piège : invisible pour un humain, mais rempli par les robots.
  // On fait semblant d'accepter, sans rien envoyer.
  if (req.body?.website) {
    return res.status(201).json({ ok: true });
  }

  const { data, errors } = await validateContact(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  try {
    await sendContactEmail(data);
    console.log(`Email envoyé : demande "${data.type}" de ${data.firstName} ${data.lastName}`);
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Échec de l'envoi de l'email :", error.message);
    res.status(502).json({
      ok: false,
      error: "Le message n'a pas pu être envoyé. Réessayez plus tard.",
    });
  }
});

// Toute autre adresse : 404 en JSON
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Route introuvable." });
});

// Le gestionnaire d'erreurs. Express le reconnaît à ses 4 paramètres : « next » doit donc rester,
// même s'il n'est pas utilisé (la ligne suivante dit à ESLint de ne pas le signaler).
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed" || error.type === "entity.too.large") {
    return res.status(400).json({ ok: false, error: "Requête invalide." });
  }
  console.error(error);
  res.status(500).json({ ok: false, error: "Erreur interne du serveur." });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  verifyMailer();
});