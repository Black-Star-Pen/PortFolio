function ProjectCard({ title, category, description, technos, image, link }) {
  return (
    <article className="project-card">
      <div className="project-image">
        <img src={image} alt={`Aperçu du projet ${title}`} />
      </div>

      <div className="project-header">
        <div>
          <span className="project-category">{category}</span>
          <h3>{title}</h3>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="project-link"
          aria-label={`Voir le projet ${title}`}
        >
          ↗
        </a>
      </div>

      <div className="project-body">
        <p>{description}</p>
        <ul className="project-technos">
          {technos.map((techno) => (
            <li key={techno}>{techno}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default ProjectCard;