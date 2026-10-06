import { Link } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle";

function NotFound() {
  usePageTitle("Page introuvable");

  return (
    <section className="not-found">
      <p className="not-found-code">ERREUR 404</p>
      <h1>
        Pièce <span className="accent">introuvable</span>.
      </h1>
      <p>Cette page n'existe pas, ou elle est encore sur l'établi.</p>
      <Link to="/" className="btn btn-primary">
        Retour à l'accueil
      </Link>
    </section>
  );
}

export default NotFound;