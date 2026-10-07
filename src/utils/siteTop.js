import { stopGlide } from "./smoothScroll";

// Le « haut du site » : la position de défilement où la navbar et le Hero sont en place.
//
// D'habitude, c'est tout en haut de la page (0). Mais lors de la première visite, l'intro occupe
// le haut de la page et le Hero vient après elle : revenir à 0 ferait rembobiner l'intro au lieu
// de ramener au Hero. Dans ce cas, le haut du site est la fin de l'intro, là où mène aussi son
// bouton « Passer » (voir Intro.jsx).
//
// Tant que l'intro n'a pas été vue jusqu'au bout (classe intro-playing sur <html>), on garde 0 :
// au chargement de la page, il faut bien commencer par le début de l'intro.
export function getSiteTop() {
  const intro = document.querySelector(".intro");
  const isIntroPlaying = document.documentElement.classList.contains("intro-playing");

  if (!intro || isIntroPlaying) return 0;

  return intro.offsetHeight - window.innerHeight;
}

// Les zones de la page où l'écran reste immobile pendant qu'on défile : chacune est donnée par
// son début et sa fin, en pixels de défilement. Aujourd'hui il n'y en a qu'une : l'À propos sur
// grand écran, dont les deux colonnes restent en place le temps de souder le parcours (voir Timeline.jsx).
function getPinnedRanges() {
  const ranges = [];

  const layout = document.querySelector(".about-layout");
  const column = layout?.querySelector(".timeline");

  if (column && getComputedStyle(column).position === "sticky") {
    // Elle commence quand le haut du bloc atteint l'endroit où ses colonnes s'arrêtent (leur « top »),
    // et dure tant qu'elles ont de la place pour rester en haut de leur rangée
    const stickyTop = parseFloat(getComputedStyle(column).top) || 0;
    const from = layout.getBoundingClientRect().top + window.scrollY - stickyTop;
    ranges.push([from, from + layout.offsetHeight - column.offsetHeight]);
  }

  return ranges;
}

// Une seule remontée à la fois : on garde de quoi l'arrêter, et sa destination
let stopCurrent = null;
let currentTarget = null;

// Remonte en douceur jusqu'au haut du site.
//
// Pourquoi ne pas laisser faire le navigateur (window.scrollTo avec un défilement « smooth ») ?
// Parce qu'il traverse la page à vitesse régulière, zones immobiles comprises : en passant
// dans l'À propos, on voyait l'écran s'arrêter une demi-seconde, puis repartir. Ici, on anime
// nous-mêmes le défilement, et on saute ces zones d'un coup : à leur début comme à leur fin,
// l'écran montre la même chose, donc le saut ne se voit pas et le mouvement reste continu.
export function scrollToSiteTop() {
  const target = getSiteTop();

  // Déjà en route vers cette destination (le logo et ScrollToTop peuvent le demander tous les deux)
  if (stopCurrent && currentTarget === target) return;
  stopCurrent?.();
  // Si la page glissait encore sur son élan (défilement fluide), on le coupe : c'est nous qui la déplaçons
  stopGlide();

  const start = window.scrollY;
  const prefersLessMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rien à animer : on est déjà arrivé, on est au-dessus de la destination, ou le visiteur
  // a demandé moins d'animations. « instant » passe outre le défilement doux réglé dans le CSS.
  if (prefersLessMotion || start - target < 2) {
    window.scrollTo({ top: target, behavior: "instant" });
    return;
  }

  // Les zones immobiles situées sur le trajet, de la plus basse à la plus haute (l'ordre où on les croise)
  const holds = getPinnedRanges()
    .map(([from, to]) => [Math.max(from, target), Math.min(to, start)])
    .filter(([from, to]) => to > from)
    .sort((a, b) => b[1] - a[1]);

  const skipped = holds.reduce((total, [from, to]) => total + (to - from), 0);
  const distance = start - target - skipped; // ce qu'on verra réellement défiler
  // Entre 0,5 et 1,1 seconde selon la distance : un long trajet ne doit pas durer une éternité
  const duration = Math.min(Math.max(350 + distance * 0.18, 500), 1100);

  let frame = 0;
  let startTime = null;

  // Ce qui interrompt la remontée : le visiteur reprend la main (molette, doigt, clavier, clic),
  // ou l'adresse change d'ancre (il a cliqué sur « Projets » pendant le trajet, par exemple)
  const interruptions = ["wheel", "touchstart", "keydown", "pointerdown", "hashchange"];

  function stop() {
    cancelAnimationFrame(frame);
    interruptions.forEach((type) => window.removeEventListener(type, stop));
    stopCurrent = null;
    currentTarget = null;
  }

  function step(time) {
    startTime ??= time;
    const progress = Math.min((time - startTime) / duration, 1);
    // Départ et arrivée en douceur (la courbe « ease in-out » cubique)
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;

    // On descend de « travelled » pixels depuis le départ ; chaque fois qu'on atteint le bas
    // d'une zone immobile, on passe directement à son haut, sans rien décompter.
    let position = start;
    let travelled = distance * eased;

    for (const [from, to] of holds) {
      const untilHold = Math.max(position - to, 0);
      if (travelled < untilHold) break;
      travelled -= untilHold;
      position = from;
    }

    window.scrollTo({ top: position - travelled, behavior: "instant" });

    if (progress < 1) frame = requestAnimationFrame(step);
    else stop();
  }

  // passive : on promet au navigateur de ne pas bloquer ces gestes, il n'a pas à nous attendre
  interruptions.forEach((type) => window.addEventListener(type, stop, { passive: true }));

  stopCurrent = stop;
  currentTarget = target;
  frame = requestAnimationFrame(step);
}
