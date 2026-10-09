import { useEffect, useId, useRef, useState } from "react";
import TechBadge from "./TechBadge";
import ProjectImage from "./ProjectImage";
import RichText from "../shared/RichText";
import { lockPageScroll, startSmoothScrollIn, unlockPageScroll } from "../../utils/smoothScroll";
import { useLanguage } from "../../i18n/LanguageContext";

// Le glissement du doigt qui fait changer de projet (sur téléphone), comme une pile de cartes :
// la fiche suit le doigt en penchant, et celle du projet voisin apparaît derrière elle.
// - on attend que le doigt ait bougé de SWIPE_START pixels pour savoir ce qu'il fait ;
// - le geste doit être nettement plus horizontal que vertical (SWIPE_RATIO fois plus), sinon c'est un
//   défilement normal de la fiche et on ne fait rien ;
// - relâché après SWIPE_DISTANCE pixels ou plus, on change de projet ; avant, la fiche revient à sa place.
const SWIPE_START = 12;
const SWIPE_RATIO = 2;
const SWIPE_DISTANCE = 60;
// Le temps que met la fiche à finir de sortir de l'écran (ou à revenir), en millisecondes
const SWIPE_LEAVE = 240;
// L'angle dont la fiche penche quand le doigt a parcouru toute sa largeur, en degrés.
// Elle pivote autour du milieu de son bord bas : son haut décrit donc un arc de cercle.
const SWIPE_TILT = 14;
// La fiche de derrière, au début du geste : un peu plus petite et à moitié transparente.
// Elle grandit et s'éclaircit à mesure que celle de devant s'en va.
const BEHIND_SCALE = 0.94;
const BEHIND_OPACITY = 0.55;

// Note un changement de projet : dans quel sens on va ("previous" ou "next"), un compteur qui augmente
// à chaque fois, et si le changement vient d'un glissement du doigt (swiped).
// Le compteur sert à rallumer la flèche même quand on va deux fois de suite dans le même sens.
// (La fonction renvoie une « mise à jour » pour useState : elle reçoit l'état d'avant et donne le nouveau.)
const toward =
  (direction, swiped = false) =>
  (previous) => ({ direction, swiped, count: previous.count + 1 });

// Les deux chevrons des flèches. direction = "previous" (‹) ou "next" (›).
function Chevron({ direction }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={direction === "previous" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
    </svg>
  );
}

