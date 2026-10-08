// Le contenu de l'email reçu quand un visiteur envoie le formulaire de contact : son objet, sa version
// texte et sa version mise en page (HTML). Ce fichier ne fait que fabriquer du texte : l'envoi lui-même
// est dans mailer.js.
//
// Un email ne s'écrit pas comme une page web : les messageries (Gmail, Outlook…) ignorent une grande
// partie du CSS moderne. D'où ces règles, valables pour tout le fichier :
// - la mise en page se fait avec des tableaux (<table>), pas avec flex ou grid ;
// - les styles sont écrits sur chaque balise (style="…"), pas dans une feuille de style à part ;
// - aucune image ni police à télécharger : tout est du texte et des couleurs, l'email s'affiche donc
//   en entier même quand la messagerie bloque les images.

// Les couleurs de l'email : celles du site (le noir et le doré de l'en-tête, l'ivoire du thème clair)
const COLORS = {
  page: "#f1ece0", // le fond, autour de la feuille
  sheet: "#ffffff", // la feuille
  paper: "#faf6ee", // les blocs légèrement teintés
  line: "#e6dfcf", // les filets
  ink: "#1b1a17", // le texte
  muted: "#6b665b", // le texte secondaire
  gold: "#8a6410", // le doré lisible sur fond clair
  goldLight: "#d6bf94", // le doré de l'en-tête sombre
  goldTint: "#fbf5e6",
  blue: "#17609c",
  blueTint: "#e9f1f8",
  dark: "#0a0b0f",
};

// Des polices déjà présentes sur l'appareil du lecteur : la première trouvée est utilisée
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Consolas, 'Courier New', monospace";

// Les libellés lisibles des choix du formulaire (le formulaire envoie leurs « value », voir ContactForm.jsx)
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

// La langue dans laquelle le visiteur a utilisé le site : utile pour savoir dans laquelle lui répondre
const LANGUAGE_LABELS = {
  fr: "Français",
  en: "Anglais (pense à répondre en anglais)",
};

// Neutralise le HTML : un visiteur ne peut pas injecter de balises dans l'email
function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// « jeudi 9 octobre 2026 à 14:32 » : la date de réception, toujours à l'heure de Paris
// (le serveur, lui, tourne à l'heure universelle)
function formatDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

// L'objet de l'email. Il commence toujours par [Portfolio] : c'est ce qui permet de trier ces emails
// automatiquement dans la boîte de réception (filtres et libellés).
function buildSubject(data) {
  return data.type === "recrutement"
    ? `[Portfolio] Recrutement : ${data.position} chez ${data.company}`
    : `[Portfolio] ${TYPE_LABELS[data.type]} : ${data.firstName} ${data.lastName}`;
}

// Les blocs d'informations de l'email, chacun avec son titre et ses lignes [libellé, valeur].
// Les deux versions de l'email (texte et HTML) sont fabriquées à partir de cette même liste.
function buildSections(data, date) {
  const sections = [
    {
      title: "Expéditeur",
      rows: [
        ["Nom", `${data.firstName} ${data.lastName}`],
        ["Email", data.email],
        ["Langue du site", LANGUAGE_LABELS[data.lang] || LANGUAGE_LABELS.fr],
      ],
    },
    {
      title: "Demande",
      rows: [
        ["Type", TYPE_LABELS[data.type]],
        ["Reçue le", `${formatDate(date)} (heure de Paris)`],
      ],
    },
  ];

  if (data.type === "recrutement") {
    sections.push({
      title: "Fiche de poste",
      rows: [
        ["Entreprise", data.company],
        ["Poste", data.position],
        ["Contrat", CONTRACT_LABELS[data.contract]],
        ["Lieu", `${data.city} (${data.postalCode})`],
        ["Mode de travail", REMOTE_LABELS[data.remote] || "Non précisé"],
      ],
    });
  }

  return sections;
}

// ----- La version texte : lue par les messageries simples, et dans les aperçus -----

