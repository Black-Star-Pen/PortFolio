// L'adresse de l'API (le serveur du formulaire de contact).
// En développement : "" (le proxy Vite redirige /api vers le serveur local).
// En production : l'adresse de l'API en ligne, donnée par la variable d'environnement VITE_API_URL.
export const API_URL = import.meta.env.VITE_API_URL || "";

// Réveille l'API. Sur une offre d'hébergement gratuite, le serveur s'endort quand personne ne l'appelle,
// et sa première réponse peut alors mettre près d'une minute. On l'appelle donc dès l'arrivée sur le site :
// le temps que le visiteur lise la page et remplisse le formulaire, il est prêt.
// On n'attend pas la réponse, et un échec n'a aucune importance.
export function wakeApi() {
  fetch(`${API_URL}/api/health`).catch(() => {});
}
