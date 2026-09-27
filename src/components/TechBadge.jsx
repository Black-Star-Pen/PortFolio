import { useState } from "react";
import technoIcons from "../data/technoIcons";

function TechBadge({ name }) {
  const slug = technoIcons[name];
  // Si le logo ne se charge pas (nom inconnu, réseau…), on le cache
  // au lieu d'afficher une image cassée : il reste le texte.
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <li className="tech-badge">
      {slug && !iconFailed && (
        <img
          src={`https://cdn.simpleicons.org/${slug}/d6bf94`}
          alt=""
          width="20"
          height="20"
          onError={() => setIconFailed(true)}
        />
      )}
      {name}
    </li>
  );
}

export default TechBadge;