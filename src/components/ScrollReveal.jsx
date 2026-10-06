import { useLayoutEffect } from "react";
import { useLocation } from "react-router";
import { createSparks } from "./sparks";

// Les blocs qui apparaissent au défilement, et l'effet « atelier » de chacun
// (le Hero a sa propre animation). Pour animer un nouveau bloc, ajoute une ligne ici.
//   laser   : découpé par un trait laser, de gauche à droite
//   cut     : le texte se révèle comme une découpe qui avance
//   unfold  : se déplie de haut en bas, comme un plan qu'on déroule
//   drawers : la boîte à outils : ses tiroirs se rangent un par un, puis le panneau se découvre
//   lift    : se lève en 3D, comme une pièce qu'on redresse sur l'établi (plus utilisé pour l'instant)
//   scan    : les cartes projet : un trait bleu balaie la carte de haut en bas et la révèle, étage par étage
//   order   : le formulaire : le même trait bleu révèle la feuille vide, puis les champs sont soudés un par un
//   stamp   : frappé comme une tôle à la presse, avec un éclat doré (plus utilisé pour l'instant)
//   rise    : monte doucement avec un halo
//
// visible (facultatif) : la part du bloc qui doit être à l'écran pour qu'il apparaisse.
// Sans précision, c'est 10 %. Les cartes projet et le formulaire sont hauts et leur apparition se joue
// en deux temps : on attend d'en voir un bon tiers, sinon tout se passerait sous le bas de l'écran.
const DEFAULT_VISIBLE = 0.1;

const TARGETS = [
  { selector: ".section-title", effect: "laser" },
  { selector: ".about-text > p", effect: "cut" },
  { selector: ".timeline", effect: "unfold" },
  { selector: ".blueprint", effect: "drawers" },
  { selector: ".projects-grid > *", effect: "scan", visible: 0.35 },
  { selector: ".work-order", effect: "order", visible: 0.35 },
  { selector: ".contact-divider", effect: "cut" },
  { selector: ".contact-links", effect: "rise" },
  { selector: ".legal-content", effect: "unfold" },
  { selector: ".not-found > *", effect: "rise" },
];

// Les étincelles des cordons entre les sections (le moteur est dans sparks.js).
// Plus sages que celles de l'intro : fines, dorées du début à la fin (pas de rouge), sans éclats,
// avec une gravité faible pour qu'elles retombent doucement, comme une poussière d'or.
const SEAM_SPARKS = {
  gravity: 380,
  drag: 2,
  spread: Math.PI * 1.2,
  speed: [24, 170],
  life: [0.5, 0.8],
  size: [0.7, 0.8],
  splitChance: 0,
  colors: [
    [0, 255, 250, 232],
    [0.3, 251, 232, 182],
    [0.7, 226, 191, 120],
    [1, 176, 133, 66],
  ],
};

// Une étincelle tous les 10 pixels de cordon soudé. Plus petit = une gerbe plus fournie.
const SEAM_SPARK_SPACING = 10;

// Soude le cordon d'une section, et fait jaillir des étincelles de la pointe qui avance.
// Renvoie une fonction qui arrête tout (utile si on change de page en pleine soudure).
function weldSeam(section) {
  // C'est le CSS qui anime le cordon (::before) et sa pointe lumineuse (::after) : voir seam-welded
  section.classList.replace("seam-pending", "seam-welded");

  // La toile des étincelles n'existe que le temps de la soudure
  const canvas = document.createElement("canvas");
  canvas.className = "seam-sparks";
  canvas.setAttribute("aria-hidden", "true");
  section.append(canvas);

  const sparks = createSparks(canvas, SEAM_SPARKS);
  // getComputedStyle renvoie un objet « vivant » : à chaque lecture, il donne la position actuelle
  // de la pointe. Le CSS reste donc seul maître du mouvement, le JavaScript ne fait que le suivre.
  const tip = getComputedStyle(section, "::after");
  // La pointe est placée par rapport à la section ; la toile, elle, est décalée (elle commence plus haut
  // et plus à gauche, voir .seam-sparks) : on convertit la position de la pointe dans le repère de la toile.
  const canvasLeft = canvas.offsetLeft;
  const tipY = 1 - canvas.offsetTop;

  let isWelding = true;
  let previousX = null;
  let previousTime = performance.now();
  let owed = 0; // les étincelles « dues » pour le chemin parcouru, avec leur fraction en attente
  let frame = 0;

  // La pointe est arrivée au bout du cordon (ou son animation a été interrompue) : on n'émet plus
  function onAnimationOver(event) {
    if (event.animationName === "seam-spark") isWelding = false;
  }

  section.addEventListener("animationend", onAnimationOver);
  section.addEventListener("animationcancel", onAnimationOver);

  function stop() {
    cancelAnimationFrame(frame);
    section.removeEventListener("animationend", onAnimationOver);
    section.removeEventListener("animationcancel", onAnimationOver);
    canvas.remove();
  }

  function tick(time) {
    // 0,05 s au plus : si l'onglet a été mis en pause, les étincelles ne font pas un bond
    const seconds = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;

    if (isWelding) {
      const x = parseFloat(tip.left) - canvasLeft;

      if (previousX !== null && !Number.isNaN(x)) {
        owed += Math.abs(x - previousX) / SEAM_SPARK_SPACING;
        // On les répartit au hasard sur le chemin parcouru depuis l'image précédente :
        // sinon elles partiraient par paquets, la pointe avançant de plusieurs dizaines de pixels par image
        while (owed >= 1) {
          sparks.emit(previousX + (x - previousX) * Math.random(), tipY, 1, 1);
          owed -= 1;
        }
      }
      if (!Number.isNaN(x)) previousX = x;
    }

    const alive = sparks.update(seconds);

    // On continue tant que la pointe avance ou qu'il reste une étincelle allumée, puis on range la toile
    if (isWelding || alive > 0) frame = requestAnimationFrame(tick);
    else stop();
  }

  frame = requestAnimationFrame(tick);

  return stop;
}

