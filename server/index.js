import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { validateContact } from "./validation.js";
import { sendContactEmail, verifyMailer } from "./mailer.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Ne révèle pas qu'Express tourne derrière le serveur
app.disable("x-powered-by");

// Chez un hébergeur, les requêtes n'arrivent pas directement au serveur : elles passent d'abord par un
// intermédiaire (un « proxy »), qui les lui transmet. Sans ce réglage, Express croit que TOUS les visiteurs
// ont l'adresse de cet intermédiaire, et la limite d'envoi les bloquerait tous ensemble.
// TRUST_PROXY = le nombre d'intermédiaires : 0 sur ton ordinateur, 1 chez la plupart des hébergeurs.
// (On ne met jamais « true » : n'importe qui pourrait alors se faire passer pour une autre adresse.)
app.set("trust proxy", Number(process.env.TRUST_PROXY) || 0);

// Les en-têtes de sécurité : des consignes envoyées au navigateur avec chaque réponse
// (ne pas deviner le type des fichiers, ne pas s'afficher dans une page d'un autre site, exiger le HTTPS…).
// helmet pose d'un coup tous ceux qui sont recommandés.
app.use(helmet());

// Qui a le droit d'appeler cette API depuis un navigateur ? Seulement les sites listés dans CORS_ORIGIN
// (plusieurs adresses possibles, séparées par des virgules). Un navigateur refuse de lire la réponse
// si le site qui appelle n'est pas dans la liste.
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    maxAge: 600, // le navigateur retient cette autorisation 10 minutes, au lieu de la redemander à chaque fois
  })
);

// CORS ne protège que dans un navigateur honnête. En plus, on refuse nous-mêmes un envoi qui annonce
// venir d'un autre site que le tien (l'en-tête Origin, que le navigateur ajoute tout seul).
// Tant que CORS_ORIGIN n'est pas rempli (sur ton ordinateur), on ne bloque rien.
function checkOrigin(req, res, next) {
  const origin = req.get("Origin");
  if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ ok: false, error: "Origine non autorisée." });
  }
  next();
}

// Lit le JSON reçu, en refusant les corps de plus de 10 Ko
app.use(express.json({ limit: "10kb" }));

// Limite d'envoi : 3 messages maximum par visiteur toutes les 5 minutes
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
app.post("/api/contact", checkOrigin, contactLimiter, async (req, res) => {
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
    // Pas de nom ni d'adresse dans le journal du serveur : l'hébergeur le conserve, et ce sont des
    // données personnelles. Le type de demande suffit pour suivre l'activité.
    console.log(`Email envoyé : demande "${data.type}"`);
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
  if (ALLOWED_ORIGINS.length === 0) {
    console.warn("⚠️  CORS_ORIGIN n'est pas rempli : l'API ne filtre pas les sites qui l'appellent.");
  }
  verifyMailer();
});
