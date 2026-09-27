import TechBadge from "./TechBadge";
import ProjectImage from "./ProjectImage";

function ProjectCard({ title, category, description, technos, image, onClick }) {
  return (
    <article className="project-card">
      <div className="project-image">
        <ProjectImage image={image} title={title} />
      </div>

      <div className="project-header">
        <div>
          <span className="project-category">{category}</span>
          <h3>
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
        <p>{description}</p>
        <ul className="project-technos">
          {technos.map((techno) => (
            <TechBadge key={techno} name={techno} />
          ))}
        </ul>
      </div>
    </article>
  );
}

export default ProjectCard;