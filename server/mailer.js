import nodemailer from "nodemailer";
import { buildContactEmail } from "./emailTemplate.js";

// Les secrets viennent du fichier .env (ou des réglages de l'hébergeur), jamais du code
const { MAIL_USER, MAIL_PASS, MAIL_TO, MAIL_FROM, RESEND_API_KEY } = process.env;

// Deux façons d'envoyer un email, selon l'endroit où tourne le serveur :
// - en ligne, par Resend : un service qu'on appelle par une simple requête HTTPS. L'hébergeur (Render,
//   offre gratuite) bloque en effet la voie classique d'envoi des emails (SMTP) ;
// - sur ton ordinateur, par Gmail (SMTP), comme avant.
// C'est la présence de la clé RESEND_API_KEY qui décide.
const useResend = Boolean(RESEND_API_KEY);

// L'expéditeur des emails envoyés par Resend. Sans nom de domaine à toi, Resend impose son adresse
// de test (et n'envoie alors qu'à l'adresse de ton compte Resend, ce qui suffit : c'est toi le destinataire).
const RESEND_FROM = MAIL_FROM || "Portfolio <onboarding@resend.dev>";
const RESEND_TIMEOUT = 10000; // on n'attend pas la réponse de Resend plus de 10 secondes

// Le "transporteur" : la connexion au serveur d'envoi de Gmail (créé seulement si on s'en sert)
const transporter = useResend
  ? null
  : nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });

// Vérifie au démarrage que l'envoi est prêt
export async function verifyMailer() {
  if (useResend) {
    // Rien à tester sans envoyer un vrai email : on signale seulement le mode choisi
    console.log(`✉️  Envoi des emails par Resend, vers l'adresse MAIL_TO${MAIL_TO ? "" : " (MANQUANTE)"}.`);
    return;
  }

  try {
    await transporter.verify();
    console.log("✉️  Connexion à Gmail réussie : prêt à envoyer des emails.");
  } catch (error) {
    console.error("❌ Connexion à Gmail impossible :", error.message);
  }
}

// L'envoi par Resend : une requête HTTPS vers son API, avec la clé dans l'en-tête Authorization
async function sendWithResend({ replyTo, subject, text, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [MAIL_TO],
      reply_to: replyTo,
      subject,
      text,
      html,
    }),
    signal: AbortSignal.timeout(RESEND_TIMEOUT),
  });

  if (!response.ok) {
    // Resend explique son refus dans la réponse (clé invalide, destinataire non autorisé…)
    const detail = await response.json().catch(() => ({}));
    throw new Error(`Resend a refusé l'envoi (${response.status}) : ${detail.message || "raison inconnue"}`);
  }
}

// Envoie la demande de contact dans ta boîte mail
export async function sendContactEmail(data) {
  // L'objet et les deux versions de l'email (texte brut et mise en page) : voir emailTemplate.js
  const { subject, text, html } = buildContactEmail(data);

  // « Répondre » dans ta messagerie écrira directement au visiteur
  if (useResend) {
    await sendWithResend({ replyTo: data.email, subject, text, html });
    return;
  }

  await transporter.sendMail({
    from: `"Portfolio" <${MAIL_USER}>`,
    to: MAIL_TO,
    replyTo: `"${data.firstName} ${data.lastName}" <${data.email}>`,
    subject,
    text,
    html,
  });
}
