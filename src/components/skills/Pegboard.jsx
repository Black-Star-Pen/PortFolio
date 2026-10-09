import { useEffect, useRef } from "react";

// Le panneau perforé : le fond de la section Compétences. C'est le panneau à trous sur lequel on
// accroche les outils dans un atelier : une grille de points discrets, qui s'éclairent autour du curseur.
// Les points sont dessinés en CSS (voir « Le panneau perforé », section 12). Ce composant ne fait que
// dire au CSS où se trouve le curseur, avec deux variables : --light-x et --light-y.
function Pegboard() {
  const boardRef = useRef(null);

  useEffect(() => {
    // Sur un écran tactile, il n'y a pas de curseur : le panneau reste un simple fond de points
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;

    const board = boardRef.current;
    let pointerX = -9999; // la position du curseur à l'écran ; au départ, « très loin »
    let pointerY = -9999;
    let isOnScreen = false;
    let frame = 0;

    // Place la lumière sous le curseur. Le curseur est donné par rapport à l'écran, le CSS veut une
    // position par rapport au panneau : on retire donc le coin du panneau.
    function place() {
      frame = 0;
      const box = board.getBoundingClientRect();
      board.style.setProperty("--light-x", `${pointerX - box.left}px`);
      board.style.setProperty("--light-y", `${pointerY - box.top}px`);
    }

    // Une seule mise à jour par image, même si la souris envoie dix positions entre deux images
    function schedule() {
      if (isOnScreen && !frame) frame = requestAnimationFrame(place);
    }

    function onPointerMove(event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      schedule();
    }

    // On ne travaille que quand la section est à l'écran
    const observer = new IntersectionObserver(([entry]) => {
      isOnScreen = entry.isIntersecting;
    });
    observer.observe(board);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    // Quand on fait défiler, le panneau glisse sous un curseur immobile : la lumière doit le suivre
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", schedule);
    };
  }, []);

  return (
    // aria-hidden : un décor, les lecteurs d'écran l'ignorent
    <div className="section-bg" aria-hidden="true">
      <div className="pegboard" ref={boardRef}>
        {/* La lumière : un petit bloc de points plus clairs, qui suit le curseur */}
        <span className="pegboard-light" />
      </div>
    </div>
  );
}

export default Pegboard;
