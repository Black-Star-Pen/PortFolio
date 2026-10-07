import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import timelineData from "../data/timelineData.json";
import { wantsSmoothScroll } from "../utils/smoothScroll";

// Mêmes outils que l'intro : GSAP, son module ScrollTrigger (qui relie une animation au défilement)
// et le hook useGSAP (qui range tout proprement quand le composant disparaît).
gsap.registerPlugin(ScrollTrigger, useGSAP);

// La gamme se parcourt de deux façons, selon l'écran (la même condition est écrite dans le CSS, section 9) :
// - grand écran : l'À propos est en deux colonnes qui restent en place le temps que le cordon se soude ;
// - sinon : la gamme défile avec la page, et le cordon suit une ligne aux 60 % de la hauteur de l'écran.
// La virgule veut dire « ou » : un grand écran, ou un écran d'ordinateur portable (large mais moins haut).
const PINNED_SCREEN =
  "(min-width: 1000px) and (min-height: 820px), (min-width: 1100px) and (min-height: 640px)";

const SMOOTHING = 0.5; // en secondes : le retard du cordon sur le défilement, pour qu'il glisse (comme l'intro)
// Avec le défilement fluide (voir smoothScroll.js), la page glisse déjà : un léger lissage suffit (comme l'intro)
const SMOOTHING_WITH_GLIDE = 0.2;
const TIP_PLACE = 0.45; // où se tient la pointe du cordon dans la fenêtre : 0 = tout en haut, 1 = tout en bas
const FIRST_STEP = 16; // en pixels : de quoi allumer la première étape d'entrée, avant que le cordon parte

function Timeline() {
  // progress : l'avancement du cordon, de 0 à 1 · reached : le nombre d'étapes atteintes
  // shift : de combien de pixels la gamme est remontée dans sa fenêtre (grand écran seulement)
  const [weld, setWeld] = useState({ progress: 0, reached: 0, shift: 0 });
  const rootRef = useRef(null);

  useGSAP(() => {
    const root = rootRef.current;
    const frame = root.querySelector(".timeline-window");
    const body = root.querySelector(".timeline-body");
    const dots = [...body.querySelectorAll(".timeline-dot")];

    // Traduit l'avancement du cordon (0 à 1) en ce qui s'affiche
    function show(progress, isPinned) {
      const tip = progress * body.offsetHeight; // la pointe, en pixels depuis le haut de la gamme
      const lead = isPinned ? FIRST_STEP : 0;
      // Une étape est atteinte quand la pointe a dépassé son point (la position du point dans la gamme)
      const reached = dots.filter(
        (dot) => dot.parentElement.offsetTop + dot.offsetTop < tip + lead
      ).length;

      // Sur grand écran, la gamme est plus haute que sa fenêtre : on la remonte pour garder la pointe
      // à la même place, sans jamais dépasser ni le début (0) ni la fin (hidden) de la gamme.
      let shift = 0;
      if (isPinned) {
        // La hauteur utile de la fenêtre : sans ses marges intérieures, là où le masque fait son fondu
        const { paddingTop, paddingBottom } = getComputedStyle(frame);
        const room = frame.clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom);
        const hidden = Math.max(body.offsetHeight - room, 0); // ce qui dépasse en bas au départ
        shift = gsap.utils.clamp(0, hidden, tip - room * TIP_PLACE);
      }

      // On ne redessine le composant que si quelque chose a vraiment changé
      setWeld((previous) =>
        previous.progress === progress && previous.reached === reached && previous.shift === shift
          ? previous
          : { progress, reached, shift }
      );
    }

    // Relie l'avancement du cordon au défilement. GSAP fait varier « state.progress » de 0 à 1
    // entre le début et la fin décrits par scrollTrigger, et on affiche le résultat à chaque image.
    function weldOnScroll(scrollTrigger, isPinned) {
      const state = { progress: 0 };
      const update = () => show(state.progress, isPinned);

      gsap.to(state, {
        progress: 1,
        ease: "none",
        onUpdate: update,
        // onRefresh : la fenêtre a changé de taille, on recalcule avec les nouvelles mesures
        scrollTrigger: { ...scrollTrigger, onRefresh: update },
      });
      update();
    }

    // Sur grand écran : relie l'avancement du cordon à l'arrêt des deux colonnes.
    // Le cordon doit partir quand elles s'arrêtent sous la navbar, et finir quand elles repartent.
    // On ne demande PAS à GSAP de retenir où cet arrêt commence et finit dans la page : il le calcule
    // une fois, et si la page change de hauteur ensuite, son repère devient faux. Le cordon partait alors
    // en retard, et la section repartait avant qu'il ait fini de souder toutes les étapes.
    // Ici, on relit la position des colonnes à l'écran à chaque défilement : c'est le CSS (position: sticky)
    // qui décide de l'arrêt, et le cordon le suit, sans pouvoir s'en décaler.
    // Renvoie la fonction qui défait tout.
    function weldWithColumns(layout) {
      const state = { progress: 0 };
      const update = () => show(state.progress, true);
      const smoothing = wantsSmoothScroll() ? SMOOTHING_WITH_GLIDE : SMOOTHING;

      // L'avancement, de 0 (les colonnes viennent de s'arrêter) à 1 (elles repartent)
      function measure() {
        // Là où les colonnes s'arrêtent : leur « top », écrit dans le CSS
        const stop = parseFloat(getComputedStyle(root).top) || 0;
        // La distance de défilement pendant laquelle elles tiennent : la place libre dans leur rangée
        const hold = layout.offsetHeight - root.offsetHeight;
        // Ce qui a déjà défilé depuis l'arrêt : de combien le haut du bloc est passé au-dessus de ce point
        const done = stop - layout.getBoundingClientRect().top;
        return hold > 0 ? gsap.utils.clamp(0, 1, done / hold) : 0;
      }

      // Le cordon rejoint sa nouvelle place en glissant (comme le « scrub » de GSAP), pas d'un coup.
      // overwrite : si on défile encore avant qu'il soit arrivé, il repart de là où il en est.
      function follow() {
        gsap.to(state, {
          progress: measure(),
          duration: smoothing,
          ease: "expo",
          overwrite: true,
          onUpdate: update,
        });
      }

      state.progress = measure();
      update();
      window.addEventListener("scroll", follow, { passive: true });
      window.addEventListener("resize", follow);

      return () => {
        window.removeEventListener("scroll", follow);
        window.removeEventListener("resize", follow);
        gsap.killTweensOf(state);
      };
    }

    // matchMedia : chaque réglage n'existe que tant que sa condition est vraie.
    // Si la fenêtre change de taille et passe de l'un à l'autre, GSAP défait le premier et installe le second.
    const media = gsap.matchMedia();

    // Deux conditions nommées : « always » est toujours vraie, la fonction est donc toujours installée,
    // et GSAP la rejoue quand « pinned » change. (On ne peut pas écrire « not all and … » devant
    // PINNED_SCREEN pour le cas contraire : avec sa virgule, le « non » ne porterait que sur sa première moitié.)
    media.add({ pinned: PINNED_SCREEN, always: "all" }, (context) => {
      if (!context.conditions.pinned) {
        // Le cordon commence quand le haut de la gamme passe la ligne des 60 %, et finit quand son bas la passe
        weldOnScroll({ trigger: body, start: "top 60%", end: "bottom 60%", scrub: true }, false);
        return undefined;
      }

      // La fonction renvoyée ici est appelée par GSAP quand ce réglage est défait
      return weldWithColumns(root.closest(".about-layout"));
    });

    return () => media.revert();
  });

  const isWelding = weld.progress > 0 && weld.progress < 1;

  return (
    <div className="timeline" ref={rootRef}>
      <p className="timeline-heading">
        Gamme de fabrication · Développeur Full Stack
      </p>

      {/* La fenêtre : sur grand écran, elle a une hauteur fixe et la gamme glisse derrière elle (--shift).
          Sur petit écran, elle n'a aucun style : la gamme défile avec la page. */}
      <div className="timeline-window">
        <div
          className={`timeline-body ${isWelding ? "welding" : ""}`}
          style={{ "--progress": weld.progress, "--shift": weld.shift }}
        >
          <div className="timeline-track" aria-hidden="true">
            <div className="timeline-weld"></div>
            <div className="timeline-spark"></div>
          </div>

          <ol className="timeline-list">
            {timelineData.map((step, index) => (
              <li
                key={step.id}
                className={`timeline-item ${index < weld.reached ? "reached" : ""}`}
              >
                <span className="timeline-dot" aria-hidden="true"></span>
                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span className="timeline-op">OP {(index + 1) * 10}</span>
                    <span className="timeline-date">{step.date}</span>
                    <span className={`timeline-type ${step.type}`}>
                      {step.type === "formation" ? "Formation" : "Expérience"}
                    </span>
                    {step.status && (
                      <span className="timeline-type timeline-status">
                        {step.status}
                      </span>
                    )}
                  </div>
                  <h3>{step.title}</h3>
                  <p className="timeline-place">{step.place}</p>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Timeline;
