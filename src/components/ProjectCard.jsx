import TechBadge from "./TechBadge";
import ProjectImage from "./ProjectImage";
import RichText from "./RichText";

// Sur la carte, on ne montre que les premières technos : la liste complète est dans la modale
const MAX_TECHNOS = 4;

// La carte se lit en quatre étages, séparés par un filet (voir .project-card dans le CSS) :
//   1. le visuel
//   2. la référence : le numéro du projet et son type
//   3. le titre
//   4. la description et les technos
function ProjectCard({ number, title, category, description, technos, image, onClick }) {
  // slice(0, 4) : une copie des 4 premiers éléments (le tableau d'origine n'est pas modifié)
  const visibleTechnos = technos.slice(0, MAX_TECHNOS);
  const hiddenCount = technos.length - visibleTechnos.length;

  return (
    // Le clic est écouté sur toute la carte : où qu'on clique (le titre, l'image, une techno…),
    // l'événement « remonte » jusqu'ici et ouvre le projet.
    <article className="project-card" onClick={onClick}>
      {/* Le trait lumineux qui balaie la carte de haut en bas quand elle apparaît (voir reveal-scan
          dans le CSS). Purement décoratif : aria-hidden le cache aux lecteurs d'écran. */}
      <span className="project-scan" aria-hidden="true"></span>

      <div className="project-image">
        <ProjectImage image={image} title={title} />
      </div>

      <div className="project-meta">
        <span className="project-ref">N° {String(number).padStart(2, "0")}</span>
        <span className="project-category">{category}</span>
      </div>

      <div className="project-header">
        <h3 className="project-title">
          {/* Un vrai bouton : on peut ouvrir le projet au clavier (Tab puis Entrée).
              Il n'a pas son propre onClick : l'activer déclenche un clic, qui remonte jusqu'à la carte.
              Grâce au CSS, sa zone cliquable recouvre toute la carte. */}
          <button type="button" className="project-open">
            {title}
          </button>
        </h3>
        <span className="project-link" aria-hidden="true">
          ↗
        </span>
      </div>

      <div className="project-body">
        <p>
          <RichText text={description} />
        </p>
        <ul className="project-technos">
          {visibleTechnos.map((techno) => (
            <TechBadge key={techno} name={techno} />
          ))}
          {hiddenCount > 0 && (
            <li className="tech-badge tech-badge-more">
              +{hiddenCount}
              <span className="sr-only"> autres technologies</span>
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}

export default ProjectCard;
