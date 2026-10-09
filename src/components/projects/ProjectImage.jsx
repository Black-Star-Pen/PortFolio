import { useLanguage } from "../../i18n/LanguageContext";
import projectImages from "../../data/projectImages.json";

// L'image d'un projet.
// S'il n'y a pas encore de capture, on affiche un visuel de remplacement
// dans le style du site : un plan quadrillé avec le nom du projet.
//
// sizes : la place que l'image occupe à l'écran, donnée par celui qui l'affiche (une carte est bien
// plus étroite que la fiche du projet). Le navigateur s'en sert pour choisir sa version, voir plus bas.
function ProjectImage({ image, title, sizes, className = "" }) {
  const { t } = useLanguage();

  if (image) {
    // Chaque capture existe en plusieurs largeurs (fabriquées par « npm run images », qui en écrit la
    // liste dans projectImages.json). srcSet les annonce toutes au navigateur avec leur largeur
    // (« 480w » = 480 pixels de large) ; à lui de télécharger la plus petite qui suffit. Un téléphone
    // qui affiche une carte ne charge donc pas la grande image de la fiche.
    // Une image absente de la liste garde simplement son adresse d'origine (src).
    const versions = projectImages[image];
    const srcSet = versions?.map((version) => `${version.src} ${version.width}w`).join(", ");

    // loading="lazy" : le navigateur ne télécharge l'image que lorsqu'on s'en approche en défilant.
    // Les projets sont loin sous le haut de la page : inutile de la charger dès l'arrivée.
    return (
      <img
        className={className}
        src={image}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={t.projects.imageAlt(title)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`project-placeholder ${className}`}
      role="img"
      aria-label={t.projects.placeholderLabel(title)}
    >
      <span className="project-placeholder-ref">{t.projects.placeholderRef}</span>
      <span className="project-placeholder-title">{title}</span>
      <span className="project-placeholder-note">{t.projects.placeholderNote}</span>
    </div>
  );
}

export default ProjectImage;
