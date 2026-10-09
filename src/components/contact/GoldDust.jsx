import { useEffect, useRef, useState } from "react";
import { THEME_CHANGE, themeColor } from "../../utils/theme";

// La poussière d'or : le fond de la section Contact. Des grains dorés (et quelques bleus) montent
// doucement, scintillent, et s'allument près du curseur. Ils sont dessinés sur une toile (<canvas>).
// Le fond reste dans sa section : il commence au cordon de soudure, en haut, et s'arrête au trait
// du pied de page, en bas (voir .gold-dust dans le CSS).

// Les deux couleurs des grains, lues dans le CSS (écrites « rouge, vert, bleu », pour pouvoir régler leur
// transparence) : elles changent avec le thème, clair ou sombre. Une toile ne sait pas lire une variable
// CSS elle-même, d'où themeColor.
function readColors() {
  return { gold: themeColor("--rgb-accent"), tig: themeColor("--rgb-tig") };
}

// La densité : un grain pour 6 500 px² de section, 400 au plus. La même sur un téléphone que sur un
// grand écran. Pour plus de poussière, baisse le premier nombre (et monte le second s'il le faut).
const AREA_PER_GRAIN = 6500;
const MAX_GRAINS = 400;

// La fonction renvoyée dessine une image ; elle garde ses grains d'une image à l'autre.
function createDust() {
  let grains = [];
  let colors = readColors();

  function drawDust(context, width, height, time, pointer) {
    const count = Math.min(Math.round((width * height) / AREA_PER_GRAIN), MAX_GRAINS);

    if (grains.length !== count) {
      grains = Array.from({ length: count }, () => ({
        x: Math.random(), // position de départ, de 0 à 1 (une part de la largeur et de la hauteur)
        y: Math.random(),
        radius: 0.8 + Math.random() * 1.6,
        speed: 6 + Math.random() * 20, // en pixels par seconde, vers le haut
        phase: Math.random() * Math.PI * 2, // chacun scintille à son rythme
        blue: Math.random() < 0.15,
      }));
    }

    grains.forEach((grain) => {
      // Il monte doucement en se balançant ; arrivé en haut, il reparaît en bas (le « % height »)
      const x = grain.x * width + Math.sin(time * 0.3 + grain.phase) * 14;
      const y = (((grain.y * height - time * grain.speed) % height) + height) % height;
      // De 0 (loin du curseur) à 1 (sous le curseur) : près de lui, le grain grossit et s'allume
      const near = Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / 160);
      const twinkle = 0.5 + 0.5 * Math.sin(time * 1.4 + grain.phase);
      const alpha = Math.min(0.2 + 0.5 * twinkle + near * 0.6, 1);
      const color = grain.blue ? colors.tig : colors.gold;

      // Les plus gros ont un halo, comme une braise
      if (grain.radius > 1.7) {
        context.fillStyle = `rgba(${color}, ${alpha * 0.14})`;
        context.beginPath();
        context.arc(x, y, grain.radius * 4, 0, Math.PI * 2);
        context.fill();
      }

      context.fillStyle = `rgba(${color}, ${alpha})`;
      context.beginPath();
      context.arc(x, y, grain.radius + near * 1.6, 0, Math.PI * 2);
      context.fill();
    });
  }

  // À appeler quand le thème change : les grains prennent les couleurs du nouveau thème
  drawDust.refreshColors = () => {
    colors = readColors();
  };

  return drawDust;
}

function GoldDust() {
  const canvasRef = useRef(null);
  // useState avec une fonction : la poussière est créée une seule fois, à l'arrivée du composant
  const [draw] = useState(createDust);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    // Le curseur, en pixels depuis le coin de la toile. Tant qu'il n'a pas bougé, il est « très loin » :
    // rien ne s'allume.
    const pointer = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let isOnScreen = false;
    let frame = 0;

    function render(time) {
      context.clearRect(0, 0, width, height);
      draw(context, width, height, time / 1000, pointer);
    }

    function resize() {
      // Sur un écran très dense (téléphone), 2 pixels réels par pixel suffisent : au-delà, on dessinerait
      // quatre à neuf fois plus de points pour un résultat identique à l'œil
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      render(performance.now());
    }

    function tick(time) {
      // On ne dessine que quand la section est à l'écran
      if (isOnScreen) render(time);
      frame = requestAnimationFrame(tick);
    }

    function onPointerMove(event) {
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
    }

    resize(); // dessine aussi une première image, tout de suite

    const visibility = new IntersectionObserver(([entry]) => {
      isOnScreen = entry.isIntersecting;
    });
    visibility.observe(canvas);

    // La section change de hauteur (le formulaire s'adapte au type de demande) : la toile suit
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);

    // Réglage « réduire les animations » : on en reste à l'image fixe
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(tick);
    }

    // Le visiteur change de thème : on reprend les couleurs et on redessine tout de suite
    function onThemeChange() {
      draw.refreshColors();
      render(performance.now());
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener(THEME_CHANGE, onThemeChange);

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      sizes.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener(THEME_CHANGE, onThemeChange);
    };
  }, [draw]);

  return (
    // aria-hidden : un décor, les lecteurs d'écran l'ignorent
    <div className="gold-dust" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

export default GoldDust;
