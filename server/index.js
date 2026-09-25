import express from "express";
import { validateContact } from "./validation.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Lit le JSON reçu, en refusant les corps de plus de 10 Ko
app.use(express.json({ limit: "10kb" }));

// Route de test : "le serveur est-il vivant ?"
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Route du formulaire de contact
app.post("/api/contact", async (req, res) => {
  const { data, errors } = await validateContact(req.body);

  // Des erreurs : on refuse avec le code 400 et la liste des problèmes
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  // Données valides : pour l'instant on les affiche, l'email viendra à l'étape suivante
  console.log("Message valide reçu :", data);
  res.status(201).json({ ok: true });
});

// Toute autre adresse : 404 en JSON (plus propre que "Cannot GET")
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Route introuvable." });
});

// Filet de sécurité : une erreur inattendue ne fait pas planter le serveur.
// Les 4 paramètres sont OBLIGATOIRES : c'est grâce à eux qu'Express reconnaît
// un gestionnaire d'erreurs. Il ne faut donc pas supprimer "next", même inutilisé.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  // JSON mal formé ou trop volumineux envoyé par le client
  if (error.type === "entity.parse.failed" || error.type === "entity.too.large") {
    return res.status(400).json({ ok: false, error: "Requête invalide." });
  }
  console.error(error);
  res.status(500).json({ ok: false, error: "Erreur interne du serveur." });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});