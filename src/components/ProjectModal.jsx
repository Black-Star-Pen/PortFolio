import { useEffect, useId, useRef, useState } from "react";
import TechBadge from "./TechBadge";
import ProjectImage from "./ProjectImage";
import RichText from "./RichText";
import { lockPageScroll, startSmoothScrollIn, unlockPageScroll } from "../utils/smoothScroll";

// Le glissement du doigt qui fait changer de projet (sur téléphone) :
// il doit parcourir au moins SWIPE_DISTANCE pixels à l'horizontale, et être nettement plus horizontal
// que vertical (SWIPE_RATIO fois plus). Sinon, c'est un défilement normal de la fiche : on ne fait rien.
const SWIPE_DISTANCE = 60;
const SWIPE_RATIO = 2;

// Les deux chevrons des flèches. direction = "previous" (‹) ou "next" (›).
function Chevron({ direction }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={direction === "previous" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
    </svg>
  );
}

function ProjectModal({
  project,
  number,
  total,
  previousTitle,
  nextTitle,
  onPrevious,
  onNext,
  onClose,
}) {
  const { slug, title, category, description, details, technos, image, links, linksNote } = project;
  const titleId = useId();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  // De quel côté arrive la fiche : "next" (par la droite), "previous" (par la gauche),
  // ou null à l'ouverture (elle apparaît alors normalement). Voir .modal-from-… dans le CSS.
  const [direction, setDirection] = useState(null);
  // On ne propose de changer de projet que s'il y en a plusieurs
  const hasNavigation = total > 1;

  function goPrevious() {
    setDirection("previous");
    onPrevious();
  }

  function goNext() {
    setDirection("next");
    onNext();
  }

  // Le défilement fluide à l'intérieur de la fiche, le même que celui de la page (voir startSmoothScrollIn).
  // La fiche est remplacée par une nouvelle à chaque changement de projet (key={slug}, plus bas) :
  // « slug » dans les dépendances relance donc le défilement fluide sur la nouvelle fiche.
  useEffect(() => startSmoothScrollIn(modalRef.current), [slug]);

  useEffect(() => {
    // On retient l'élément qui avait le focus (la carte cliquée)...
    const previousFocus = document.activeElement;
    // ...et on place le focus dans la modale (preventScroll : sans faire défiler la fiche,
    // sinon le navigateur la décale de quelques pixels pour « montrer » le bouton)
    closeButtonRef.current.focus({ preventScroll: true });
    // La page derrière ne défile plus tant que la modale est ouverte
    lockPageScroll();

    // Au clavier : Échap ferme, les flèches gauche et droite changent de projet
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      } else if (hasNavigation && event.key === "ArrowLeft") {
        setDirection("previous");
        onPrevious();
      } else if (hasNavigation && event.key === "ArrowRight") {
        setDirection("next");
        onNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      unlockPageScroll();
      window.removeEventListener("keydown", handleKeyDown);
      // À la fermeture, le focus revient sur la carte
      previousFocus?.focus();
    };
  }, [onClose, onPrevious, onNext, hasNavigation]);

  // Au doigt : glisser vers la gauche montre le projet suivant, vers la droite le précédent.
  // On note où le doigt se pose, puis où il se lève, et on compare.
  // passive : on promet au navigateur de ne pas bloquer le geste, le défilement de la fiche reste fluide.
  useEffect(() => {
    if (!hasNavigation) return;

    const overlay = overlayRef.current;
    let start = null;

    function handleTouchStart(event) {
      // Un seul doigt : avec deux, c'est un zoom
      start = event.touches.length === 1 ? event.touches[0] : null;
    }

    function handleTouchEnd(event) {
      if (!start) return;

      const end = event.changedTouches[0];
      const moveX = end.clientX - start.clientX;
      const moveY = end.clientY - start.clientY;
      start = null;

      if (Math.abs(moveX) < SWIPE_DISTANCE || Math.abs(moveX) < Math.abs(moveY) * SWIPE_RATIO) return;

      if (moveX < 0) {
        setDirection("next");
        onNext();
      } else {
        setDirection("previous");
        onPrevious();
      }
    }

    overlay.addEventListener("touchstart", handleTouchStart, { passive: true });
    overlay.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      overlay.removeEventListener("touchstart", handleTouchStart);
      overlay.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onPrevious, onNext, hasNavigation]);

  return (
    // role="dialog" est posé sur le fond (et pas sur la fiche) : la fenêtre de dialogue comprend la fiche
    // ET les deux flèches, qui sont en dehors de la fiche. Un lecteur d'écran y a ainsi accès.
    <div
      className="modal-overlay project-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      {/* key={slug} : quand on change de projet, React remplace la fiche par une nouvelle au lieu de
          modifier l'ancienne. Elle repart donc du haut, et son animation d'arrivée se rejoue.
          data-lenis-prevent : à l'intérieur de la modale, la molette fait défiler la modale elle-même.
          Sans cet attribut, le défilement fluide de la PAGE (smoothScroll.js) prendrait la molette
          pour lui, et la modale ne bougerait pas. La fiche a son propre défilement fluide (voir plus haut). */}
      <div
        key={slug}
        ref={modalRef}
        className={`modal ${direction ? `modal-from-${direction}` : ""}`}
        data-lenis-prevent
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

      {/* Les flèches pour passer d'un projet à l'autre, posées sur le fond, en dehors de la fiche :
          de chaque côté sur grand écran, sous la fiche avec le compteur sur petit écran (voir .modal-nav).
          stopPropagation : sans lui, le clic remonterait jusqu'au fond, qui fermerait la modale.
          Le compteur est un décor (aria-hidden) : le nom du projet visé est déjà dans l'étiquette
          de chaque flèche, lue par les lecteurs d'écran. */}
      {hasNavigation && (
        <div className="modal-nav">
          <button
            type="button"
            className="modal-nav-button"
            onClick={(event) => {
              event.stopPropagation();
              goPrevious();
            }}
            aria-label={`Projet précédent : ${previousTitle}`}
          >
            <Chevron direction="previous" />
          </button>

          <span className="modal-nav-count" aria-hidden="true">
            Projet {String(number).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          <button
            type="button"
            className="modal-nav-button"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            aria-label={`Projet suivant : ${nextTitle}`}
          >
            <Chevron direction="next" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectModal;