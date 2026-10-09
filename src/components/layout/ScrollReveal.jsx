import { useLayoutEffect } from "react";
import { useLocation } from "react-router";
import { createSparks } from "../../utils/sparks";
import { getTheme } from "../../utils/theme";

// Les blocs qui apparaissent au défilement, et l'effet « atelier » de chacun
// (le Hero a sa propre animation). Pour animer un nouveau bloc, ajoute une ligne ici.
//   laser   : découpé par un trait laser, de gauche à droite
//   cut     : le texte se révèle comme une découpe qui avance
//   unfold  : se déplie de haut en bas, comme un plan qu'on déroule
//   drawers : la boîte à outils : ses tiroirs se rangent un par un, puis le panneau se découvre
//   scan    : les cartes projet : un trait bleu balaie la carte de haut en bas et la révèle, étage par étage
//   order   : le formulaire : le même trait bleu révèle la feuille vide, puis les champs sont soudés un par un
//   rise    : monte doucement avec un halo
//
// visible (facultatif) : la part du bloc qui doit être à l'écran pour qu'il apparaisse.
// Sans précision, c'est 10 %. Les cartes projet et le formulaire sont hauts et leur apparition se joue
// en deux temps : on attend d'en voir un bon tiers, sinon tout se passerait sous le bas de l'écran.
//
// replay (facultatif) : le bloc rejoue son apparition chaque fois qu'on revient dessus après l'avoir
// quitté. Sans ce réglage, un bloc n'apparaît qu'une fois, puis reste en place.
const DEFAULT_VISIBLE = 0.1;

// Le décalage entre deux voisins du même type (les cartes, les paragraphes), en secondes
const STAGGER = 0.2;

// Sur téléphone, les blocs sont empilés et souvent aussi hauts que l'écran. Avec les réglages du grand
// écran, on faisait défiler du noir avant de les voir arriver : il fallait en voir un tiers, attendre
// son tour derrière le voisin du dessus, puis regarder l'apparition se jouer. Là, chaque bloc part dès
// qu'il dépasse du bas de l'écran, presque sans attendre son voisin, et son apparition se joue plus vite.
const SMALL_SCREEN = "(max-width: 768px)";
const SMALL_SCREEN_STAGGER = 0.05;
const SMALL_SCREEN_SPEED = 1.4; // 1 = la vitesse du grand écran