// Le contenu d'une fiche : le bouton de fermeture, le visuel, le texte et la barre de boutons.
// Il sert deux fois : pour la fiche ouverte, et pour celle du projet voisin qu'on aperçoit derrière
// pendant un glissement du doigt. Cette dernière n'a ni titleId, ni closeButtonRef, ni onClose :
// elle n'est qu'une image de ce qui arrive.
function ProjectSheet({ project, number, titleId, closeButtonRef, onClose }) {
  const { t } = useLanguage();
  const { title, category, description, details, technos, image, links, linksNote } = project;

  return (
    <>
      <button ref={closeButtonRef} className="modal-close" onClick={onClose} aria-label={t.common.close}>
        ✕
      </button>

      <ProjectImage image={image} title={title} className="modal-image" />

      <div className="modal-content">
        {/* L'en-tête de la fiche : la plaque de référence et le titre, regroupés. C'est ce bloc entier
            qui reste en haut de la modale pendant que le texte défile dessous (voir .modal-heading) */}
        <div className="modal-heading">
          <span className="project-category">
            <span className="project-ref">
              {t.projects.number} {String(number).padStart(2, "0")}
            </span>
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
                <h4>{t.projects.context}</h4>
                <p>
                  <RichText text={details.context} />
                </p>
              </div>
            )}

            {details.role && details.role.length > 0 && (
              <div className="project-detail">
                <h4>{t.projects.role}</h4>
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
                <h4>{t.projects.challenge}</h4>
                <p>
                  <RichText text={details.challenge} />
                </p>
              </div>
            )}

            {details.learned && (
              <div className="project-detail">
                <h4>{t.projects.learned}</h4>
                <p>
                  <RichText text={details.learned} />
                </p>
              </div>
            )}
          </div>
        )}

        <div className="project-detail project-stack">
          <h4>{t.projects.stack}</h4>
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
                <span className="sr-only">{t.common.newTab}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ProjectModal({
  project,
  number,
  total,
  previousProject,
  nextProject,
  onPrevious,
  onNext,
  onClose,
}) {
  const { t } = useLanguage();
  const { slug } = project;
  const titleId = useId();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const behindRef = useRef(null);
  const closeButtonRef = useRef(null);
  // Le dernier changement de projet (voir « toward », plus haut).
  // direction : de quel côté arrive la fiche, "next" (par la droite) ou "previous" (par la gauche),
  // ou null à l'ouverture (elle apparaît alors normalement). Voir .modal-from-… dans le CSS.
  // C'est aussi la flèche qui s'allume un instant après un changement (voir .is-lit dans le CSS).
  const [move, setMove] = useState({ direction: null, swiped: false, count: 0 });
  const { direction } = move;
  // Pendant un glissement du doigt : le projet voisin qu'on laisse voir derrière la fiche.
  // side = lequel ("previous" ou "next") ; slug = la fiche ouverte au moment du geste. Dès que la fiche
  // ouverte change, cette note ne correspond plus à rien : on n'affiche plus de fiche derrière.
  const [peek, setPeek] = useState(null);
  const peekSide = peek && peek.slug === slug ? peek.side : null;
  const behindProject = peekSide === "next" ? nextProject : peekSide === "previous" ? previousProject : null;
  // Les numéros des voisins : on tourne en rond, comme la liste des projets
  const previousNumber = number === 1 ? total : number - 1;
  const nextNumber = number === total ? 1 : number + 1;
  // On ne propose de changer de projet que s'il y en a plusieurs
  const hasNavigation = total > 1;

  function goPrevious() {
    setMove(toward("previous"));
    onPrevious();
  }

  function goNext() {
    setMove(toward("next"));
    onNext();
  }

  // Le défilement fluide à l'intérieur de la fiche, le même que celui de la page (voir startSmoothScrollIn).
  // « slug » dans les dépendances : il est relancé pour la nouvelle fiche à chaque changement de projet.
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
        setMove(toward("previous"));
        onPrevious();
      } else if (hasNavigation && event.key === "ArrowRight") {
        setMove(toward("next"));
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

  // Au doigt, comme une pile de cartes. Vers la gauche : le projet suivant. Vers la droite : le précédent.
  // - La fiche suit le doigt en penchant : elle pivote autour du milieu de son bord bas, son haut part
  //   donc en arc de cercle.
  // - La fiche du projet voisin apparaît derrière elle, et grandit à mesure que celle de devant s'en va.
  // - Relâchée assez loin, la fiche finit de sortir de l'écran et celle de derrière prend sa place ;
  //   relâchée trop tôt, tout revient en place.
  // Pendant le geste, on écrit directement le style des deux fiches (transform, opacity) : passer par
  // l'état React à chaque mouvement du doigt serait trop lent pour suivre.
  // passive : on promet au navigateur de ne pas bloquer le geste, le défilement de la fiche reste fluide.
  useEffect(() => {
    if (!hasNavigation) return;

    const overlay = overlayRef.current;
    let start = null; // où le doigt s'est posé
    let side = null; // le voisin visé une fois le geste reconnu comme horizontal ("previous" ou "next")
    let timer = null; // l'attente pendant que la fiche sort de l'écran ou revient
    let leavingModal = null; // la fiche en train de sortir

    // Règle la fiche de derrière. progress : 0 = au début du geste, 1 = elle a pris toute sa place.
    function placeBehind(progress) {
      const behind = behindRef.current;
      if (!behind) return;
      behind.style.transform = `scale(${BEHIND_SCALE + (1 - BEHIND_SCALE) * progress})`;
      behind.style.opacity = BEHIND_OPACITY + (1 - BEHIND_OPACITY) * progress;
    }

    function handleTouchStart(event) {
      // Un seul doigt (avec deux, c'est un zoom), et pas pendant qu'une fiche est déjà en train de bouger
      start = event.touches.length === 1 && !timer ? event.touches[0] : null;
      side = null;
    }

    function handleTouchMove(event) {
      if (!start) return;

      const moveX = event.touches[0].clientX - start.clientX;
      const moveY = event.touches[0].clientY - start.clientY;

      if (!side) {
        // On attend que le doigt ait un peu bougé, puis on décide une fois pour toutes
        if (Math.abs(moveX) < SWIPE_START && Math.abs(moveY) < SWIPE_START) return;
        if (Math.abs(moveX) < Math.abs(moveY) * SWIPE_RATIO) {
          start = null; // geste vertical : c'est un défilement de la fiche, on ne s'en mêle pas
          return;
        }
      }

      // Le voisin visé dépend du sens du geste. S'il change (le doigt repart de l'autre côté),
      // on demande à React d'afficher l'autre fiche derrière.
      const wantedSide = moveX < 0 ? "next" : "previous";
      if (wantedSide !== side) {
        side = wantedSide;
        setPeek({ side, slug });
      }

      // La fiche de devant suit le doigt et penche du côté où elle part
      const modal = modalRef.current;
      const width = modal.offsetWidth;
      modal.style.transition = "none";
      modal.style.transformOrigin = "50% 100%";
      modal.style.transform = `translateX(${moveX}px) rotate(${(moveX / width) * SWIPE_TILT}deg)`;

      // Celle de derrière a pris toute sa place quand le doigt a parcouru 60 % de la largeur
      if (behindRef.current) behindRef.current.style.transition = "none";
      placeBehind(Math.min(Math.abs(moveX) / (width * 0.6), 1));
    }

    function handleTouchEnd(event) {
      if (!start || !side) {
        start = null;
        return;
      }

      const moveX = event.changedTouches[0].clientX - start.clientX;
      const chosenSide = side;
      const modal = modalRef.current;
      const behind = behindRef.current;
      start = null;
      side = null;

      const ease = `${SWIPE_LEAVE}ms ease-out`;
      modal.style.transition = `transform ${ease}, opacity ${ease}`;
      if (behind) behind.style.transition = `transform ${ease}, opacity ${ease}`;

      // Pas assez loin : la fiche revient à sa place, celle de derrière s'efface
      if (Math.abs(moveX) < SWIPE_DISTANCE) {
        modal.style.transform = "";
        placeBehind(0);
        timer = setTimeout(() => {
          timer = null;
          setPeek(null);
        }, SWIPE_LEAVE);
        return;
      }

      // Assez loin : la fiche finit de sortir en continuant son arc, celle de derrière prend toute la place.
      // Puis on change de projet : la fiche de derrière DEVIENT la fiche ouverte (c'est le même élément
      // de la page, voir « key » plus bas), il n'y a donc ni saut ni image qui se recharge.
      const isNext = chosenSide === "next";
      const tilt = SWIPE_TILT * 1.8 * (isNext ? -1 : 1);
      modal.style.transform = `translateX(${isNext ? "-120%" : "120%"}) rotate(${tilt}deg)`;
      modal.style.opacity = 0;
      placeBehind(1);
      leavingModal = modal;
      timer = setTimeout(() => {
        timer = null;
        if (behind) behind.style.transition = "";
        setMove(toward(chosenSide, true));
        if (isNext) onNext();
        else onPrevious();
      }, SWIPE_LEAVE);
    }

    overlay.addEventListener("touchstart", handleTouchStart, { passive: true });
    overlay.addEventListener("touchmove", handleTouchMove, { passive: true });
    overlay.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      // Si tout est défait pendant qu'une fiche sortait (fermeture de la modale, par exemple),
      // on annule le changement de projet et on remet la fiche à sa place
      if (timer) {
        clearTimeout(timer);
        if (leavingModal) {
          leavingModal.style.transform = "";
          leavingModal.style.opacity = "";
        }
      }
      overlay.removeEventListener("touchstart", handleTouchStart);
      overlay.removeEventListener("touchmove", handleTouchMove);
      overlay.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onPrevious, onNext, hasNavigation, slug]);

  // La classe de la fiche ouverte selon la façon dont elle est arrivée :
  // - après un glissement du doigt, elle était déjà là, derrière : aucune animation ;
  // - après une flèche ou une touche du clavier, elle glisse depuis le côté ;
  // - à l'ouverture, rien de plus : c'est l'animation normale de .modal.
  let arrival = "";
  if (move.swiped) arrival = "modal-swiped";
  else if (direction) arrival = `modal-from-${direction}`;

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
      {/* La fiche du projet voisin, visible seulement pendant un glissement du doigt, derrière la fiche
          ouverte. inert : on ne peut ni cliquer dedans ni y aller au clavier, et un lecteur d'écran l'ignore.
          Son style de départ (plus petite, à moitié transparente) est ensuite modifié pendant le geste. */}
      {behindProject && (
        <div
          key={behindProject.slug}
          ref={behindRef}
          className="modal modal-behind"
          style={{ transform: `scale(${BEHIND_SCALE})`, opacity: BEHIND_OPACITY }}
          inert
        >
          <ProjectSheet
            project={behindProject}
            number={peekSide === "next" ? nextNumber : previousNumber}
          />
        </div>
      )}

      {/* key={slug} : chaque fiche est reconnue par le nom de son projet.
          - Avec une flèche ou le clavier, React remplace la fiche par une nouvelle : elle repart du haut
            et son animation d'arrivée se joue.
          - Après un glissement du doigt, la fiche de derrière porte déjà cette key : React la garde et en
            fait la fiche ouverte, sans rien recréer.
          data-lenis-prevent : à l'intérieur de la modale, la molette fait défiler la modale elle-même.
          Sans cet attribut, le défilement fluide de la PAGE (smoothScroll.js) prendrait la molette
          pour lui, et la modale ne bougerait pas. La fiche a son propre défilement fluide (voir plus haut). */}
      <div
        key={slug}
        ref={modalRef}
        className={`modal ${arrival}`}
        data-lenis-prevent
        onClick={(event) => event.stopPropagation()}
      >
        <ProjectSheet
          project={project}
          number={number}
          titleId={titleId}
          closeButtonRef={closeButtonRef}
          onClose={onClose}
        />
      </div>

      {/* Les flèches pour passer d'un projet à l'autre, posées sur le fond, en dehors de la fiche :
          de chaque côté sur grand écran, sous la fiche avec le compteur sur petit écran (voir .modal-nav).
          stopPropagation : sans lui, le clic remonterait jusqu'au fond, qui fermerait la modale.
          Le compteur est un décor (aria-hidden) : le nom du projet visé est déjà dans l'étiquette
          de chaque flèche, lue par les lecteurs d'écran.
          is-lit : la flèche qui vient de servir s'allume un instant puis s'éteint (clic, touche du
          clavier ou glissement du doigt). Sa « key » change à chaque utilisation (grâce au compteur) :
          React recrée alors le bouton, et l'animation d'allumage repart du début. */}
      {hasNavigation && (
        <div className="modal-nav">
          <button
            key={direction === "previous" ? `previous-${move.count}` : "previous"}
            type="button"
            className={`modal-nav-button ${direction === "previous" ? "is-lit" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              goPrevious();
            }}
            aria-label={t.projects.previous(previousProject.title)}
          >
            <Chevron direction="previous" />
          </button>

          <span className="modal-nav-count" aria-hidden="true">
            {t.projects.count} {String(number).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          <button
            key={direction === "next" ? `next-${move.count}` : "next"}
            type="button"
            className={`modal-nav-button ${direction === "next" ? "is-lit" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            aria-label={t.projects.next(nextProject.title)}
          >
            <Chevron direction="next" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectModal;