function buildText(data, sections) {
  const blocks = sections.map(({ title, rows }) =>
    [title.toUpperCase(), ...rows.map(([label, value]) => `${label} : ${value}`)].join("\n")
  );

  const messageTitle = data.type === "recrutement" ? "DESCRIPTION DU POSTE" : "MESSAGE";

  return [
    `Nouvelle demande depuis le portfolio — ${TYPE_LABELS[data.type]}`,
    ...blocks,
    `${messageTitle}\n${data.message}`,
    `Pour répondre : utilise « Répondre », ta réponse partira directement à ${data.email}.`,
  ].join("\n\n");
}

// ----- La version HTML -----

// Le titre d'un bloc : petit, en capitales, doré, précédé d'un trait (comme les libellés du site)
function renderTitle(title) {
  return `
    <p style="margin: 0 0 10px; font-family: ${MONO}; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: ${COLORS.gold};">
      &mdash;&nbsp; ${escapeHtml(title)}
    </p>`;
}

// Une ligne « libellé : valeur ». L'adresse email devient un lien qui ouvre une réponse.
function renderRow([label, value], data) {
  const content =
    label === "Email"
      ? `<a href="mailto:${escapeHtml(data.email)}" style="color: ${COLORS.blue}; text-decoration: underline; word-break: break-all;">${escapeHtml(value)}</a>`
      : escapeHtml(value);

  return `
        <tr>
          <td valign="top" style="width: 100px; padding: 7px 12px 7px 0; border-bottom: 1px solid ${COLORS.line}; font-family: ${FONT}; font-size: 13px; color: ${COLORS.muted};">${escapeHtml(label)}</td>
          <td valign="top" style="padding: 7px 0; border-bottom: 1px solid ${COLORS.line}; font-family: ${FONT}; font-size: 15px; font-weight: bold; color: ${COLORS.ink};">${content}</td>
        </tr>`;
}

// Un bloc d'informations : son titre, puis un tableau de lignes
function renderSection({ title, rows }, data) {
  return `
    <tr>
      <td style="padding: 22px 28px 0;">
        ${renderTitle(title)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">${rows
          .map((row) => renderRow(row, data))
          .join("")}
        </table>
      </td>
    </tr>`;
}

function buildHtml(data, sections, subject) {
  const isRecruitment = data.type === "recrutement";
  const fullName = `${data.firstName} ${data.lastName}`;
  // L'étiquette du type : bleue pour un recrutement (la couleur de la fiche de poste sur le site), dorée sinon
  const badge = isRecruitment
    ? { color: COLORS.blue, background: COLORS.blueTint }
    : { color: COLORS.gold, background: COLORS.goldTint };
  // Le lien du bouton : il ouvre une réponse au visiteur, avec l'objet déjà rempli.
  // encodeURIComponent : les espaces, les accents et les signes spéciaux sont traduits pour tenir dans
  // un lien (seul le @ de l'adresse reste tel quel, les messageries l'attendent ainsi).
  const address = encodeURIComponent(data.email).replace("%40", "@");
  const replyLink = `mailto:${address}?subject=${encodeURIComponent(`Re: ${subject.replace("[Portfolio] ", "")}`)}`;
  // Le message, ligne par ligne : chaque retour à la ligne tapé par le visiteur devient un <br>
  // (toutes les messageries le comprennent, ce qui n'est pas le cas du réglage CSS équivalent)
  const message = escapeHtml(data.message).replaceAll("\n", "<br>");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- L'email est fait pour un fond clair : on demande aux messageries de ne pas inverser ses couleurs -->
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.page};">
  <!-- Le texte d'aperçu : la ligne grise affichée à côté de l'objet dans la boîte de réception.
       Il est invisible une fois l'email ouvert. -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${escapeHtml(fullName)} : ${escapeHtml(data.message.slice(0, 140))}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.page};">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!-- La feuille : 600px au plus, toute la largeur sur un téléphone -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${COLORS.sheet}; border: 1px solid ${COLORS.line};">
          <!-- L'en-tête sombre, comme la navbar du site -->
          <tr>
            <td style="padding: 20px 28px; background-color: ${COLORS.dark}; border-bottom: 3px solid ${COLORS.goldLight};">
              <p style="margin: 0; font-family: ${FONT}; font-size: 18px; font-weight: bold; letter-spacing: 0.5px; color: #f2efe9;">
                ADAM <span style="color: ${COLORS.goldLight};">BOULKHEDERT</span>
              </p>
              <p style="margin: 6px 0 0; font-family: ${MONO}; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: ${COLORS.goldLight};">
                Ordre de fabrication &middot; Portfolio
              </p>
            </td>
          </tr>

          <!-- Le titre : le type de demande, puis qui écrit -->
          <tr>
            <td style="padding: 26px 28px 0;">
              <span style="display: inline-block; padding: 4px 10px; font-family: ${MONO}; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: ${badge.color}; background-color: ${badge.background}; border: 1px solid ${badge.color};">
                ${escapeHtml(TYPE_LABELS[data.type])}
              </span>
              <h1 style="margin: 14px 0 0; font-family: ${FONT}; font-size: 22px; line-height: 1.3; color: ${COLORS.ink};">
                Nouvelle demande de ${escapeHtml(fullName)}
              </h1>
              ${
                isRecruitment
                  ? `<p style="margin: 6px 0 0; font-family: ${FONT}; font-size: 15px; color: ${COLORS.muted};">${escapeHtml(data.position)} chez ${escapeHtml(data.company)}</p>`
                  : ""
              }
            </td>
          </tr>
