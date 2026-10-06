import nodemailer from "nodemailer";

// Les secrets viennent du fichier .env, jamais du code
const { MAIL_USER, MAIL_PASS, MAIL_TO } = process.env;

// Le "transporteur" : la connexion au serveur d'envoi de Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

// Vérifie au démarrage que les identifiants sont bons
export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log("✉️  Connexion à Gmail réussie : prêt à envoyer des emails.");
  } catch (error) {
    console.error("❌ Connexion à Gmail impossible :", error.message);
  }
}

// Les libellés lisibles, pour l'email
const TYPE_LABELS = {
  site: "Site vitrine",
  application: "Application",
  recrutement: "Recrutement",
  autre: "Autre",
};

const CONTRACT_LABELS = {
  cdi: "CDI",
  cdd: "CDD",
};

const REMOTE_LABELS = {
  site: "Sur site",
  hybride: "Hybride",
  remote: "Télétravail complet",
};

// Neutralise le HTML : un visiteur ne peut pas injecter de balises dans l'email
function escapeHtml(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Construit la liste des informations à afficher dans l'email
function buildRows(data) {
  const rows = [
    ["Type de demande", TYPE_LABELS[data.type]],
    ["Nom", `${data.firstName} ${data.lastName}`],
    ["Email", data.email],
  ];

  if (data.type === "recrutement") {
    rows.push(
      ["Entreprise", data.company],
      ["Poste", data.position],
      ["Contrat", CONTRACT_LABELS[data.contract]],
      ["Lieu", `${data.city} (${data.postalCode})`],
      ["Mode de travail", REMOTE_LABELS[data.remote] || "Non précisé"]
    );
  }

  return rows;
}

// Envoie la demande de contact dans ta boîte mail
export async function sendContactEmail(data) {
  const rows = buildRows(data);

  const subject =
    data.type === "recrutement"
      ? `[Portfolio] Recrutement : ${data.position} chez ${data.company}`
      : `[Portfolio] ${TYPE_LABELS[data.type]} : ${data.firstName} ${data.lastName}`;

  // Version texte brut (lue par les messageries simples)
  const text = [
    ...rows.map(([label, value]) => `${label} : ${value}`),
    "",
    "Message :",
    data.message,
  ].join("\n");

  // Version HTML (mise en forme)
  const html = `
    <h2 style="font-family: sans-serif;">Nouvelle demande depuis le portfolio</h2>
    <table style="font-family: sans-serif; border-collapse: collapse;">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding: 6px 16px 6px 0; color: #666;">${escapeHtml(label)}</td>
          <td style="padding: 6px 0;"><strong>${escapeHtml(value)}</strong></td>
        </tr>`
        )
        .join("")}
    </table>
    <h3 style="font-family: sans-serif;">Message</h3>
    <p style="font-family: sans-serif; white-space: pre-line;">${escapeHtml(data.message)}</p>
  `;

  await transporter.sendMail({
    from: `"Portfolio" <${MAIL_USER}>`,
    to: MAIL_TO,
    replyTo: `"${data.firstName} ${data.lastName}" <${data.email}>`,
    subject,
    text,
    html,
  });
}