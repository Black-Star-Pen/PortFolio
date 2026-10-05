import { useLayoutEffect } from "react";
import { useLocation } from "react-router";

// Les blocs qui apparaissent au défilement, et l'effet « atelier » de chacun
// (le Hero a sa propre animation). Pour animer un nouveau bloc, ajoute une ligne ici.
//   laser   : découpé par un trait laser, de gauche à droite
//   cut     : le texte se révèle comme une découpe qui avance
//   unfold  : se déplie de haut en bas, comme un plan qu'on déroule
//   lift    : se lève en 3D, comme une pièce qu'on redresse sur l'établi
//   stamp   : frappé comme une tôle à la presse, avec un éclat doré
//   rise    : monte doucement avec un halo
const TARGETS = [
  { selector: ".section-title", effect: "laser" },
  { selector: ".about-text > p", effect: "cut" },
  { selector: ".timeline", effect: "unfold" },
  { selector: ".blueprint", effect: "unfold" },
  { selector: ".projects-grid > *", effect: "lift" },
  { selector: ".work-order", effect: "stamp" },
  { selector: ".contact-divider", effect: "cut" },
  { selector: ".contact-links", effect: "rise" },
  { selector: ".legal-content", effect: "unfold" },
  { selector: ".not-found > *", effect: "rise" },
];

// Fait apparaître chaque bloc la première fois qu'il arrive à l'écran.
// Comme ScrollToTop, ce composant n'affiche rien : il agit seulement sur la page.
function ScrollReveal() {
  const { pathname } = useLocation();

  // useLayoutEffect (et pas useEffect) : il s'exécute AVANT que le navigateur affiche la page.
  // Les blocs sont donc cachés d'emblée, sans « flash » où on les verrait une fraction de seconde.
  useLayoutEffect(() => {
    // Réglage « réduire les animations » : on ne cache rien, tout reste affiché normalement
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const elements = [];

    TARGETS.forEach(({ selector, effect }) => {
      document.querySelectorAll(`main ${selector}`).forEach((element) => {
        // Décalage en cascade entre voisins du même type (ex. : les cartes, les paragraphes)
        const siblings = [...element.parentElement.children].filter((child) =>
          child.matches(selector)
        );
        const order = Math.min(siblings.indexOf(element), 4);
        element.style.setProperty("--reveal-delay", `${order * 0.2}s`);
        element.classList.add("reveal", `reveal-${effect}`);
        elements.push(element);
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            // Une seule fois : on arrête de surveiller ce bloc
            observer.unobserve(entry.target);
          }
        });
      },
      // -15 % en bas : le bloc apparaît quand il est bien entré à l'écran, pas au ras du bord
      { rootMargin: "0px 0px -15% 0px", threshold: 0.1 }
    );

    elements.forEach((element) => observer.observe(element));

    // Les cordons de soudure entre les sections : chacun se soude quand le haut de sa section
    // arrive aux 4/5 de l'écran (voir « section + section » dans le CSS)
    const seams = [...document.querySelectorAll("main > section + section")];
    seams.forEach((section) => section.classList.add("seam-pending"));

    const seamObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.replace("seam-pending", "seam-welded");
            seamObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -20% 0px" }
    );

    seams.forEach((section) => seamObserver.observe(section));

    return () => {
      observer.disconnect();
      seamObserver.disconnect();
    };
  }, [pathname]); // on recommence à chaque changement de page

  return null;
}

export default ScrollReveal;