import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { getSiteTop, scrollToSiteTop } from "../../utils/siteTop";
import { scrollToElement } from "../../utils/smoothScroll";

// À chaque changement d'adresse :
// - s'il y a une ancre (#contact), on fait défiler jusqu'à la section ;
// - si on a changé de page, on se place en haut de la nouvelle (sous l'intro si elle est là) ;
// - si on est resté sur la même page et que l'ancre a disparu (un clic sur le logo depuis
//   /#projets, par exemple), on remonte en douceur jusqu'au haut du site.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  // La page d'avant, pour savoir si on vient d'en changer (un ref garde une valeur entre deux affichages)
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const isSamePage = previousPathname.current === pathname;
    previousPathname.current = pathname;

    if (hash) {
      // On attend que React ait affiché la page avant de chercher la section
      requestAnimationFrame(() => {
        const section = document.querySelector(hash);
        if (section) scrollToElement(section);
      });
      return;
    }

    if (isSamePage) scrollToSiteTop();
    else window.scrollTo(0, getSiteTop());
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;
