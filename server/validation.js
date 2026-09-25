// Les valeurs autorisées pour les champs à choix
const REQUEST_TYPES = ["site", "application", "recrutement", "autre"];
const CONTRACT_TYPES = ["cdi", "cdd", "alternance", "stage", "freelance"];
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
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (!EMAIL_PATTERN.test(data.email)) {
    errors.email = "Adresse email invalide.";
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