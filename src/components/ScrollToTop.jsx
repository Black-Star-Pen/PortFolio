import { useEffect } from "react";
import { useLocation } from "react-router";

// À chaque changement de page :
// - s'il y a une ancre (#contact), on fait défiler jusqu'à la section ;
// - sinon, on revient en haut de la nouvelle page.
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // On attend que React ait affiché la page avant de chercher la section
      requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView();
      });
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;