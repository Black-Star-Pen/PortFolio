import { useEffect, useId, useRef } from "react";
import TechBadge from "./TechBadge";
import ProjectImage from "./ProjectImage";
import RichText from "./RichText";

function ProjectModal({ project, number, onClose }) {
  const { title, category, description, details, technos, image, links, linksNote } = project;
  const titleId = useId();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    // On retient l'élément qui avait le focus (la carte cliquée)...
    const previousFocus = document.activeElement;
    // ...et on place le focus dans la modale
    closeButtonRef.current.focus();
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
      // À la fermeture, le focus revient sur la carte
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button ref={closeButtonRef} className="modal-close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <ProjectImage image={image} title={title} className="modal-image" />

        <div className="modal-content">
          {/* L'en-tête de la fiche : la plaque de référence et le titre, regroupés. C'est ce bloc entier
              qui reste en haut de la modale pendant que le texte défile dessous (voir .modal-heading) */}
          <div className="modal-heading">
            <span className="project-category">
              <span className="project-ref">N° {String(number).padStart(2, "0")}</span>
              {category}
            </span>
            <h3 id={titleId} className="project-title">
              {title}
            </h3>
          </div>

          <p className="project-lead">
            <RichText text={description} />
          </p>

          {details && (
            <div className="project-details">
              {details.context && (
                <div className="project-detail">
                  <h4>Contexte</h4>
                  <p>
                    <RichText text={details.context} />
                  </p>
                </div>
              )}

              {details.role && details.role.length > 0 && (
                <div className="project-detail">
                  <h4>Mon rôle</h4>
                  <ul className="project-role">
                    {details.role.map((item) => (
                      <li key={item}>
                        <RichText text={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {details.challenge && (
                <div className="project-detail">
                  <h4>Le défi</h4>
                  <p>
                    <RichText text={details.challenge} />
                  </p>
                </div>
              )}

              {details.learned && (
                <div className="project-detail">
                  <h4>Ce que j'ai appris</h4>
                  <p>
                    <RichText text={details.learned} />
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="project-detail project-stack">
            <h4>Stack technique</h4>
            <ul className="project-technos">
              {technos.map((techno) => (
                <TechBadge key={techno} name={techno} />
              ))}
            </ul>
          </div>
        </div>

        {/* Les boutons sont en dehors de .modal-content, directement dans la boîte qui défile :
            ainsi, ils restent collés en bas pendant tout le défilement (voir .project-actions) */}
        {links && links.length > 0 && (
          <div className="project-actions">
            {/* Une petite précision facultative (ex. : site lent au premier chargement).
                Elle est écrite AVANT les boutons, mais le CSS l'affiche sous eux sur grand écran.
                Sur téléphone, où la place manque, elle quitte la barre : elle reste à la fin du texte,
                et seuls les boutons restent collés en bas (voir .project-actions dans la section Mobile). */}
            {linksNote && (
              <p className="project-actions-note">
                <RichText text={linksNote} />
              </p>
            )}

            <div className="project-actions-buttons">
              {links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  {link.label} <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectModal;