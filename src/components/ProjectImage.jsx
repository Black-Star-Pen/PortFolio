// L'image d'un projet.
// S'il n'y a pas encore de capture, on affiche un visuel de remplacement
// dans le style du site : un plan quadrillé avec le nom du projet.
function ProjectImage({ image, title, className = "" }) {
  if (image) {
    // loading="lazy" : le navigateur ne télécharge l'image que lorsqu'on s'en approche en défilant.
    // Les projets sont loin sous le haut de la page : inutile de la charger dès l'arrivée.
    return (
      <img
        className={className}
        src={image}
        alt={`Aperçu du projet ${title}`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`project-placeholder ${className}`}
      role="img"
      aria-label={`Projet ${title} : capture à venir`}
    >
      <span className="project-placeholder-ref">Plan · vue d'ensemble</span>
      <span className="project-placeholder-title">{title}</span>
      <span className="project-placeholder-note">Capture à venir</span>
    </div>
  );
}

export default ProjectImage;