const TARGETS = [
  { selector: ".section-title", effect: "laser" },
  { selector: ".about-text > p", effect: "cut" },
  { selector: ".timeline", effect: "unfold" },
  { selector: ".blueprint", effect: "drawers", replay: true },
  { selector: ".projects-grid > *", effect: "scan", visible: 0.35, replay: true },
  { selector: ".work-order", effect: "order", visible: 0.35, replay: true },
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

// En thème clair, les mêmes étincelles en plus foncé et un peu plus épaisses : de l'orange de chauffe
// au brun, posées sur le papier au lieu de s'y additionner (voir « blend » dans sparks.js).
const SEAM_SPARKS_LIGHT = {
  ...SEAM_SPARKS,
  blend: "source-over",
  size: [0.9, 0.9],
  colors: [
    [0, 214, 120, 20],
    [0.3, 194, 98, 12],
    [0.7, 150, 96, 30],
    [1, 125, 93, 36],
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

  const sparks = createSparks(canvas, getTheme() === "light" ? SEAM_SPARKS_LIGHT : SEAM_SPARKS);
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

// Les animations d'apparition d'un bloc : toutes celles qui ont une fin.
function revealAnimations(element) {
  return (
    element
      // subtree : les animations du bloc ET de tout ce qu'il contient
      .getAnimations({ subtree: true })
      // Pas celles qui tournent sans fin (ex. : la lueur des cartes projet)
      .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime))
  );
}

// Joue l'apparition d'un bloc plus vite, sans toucher au CSS. Toutes ses animations (la découpe, le trait,
// les étages…) accélèrent du même facteur, délais compris : elles restent calées les unes sur les autres.
function speedUp(element, rate) {
  revealAnimations(element).forEach((animation) => {
    animation.playbackRate = rate;
  });
}

// Note la fin de l'apparition d'un bloc (classe reveal-over), une fois toutes ses animations terminées.
// Le CSS s'en sert pour ne pas rejouer l'apparition sur ce qui arrive plus tard dans le bloc
// (ex. : le formulaire, recréé à neuf après un envoi : ses champs ne sont pas ressoudés).
function markWhenOver(element) {
  // allSettled (et pas all) : une animation interrompue ne doit pas empêcher de noter la fin
  Promise.allSettled(revealAnimations(element).map((animation) => animation.finished)).then(() => {
    // Un bloc « replay » sorti de l'écran en pleine apparition a été remis en attente entre-temps :
    // son apparition n'est pas finie, elle a été interrompue
    if (element.classList.contains("revealed")) element.classList.add("reveal-over");
  });
}

// Le visiteur a-t-il commencé à écrire dans ce bloc ? (Seul le formulaire a des champs de saisie.)
// Dans ce cas, le bloc ne rejoue pas son apparition : on ne fait pas disparaître puis réapparaître
// champ par champ un message en cours d'écriture.
function isBeingFilled(element) {
  // [...liste] change la liste d'éléments en tableau, pour pouvoir utiliser some()
  return [...element.querySelectorAll("input, textarea")].some((field) => field.value.trim() !== "");
}

// Fait apparaître chaque bloc la première fois qu'il arrive à l'écran (et à chaque retour, pour les
// blocs « replay »).
// Comme ScrollToTop, ce composant n'affiche rien : il agit seulement sur la page.
function ScrollReveal() {
  const { pathname } = useLocation();

  // useLayoutEffect (et pas useEffect) : il s'exécute AVANT que le navigateur affiche la page.
  // Les blocs sont donc cachés d'emblée, sans « flash » où on les verrait une fraction de seconde.
  useLayoutEffect(() => {
    // Réglage « réduire les animations » : on ne cache rien, tout reste affiché normalement
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Les réglages du téléphone (voir SMALL_SCREEN plus haut)
    const isSmallScreen = window.matchMedia(SMALL_SCREEN).matches;
    const stagger = isSmallScreen ? SMALL_SCREEN_STAGGER : STAGGER;

    // Pour chaque bloc à faire apparaître : la part de lui-même qui doit être visible (une Map
    // associe une valeur à un élément de la page, comme un petit carnet « élément → réglage »)
    const visibleNeeded = new Map();
    // Les blocs qui rejouent leur apparition à chaque retour (réglage « replay »)
    const replayed = new Set();

    TARGETS.forEach(({ selector, effect, visible = DEFAULT_VISIBLE, replay = false }) => {
      document.querySelectorAll(`main ${selector}`).forEach((element) => {
        // Décalage en cascade entre voisins du même type (ex. : les cartes, les paragraphes)
        const siblings = [...element.parentElement.children].filter((child) =>
          child.matches(selector)
        );
        const order = Math.min(siblings.indexOf(element), 4);
        element.style.setProperty("--reveal-delay", `${order * stagger}s`);
        element.classList.add("reveal", `reveal-${effect}`);
        // Sur téléphone, 10 % suffisent pour tous : un tiers d'une carte, c'est déjà un tiers de l'écran
        visibleNeeded.set(element, isSmallScreen ? DEFAULT_VISIBLE : visible);
        if (replay) replayed.add(element);
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Le -0.01 : le navigateur annonce parfois 0.0999 au lieu de 0.1, on ne rate pas le coche pour si peu
          if (entry.intersectionRatio >= visibleNeeded.get(entry.target) - 0.01) {
            // Un bloc « replay » reste surveillé : s'il est déjà apparu, il n'y a rien à refaire
            if (entry.target.classList.contains("revealed")) return;
            entry.target.classList.add("revealed");
            if (isSmallScreen) speedUp(entry.target, SMALL_SCREEN_SPEED);
            markWhenOver(entry.target);
            // Une seule fois : on arrête de surveiller ce bloc (sauf s'il doit rejouer son apparition)
            if (!replayed.has(entry.target)) observer.unobserve(entry.target);
          }
        });
      },
      {
        // -15 % en bas : le bloc apparaît quand il est bien entré à l'écran, pas au ras du bord
        // (-5 % sur téléphone, où il part plus tôt)
        rootMargin: isSmallScreen ? "0px 0px -5% 0px" : "0px 0px -15% 0px",
        // Le navigateur nous prévient à chacun des seuils demandés (ici 10 % et 35 %) ;
        // new Set(...) retire les doublons de la liste
        threshold: [...new Set(visibleNeeded.values())],
      }
    );

    visibleNeeded.forEach((visible, element) => observer.observe(element));

    // Les blocs « replay » : dès qu'ils sont entièrement sortis de l'écran, par le haut ou par le bas,
    // ils sont remis en attente (cachés). À leur retour, l'observateur ci-dessus rejoue leur apparition.
    // Sans réglage, un IntersectionObserver regarde tout l'écran et prévient à l'entrée et à la sortie.
    const exitObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting || isBeingFilled(entry.target)) return;
        entry.target.classList.remove("revealed", "reveal-over");
      });
    });
    replayed.forEach((element) => exitObserver.observe(element));

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
      exitObserver.disconnect();
      seamObserver.disconnect();
      stopWelds.forEach((stop) => stop());
    };
  }, [pathname]); // on recommence à chaque changement de page

  return null;
}

export default ScrollReveal;