${sections.map((section) => renderSection(section, data)).join("")}

          <!-- Le message : dans un bloc teinté, avec un filet doré à gauche -->
          <tr>
            <td style="padding: 22px 28px 0;">
              ${renderTitle(isRecruitment ? "Description du poste" : "Message")}
              <div style="padding: 16px 18px; background-color: ${COLORS.paper}; border-left: 3px solid ${COLORS.gold}; font-family: ${FONT}; font-size: 15px; line-height: 1.6; color: ${COLORS.ink}; word-break: break-word;">${message}</div>
            </td>
          </tr>

          <!-- Le bouton de réponse (un tableau à une case : la seule façon d'avoir un bouton partout) -->
          <tr>
            <td style="padding: 26px 28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: ${COLORS.dark}; border: 1px solid ${COLORS.goldLight};">
                    <a href="${escapeHtml(replyLink)}" style="display: inline-block; padding: 12px 22px; font-family: ${MONO}; font-size: 13px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; color: ${COLORS.goldLight};">
                      Répondre à ${escapeHtml(data.firstName)} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 10px 0 0; font-family: ${FONT}; font-size: 13px; line-height: 1.5; color: ${COLORS.muted};">
                Ou clique simplement sur « Répondre » : ta réponse partira directement à cette adresse.
              </p>
            </td>
          </tr>

          <!-- Le pied : d'où vient cet email -->
          <tr>
            <td style="padding: 26px 28px 24px;">
              <p style="margin: 0; padding-top: 16px; border-top: 1px solid ${COLORS.line}; font-family: ${MONO}; font-size: 11px; line-height: 1.6; letter-spacing: 0.5px; color: ${COLORS.muted};">
                Envoyé depuis le formulaire de contact du portfolio.<br>
                Tout le texte de cet email a été saisi par le visiteur.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Fabrique l'email d'une demande de contact.
// data : les champs du formulaire, déjà vérifiés et nettoyés par validation.js
// date : le moment de la réception (maintenant, par défaut)
// Renvoie { subject, text, html }.
export function buildContactEmail(data, date = new Date()) {
  const subject = buildSubject(data);
  const sections = buildSections(data, date);

  return {
    subject,
    text: buildText(data, sections),
    html: buildHtml(data, sections, subject),
  };
}
