import { useEffect } from "react";

function ProjectModal({ project, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <img
          className="modal-image"
          src={project.image}
          alt={`Aperçu du projet ${project.title}`}
        />

        <div className="modal-content">
          <span className="project-category">{project.category}</span>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          {project.details && <p>{project.details}</p>}

          <ul className="project-technos">
            {project.technos.map((techno) => (
              <li key={techno}>{techno}</li>
            ))}
          </ul>

          <a
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            Voir le code sur GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export default ProjectModal;
