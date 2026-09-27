import TechBadge from "./TechBadge";
import ProjectImage from "./ProjectImage";
import RichText from "./RichText";

// Sur la carte, on ne montre que les premières technos : la liste complète est dans la modale
const MAX_TECHNOS = 4;

function ProjectCard({ number, title, category, description, technos, image, onClick }) {
  // slice(0, 4) : une copie des 4 premiers éléments (le tableau d'origine n'est pas modifié)
  const visibleTechnos = technos.slice(0, MAX_TECHNOS);
  const hiddenCount = technos.length - visibleTechnos.length;

  return (
    <article className="project-card">
      <div className="project-image">
        <ProjectImage image={image} title={title} />
      </div>

      <div className="project-header">
        <div>
          <span className="project-category">
            <span className="project-ref">N° {String(number).padStart(2, "0")}</span>
            {category}
          </span>
          <h3 className="project-title">
            {/* Un vrai bouton : on peut ouvrir le projet au clavier (Tab puis Entrée).
                Grâce au CSS, sa zone cliquable recouvre toute la carte. */}
            <button type="button" className="project-open" onClick={onClick}>
              {title}
            </button>
          </h3>
        </div>
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