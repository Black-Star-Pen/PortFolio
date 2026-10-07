import { useEffect, useRef, useState } from "react";

// Le fond du Hero. MODE TEST : quatre fonds sont proposés, on passe de l'un à l'autre avec le petit
// panneau de HeroBackgroundTest.jsx. Une fois le fond choisi, les trois autres seront retirés d'ici.
//   spot   : des projecteurs partent du coin en haut à gauche (CSS seul)
//   aurora : de grands halos dorés et bleus dérivent lentement (CSS seul)
//   dust   : une poussière d'or flotte et s'allume près du curseur (dessinée sur une toile)
//   grid   : des dalles scintillent et s'allument sous le curseur (dessinées sur une toile)

// Les deux couleurs du site, écrites « rouge, vert, bleu » pour pouvoir régler leur transparence
const GOLD = "214, 191, 148";
const TIG = "168, 212, 245";

// ----- Les deux fonds dessinés sur une toile -----

// La poussière d'or. La fonction renvoyée dessine une image ; elle garde ses grains d'une image à l'autre.
function createDust() {
  let grains = [];

  return function drawDust(context, width, height, time, pointer) {
    // Un grain pour 9 000 px² d'écran, 180 au plus : autant de densité sur un téléphone que sur un grand écran
    const count = Math.min(Math.round((width * height) / 9000), 180);

    if (grains.length !== count) {
      grains = Array.from({ length: count }, () => ({
        x: Math.random(), // position de départ, de 0 à 1 (une part de la largeur et de la hauteur)
        y: Math.random(),
        radius: 0.8 + Math.random() * 1.6,
        speed: 0.006 + Math.random() * 0.02, // la part de l'écran montée en une seconde
        phase: Math.random() * Math.PI * 2, // chacun scintille à son rythme
        blue: Math.random() < 0.15,
      }));
    }

    grains.forEach((grain) => {
      // Il monte doucement en se balançant ; arrivé en haut, il reparaît en bas (le « % 1 »)
      const x = grain.x * width + Math.sin(time * 0.3 + grain.phase) * 14;
      const y = ((((grain.y - time * grain.speed) % 1) + 1) % 1) * height;
      // De 0 (loin du curseur) à 1 (sous le curseur) : près de lui, le grain grossit et s'allume
      const near = Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / 160);
      const twinkle = 0.5 + 0.5 * Math.sin(time * 1.4 + grain.phase);
      const alpha = Math.min(0.2 + 0.5 * twinkle + near * 0.6, 1);
      const color = grain.blue ? TIG : GOLD;

      // Les plus gros ont un halo, comme une braise
      if (grain.radius > 1.5) {
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
  };
}

// Le côté d'une dalle, joint compris, en pixels
const TILE = 44;

// Les dalles. Chacune a un « caractère » fixe (un nombre de 0 à 1 tiré de sa position) : il décide de sa
// couleur et du rythme de son scintillement, pour que deux dalles voisines ne s'allument pas ensemble.
function drawTiles(context, width, height, time, pointer) {
  const size = TILE - 6;

  for (let column = 0; column * TILE < width; column++) {
    for (let row = 0; row * TILE < height; row++) {
      const x = column * TILE + 3;
      const y = row * TILE + 3;
      const character = (((Math.sin(column * 12.9898 + row * 78.233) * 43758.5453) % 1) + 1) % 1;
      const near = Math.max(0, 1 - Math.hypot(x + size / 2 - pointer.x, y + size / 2 - pointer.y) / 190);
      // Un bref éclat de temps en temps : le sinus ne dépasse 0,9 qu'un court instant
      const flicker = Math.max(0, Math.sin(time * (0.5 + character) + character * 40) - 0.9) * 10;

      context.fillStyle = `rgba(${character > 0.85 ? TIG : GOLD}, ${0.04 + near * near * 0.3 + flicker * 0.2})`;
      context.fillRect(x, y, size, size);
      context.strokeStyle = `rgba(${GOLD}, 0.1)`;
      context.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }
  }
}

// Une toile qui remplit le fond et se redessine à chaque image avec la fonction « draw ».
function Canvas({ draw, className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const background = canvas.closest(".hero-bg");
    // Le curseur, en pixels depuis le coin de l'écran (la toile remplit l'écran : ce sont aussi ses
    // coordonnées). Tant qu'il n'a pas bougé, il est « très loin » : rien ne s'allume.
    const pointer = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let frame = 0;

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

    function render(time) {
      context.clearRect(0, 0, width, height);
      draw(context, width, height, time / 1000, pointer);
    }

    function tick(time) {
      // Le Hero a quitté l'écran (le fond est éteint, voir HeroBackground) : on ne dessine pas pour rien
      if (background.style.opacity !== "0") render(time);
      frame = requestAnimationFrame(tick);
    }

    function onPointerMove(event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }

    resize(); // dessine aussi une première image, tout de suite

    // Réglage « réduire les animations » : on en reste à cette image fixe
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(tick);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [draw]);

  return <canvas className={className} ref={canvasRef} />;
}

function GoldDust() {
  // useState avec une fonction : la poussière est créée une seule fois, à l'arrivée du composant
  const [draw] = useState(createDust);

  return <Canvas draw={draw} className="hero-bg-canvas" />;
}

// ----- Le fond -----

function HeroBackground({ variant }) {
  const rootRef = useRef(null);

  // Le fond est fixé à l'écran, derrière le contenu du Hero (qui, lui, reste épinglé un moment : voir
  // .hero-pin). Il s'éteint à mesure que le Hero quitte l'écran, pour ne pas rester derrière la suite.
  useEffect(() => {
    const root = rootRef.current;
    const hero = root.closest(".hero");

    function update() {
      const { top, bottom } = hero.getBoundingClientRect();
      const screen = window.innerHeight;
      // La part de l'écran occupée par le Hero, de 0 à 1
      const covered = (Math.min(bottom, screen) - Math.max(top, 0)) / screen;
      // Plein feu tant que le Hero occupe 80 % de l'écran, éteint quand il n'en occupe plus que 30 %
      root.style.opacity = Math.min(Math.max((covered - 0.3) / 0.5, 0), 1);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    // aria-hidden : un décor, les lecteurs d'écran l'ignorent
    <div className="hero-bg" ref={rootRef} aria-hidden="true">
      {/* key : en changeant de fond, React recrée ce bloc, et son fondu d'arrivée se rejoue */}
      <div className="hero-bg-layer" key={variant}>
        {variant === "spot" && (
          <>
            <span className="hero-beam hero-beam-1" />
            <span className="hero-beam hero-beam-2" />
            <span className="hero-beam hero-beam-3" />
          </>
        )}

        {variant === "aurora" && (
          <>
            <span className="hero-halo hero-halo-1" />
            <span className="hero-halo hero-halo-2" />
            <span className="hero-halo hero-halo-3" />
          </>
        )}

        {variant === "dust" && <GoldDust />}

        {variant === "grid" && <Canvas draw={drawTiles} className="hero-bg-canvas hero-bg-tiles" />}
      </div>
    </div>
  );
}

export default HeroBackground;
