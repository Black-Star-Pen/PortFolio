import express from "express";

const app = express();
const PORT = process.env.PORT || 3001;

// Permet de lire le JSON envoyé dans le corps des requêtes
app.use(express.json());

// Route de test : "le serveur est-il vivant ?"
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Route du formulaire de contact
app.post("/api/contact", (req, res) => {
  console.log("Nouveau message reçu :", req.body);
  res.status(201).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});