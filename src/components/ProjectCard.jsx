import TechBadge from "./TechBadge";


function ProjectCard({ title, category, description, technos, image, onClick }) {
  return (
    <article className="project-card" onClick={onClick}>
      <div className="project-image">
        <img src={image} alt={`Aperçu du projet ${title}`} />
      </div>

      <div className="project-header">
        <div>
          <span className="project-category">{category}</span>
          <h3>{title}</h3>
        </div>
        <span className="project-link" aria-hidden="true">
          ↗
        </span>
      </div>

      <div className="project-body">
        <p>{description}</p>
        <ul className="project-technos">
          {technos.map((techno) => (
            <TechBadge key={techno} name={techno}/>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default ProjectCard;