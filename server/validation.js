import { resolveMx } from "node:dns/promises";

// Les valeurs autorisées pour les champs à choix
const REQUEST_TYPES = ["site", "application", "recrutement", "autre"];
// Les contrats : la même liste que dans le formulaire (contractTypes, src/components/ContactForm.jsx),
// sans « freelance », qui y est affiché comme indisponible
const CONTRACT_TYPES = ["cdi", "cdd"];
const REMOTE_OPTIONS = ["", "site", "hybride", "remote"];

// Longueurs maximales : empêchent l'envoi de textes gigantesques
const MAX_LENGTH = {
  firstName: 50,
  lastName: 50,
  email: 254,
  company: 100,
  position: 100,
  city: 100,
  message: 5000,
};

const NAME_PATTERN = /^\p{L}[\p{L}\s'’-]*$/u;
// Forme stricte : caractères autorisés, un seul @, et une extension d'au moins 2 lettres
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

function isEmailValid(email) {
  return EMAIL_PATTERN.test(email) && !email.includes("..") && !email.startsWith(".") && !email.includes(".@");
}

// Garde en mémoire les domaines déjà vérifiés, pour ne pas interroger le DNS à chaque fois
const mailServerCache = new Map();

// Le domaine de l'adresse possède-t-il un serveur de messagerie ?
async function hasMailServer(domain) {
  if (mailServerCache.has(domain)) return mailServerCache.get(domain);

  try {
    const records = await resolveMx(domain);
    const result = records.length > 0;
    mailServerCache.set(domain, result);
    return result;
  } catch (error) {
    // Le domaine n'existe pas, ou n'a aucun serveur de messagerie
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      mailServerCache.set(domain, false);
      return false;
    }
    // DNS injoignable : on ne bloque pas un vrai visiteur
    return true;
  }
}

// Transforme n'importe quelle valeur en texte propre (sans espaces autour)
function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Vérifie auprès du service officiel que la ville correspond au code postal
async function isCityValid(postalCode, city) {
  try {
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom&format=json`
    );
    if (!response.ok) return true; // service indisponible : on ne bloque pas l'envoi
    const communes = await response.json();
    // Comparaison sans tenir compte des majuscules ni des accents : "paris" = "Paris"
    return communes.some(
      (commune) => commune.nom.localeCompare(city, "fr", { sensitivity: "base" }) === 0
    );
  } catch {
    return true; // idem si le service ne répond pas
  }
}

// Reçoit le corps brut de la requête, renvoie { data, errors }
export async function validateContact(body = {}) {
  // 1. On ne garde QUE les champs attendus, nettoyés
  const data = {
    type: clean(body.type),
    firstName: clean(body.firstName),
    lastName: clean(body.lastName),
    email: clean(body.email).toLowerCase(),
    message: clean(body.message),
  };

  const errors = {};

  // 2. Les règles communes à toutes les demandes
  if (!REQUEST_TYPES.includes(data.type)) {
    errors.type = "Type de demande invalide.";
  }
  if (!NAME_PATTERN.test(data.firstName)) {
    errors.firstName = "Prénom invalide.";
  }
  if (!NAME_PATTERN.test(data.lastName)) {
    errors.lastName = "Nom invalide.";
  }
  if (!isEmailValid(data.email)) {
    errors.email = "Adresse email invalide.";
  } else if (!(await hasMailServer(data.email.split("@")[1]))) {
    errors.email = "Ce domaine ne reçoit pas d'emails. Vérifiez l'adresse.";
  }
  if (data.message.length < 20) {
    errors.message = "Le message doit contenir au moins 20 caractères.";
  }

  // 3. Les règles propres au recrutement
  if (data.type === "recrutement") {
    data.company = clean(body.company);
    data.position = clean(body.position);
    data.contract = clean(body.contract);
    data.remote = clean(body.remote);
    data.postalCode = clean(body.postalCode);
    data.city = clean(body.city);

    if (data.company.length < 2) {
      errors.company = "Entreprise manquante.";
    }
    if (data.position.length < 2) {
      errors.position = "Intitulé du poste manquant.";
    }
    if (!CONTRACT_TYPES.includes(data.contract)) {
      errors.contract = "Type de contrat invalide.";
    }
    if (!REMOTE_OPTIONS.includes(data.remote)) {
      errors.remote = "Mode de travail invalide.";
    }
    if (!/^\d{5}$/.test(data.postalCode)) {
      errors.postalCode = "Le code postal doit contenir 5 chiffres.";
    } else if (!(await isCityValid(data.postalCode, data.city))) {
      errors.city = "La ville ne correspond pas au code postal.";
    }
  }

  // 4. Les longueurs maximales, pour tous les champs présents
  for (const [field, max] of Object.entries(MAX_LENGTH)) {
    if (data[field] && data[field].length > max) {
      errors[field] = `Ce champ ne doit pas dépasser ${max} caractères.`;
    }
  }

  return { data, errors };
}