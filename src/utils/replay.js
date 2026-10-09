// Rejouer une animation d'arrivée quand un bloc revient à l'écran.
//
// Les animations d'arrivée du site ne se jouent qu'une fois. Les deux fonctions de ce fichier servent
// à les relancer chaque fois que le visiteur revient sur un bloc après l'avoir quitté :
// - watchReturn surveille un bloc et prévient quand il revient ;
// - replayAnimations relance ses animations CSS depuis le début.

// Un bloc est « revenu » quand il dépasse de 20 % dans l'écran, par le haut ou par le bas : il est
// alors franchement visible, pas au ras du bord. (On retire 20 % en haut et en bas de la zone surveillée.)
const RETURN_ZONE = "-20% 0px -20% 0px";

// Surveille « element » et appelle onReturn() chaque fois qu'il revient à l'écran après en être
// complètement sorti, par le haut ou par le bas. La toute première arrivée ne compte pas : c'est
// l'animation normale du bloc qui s'en charge.
//
// Pendant son absence, le bloc porte la classe replay-wait, qui le cache (voir scroll-reveal.css).
// Sans elle, en revenant vers lui, on le verrait déjà en place au bord de l'écran, puis disparaître
// d'un coup pour rejouer son arrivée.
//
// Renvoie une fonction qui arrête la surveillance.
export function watchReturn(element, onReturn) {
  // Réglage « réduire les animations » : rien ne se joue, il n'y a donc rien à rejouer
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  let wasSeen = false; // le bloc est-il déjà venu à l'écran ?
  let hasLeft = false; // en est-il sorti depuis ?

  // Sans réglage, un IntersectionObserver regarde tout l'écran : il prévient quand le bloc y entre,
  // et quand il en est entièrement sorti. at(-1) : s'il y a plusieurs annonces, la plus récente.
  const leaveObserver = new IntersectionObserver((entries) => {
    if (entries.at(-1).isIntersecting || !wasSeen) return;
    hasLeft = true;
    element.classList.add("replay-wait");
  });

  const returnObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.at(-1).isIntersecting) return;
      wasSeen = true;
      if (!hasLeft) return;
      hasLeft = false;
      element.classList.remove("replay-wait");
      onReturn();
    },
    { rootMargin: RETURN_ZONE }
  );

  leaveObserver.observe(element);
  returnObserver.observe(element);

  return () => {
    leaveObserver.disconnect();
    returnObserver.disconnect();
    element.classList.remove("replay-wait");
  };
}

// Relance depuis le début toutes les animations CSS d'un bloc et de ce qu'il contient.
//
// skip (en secondes) : le temps à sauter au départ. Utile quand la première arrivée commence par un
// temps mort qui n'a plus de raison d'être au retour ; les écarts entre les animations sont gardés.
export function replayAnimations(element, skip = 0) {
  // getAnimations donne les animations du bloc qui tournent ou dont l'état final est encore appliqué.
  // subtree : celles de ses enfants aussi, et de leurs ::before et ::after.
  element.getAnimations({ subtree: true }).forEach((animation) => {
    // Remettre le compteur d'une animation au début suffit à la faire repartir. On ne touche pas à
    // « lecture / pause » : une animation mise en pause par le CSS (le Hero pendant l'intro) le reste.
    animation.currentTime = skip * 1000;
  });
}
