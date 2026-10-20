// Le défilement fluide du site.
//
// D'habitude, un cran de molette déplace la page d'un coup, par à-coups. Ici, la bibliothèque Lenis
// reçoit les crans de molette à la place du navigateur et fait glisser la page jusqu'à sa nouvelle
// position, avec un léger élan qui s'amortit.
//
// Lenis ne remplace pas le défilement du navigateur : elle le pilote (elle appelle window.scrollTo à
// chaque image). La position de la page reste donc la vraie, et tout ce qui en dépend continue de
// fonctionner : les blocs « sticky », l'intro et le parcours (ScrollTrigger), les apparitions.
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Le temps que met la page à rejoindre sa nouvelle position après un cran de molette, en secondes.
// POUR RÉGLER LE RESSENTI : change ce nombre. Plus il est grand, plus la page glisse longtemps
// (0.8 = plus vif, 1.1 = fluide, 1.5 = très coulé).
const DURATION = 1.1;
// Les fiches sont courtes : un élan plus bref évite une sensation de retard à la molette.
const MODAL_DURATION = 0.65;

// L'instance de Lenis quand le défilement fluide est actif, sinon null
let lenis = null;
// La page est-elle bloquée en ce moment (une modale ou le menu est ouvert) ?
let scrollLocks = 0;
let previousOverflow = "";

// Le défilement fluide n'est activé que pour une souris ou un pavé tactile.
// - Au doigt (« pointer: coarse »), le téléphone a déjà son propre élan : y toucher le rend moins naturel.
// - Avec « réduire les animations », on laisse le défilement normal du navigateur.
export function wantsSmoothScroll() {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(pointer: coarse)").matches
  );
}

// Démarre le défilement fluide. Renvoie la fonction qui l'arrête (pour le nettoyage de useEffect).
export function startSmoothScroll() {
  if (!wantsSmoothScroll()) return () => {};

  const instance = new Lenis({
    duration: DURATION,
    // anchors : un clic sur un lien vers une section de la page (#projects, /#contact…) y mène en glissant
    anchors: true,
  });
  lenis = instance;
  // Une modale était déjà ouverte à l'arrivée (adresse avec ?projet=…) : la page reste bloquée
  if (scrollLocks > 0) instance.stop();

  // Lenis et GSAP avancent ensemble :
  // - à chaque déplacement de la page, ScrollTrigger recalcule où en sont l'intro et le parcours ;
  // - c'est l'horloge de GSAP (son « ticker », environ 60 fois par seconde) qui fait avancer Lenis,
  //   pour que le défilement et les animations soient calculés dans la même image.
  //   Elle compte en secondes, Lenis en millisecondes : d'où le « × 1000 ».
  instance.on("scroll", ScrollTrigger.update);
  const tick = (time) => instance.raf(time * 1000);
  gsap.ticker.add(tick);
  // GSAP « rattrape » en douceur après un blocage du navigateur ; pour un défilement, ça donne un retard
  // visible. On le désactive tant que Lenis tourne (recommandé par Lenis).
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(500, 33); // les réglages d'origine de GSAP
    instance.destroy();
    lenis = null;
  };
}

// Le même défilement fluide, mais à l'intérieur d'une zone qui défile toute seule : une modale.
// Le premier enfant contient toute la fiche : ResizeObserver suit ainsi les images, les textes
// et les champs qui apparaissent. Renvoie la fonction de nettoyage de useEffect.
export function startSmoothScrollIn(wrapper) {
  if (!wrapper || !wantsSmoothScroll()) return () => {};

  const instance = new Lenis({
    wrapper,
    content: wrapper.firstElementChild,
    duration: MODAL_DURATION,
    overscroll: false,
  });

  // Lenis observe le conteneur et son contenu. La boucle d'animation n'interroge plus
  // la mise en page à chaque image, même quand la modale est au repos.
  const tick = (time) => instance.raf(time * 1000);
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    instance.destroy();
  };
}

// Fait défiler jusqu'à un élément de la page (une section, par exemple).
// Lenis tient compte de sa marge « scroll-margin-top » (voir « section » dans le CSS), comme le navigateur.
export function scrollToElement(element) {
  if (lenis) lenis.scrollTo(element);
  else element.scrollIntoView();
}

// Fait défiler jusqu'à une position, en pixels depuis le haut de la page
export function scrollToPosition(top) {
  if (lenis) lenis.scrollTo(top);
  else window.scrollTo({ top, behavior: "smooth" });
}

// Coupe l'élan en cours : à appeler avant de déplacer la page nous-mêmes (voir scrollToSiteTop),
// sinon Lenis continuerait son propre mouvement par-dessus le nôtre.
// Lenis n'a pas de commande « arrête ton élan » : on l'arrête et on la relance aussitôt, ce qui
// remet son mouvement à zéro. (Si la page est bloquée par une modale, elle est déjà à l'arrêt.)
export function stopGlide() {
  if (!lenis || lenis.isStopped) return;
  lenis.stop();
  lenis.start();
}

// Bloque le défilement de la page pendant qu'une modale ou le menu est ouvert, puis le débloque.
// overflow: hidden suffit pour le navigateur, mais pas pour Lenis, qui déplace la page elle-même :
// il faut aussi l'arrêter. (L'intérieur d'une modale reste défilable : voir data-lenis-prevent.)
export function lockPageScroll() {
  if (scrollLocks === 0) previousOverflow = document.body.style.overflow;
  scrollLocks += 1;
  document.body.style.overflow = "hidden";
  lenis?.stop();
}

export function unlockPageScroll() {
  if (scrollLocks === 0) return;
  scrollLocks -= 1;
  if (scrollLocks > 0) return;
  document.body.style.overflow = previousOverflow;
  lenis?.start();
}