// Note la fin de l'apparition d'un bloc (classe reveal-over), une fois toutes ses animations terminées.
// Le CSS s'en sert pour ne pas rejouer l'apparition sur ce qui arrive plus tard dans le bloc
// (ex. : le formulaire, recréé à neuf après un envoi : ses champs ne sont pas ressoudés).
function markWhenOver(element) {
  const animations = element
    // subtree : les animations du bloc ET de tout ce qu'il contient
    .getAnimations({ subtree: true })
    // On n'attend pas celles qui tournent sans fin (ex. : la lueur des cartes projet)
    .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime));

  // allSettled (et pas all) : une animation interrompue ne doit pas empêcher de noter la fin
  Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
    element.classList.add("reveal-over");
  });
}

// Fait apparaître chaque bloc la première fois qu'il arrive à l'écran.
// Comme ScrollToTop, ce composant n'affiche rien : il agit seulement sur la page.
function ScrollReveal() {
  const { pathname } = useLocation();

  // useLayoutEffect (et pas useEffect) : il s'exécute AVANT que le navigateur affiche la page.
  // Les blocs sont donc cachés d'emblée, sans « flash » où on les verrait une fraction de seconde.
  useLayoutEffect(() => {
    // Réglage « réduire les animations » : on ne cache rien, tout reste affiché normalement
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Pour chaque bloc à faire apparaître : la part de lui-même qui doit être visible (une Map
    // associe une valeur à un élément de la page, comme un petit carnet « élément → réglage »)
    const visibleNeeded = new Map();

    TARGETS.forEach(({ selector, effect, visible = DEFAULT_VISIBLE }) => {
      document.querySelectorAll(`main ${selector}`).forEach((element) => {
        // Décalage en cascade entre voisins du même type (ex. : les cartes, les paragraphes)
        const siblings = [...element.parentElement.children].filter((child) =>
          child.matches(selector)
        );
        const order = Math.min(siblings.indexOf(element), 4);
        element.style.setProperty("--reveal-delay", `${order * 0.2}s`);
        element.classList.add("reveal", `reveal-${effect}`);
        visibleNeeded.set(element, visible);
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Le -0.01 : le navigateur annonce parfois 0.0999 au lieu de 0.1, on ne rate pas le coche pour si peu
          if (entry.intersectionRatio >= visibleNeeded.get(entry.target) - 0.01) {
            entry.target.classList.add("revealed");
            markWhenOver(entry.target);
            // Une seule fois : on arrête de surveiller ce bloc
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // -15 % en bas : le bloc apparaît quand il est bien entré à l'écran, pas au ras du bord
        rootMargin: "0px 0px -15% 0px",
        // Le navigateur nous prévient à chacun des seuils demandés (ici 10 % et 35 %) ;
        // new Set(...) retire les doublons de la liste
        threshold: [...new Set(visibleNeeded.values())],
      }
    );

    visibleNeeded.forEach((visible, element) => observer.observe(element));

    // Les cordons de soudure entre les sections : chacun se soude quand le haut de sa section
    // arrive aux 4/5 de l'écran (voir « section + section » dans le CSS)
    const seams = [...document.querySelectorAll("main > section + section")];
    seams.forEach((section) => section.classList.add("seam-pending"));

    // Une fonction d'arrêt par soudure lancée, pour pouvoir tout ranger en quittant la page
    const stopWelds = [];

    const seamObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stopWelds.push(weldSeam(entry.target));
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
      stopWelds.forEach((stop) => stop());
    };
  }, [pathname]); // on recommence à chaque changement de page

  return null;
}

export default ScrollReveal;
