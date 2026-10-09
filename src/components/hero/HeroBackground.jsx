import { useEffect, useRef } from "react";
import { useReplayOnReturn } from "../../hooks/useReplayOnReturn";

// Le fond du Hero : le quadrillage du plan, couché en perspective, qui défile vers nous.
// Tout le dessin est en CSS (voir « Le fond du Hero » dans hero.css). Ce composant ne fait que
// donner au fond la hauteur du Hero, pour qu'il s'arrête net au cordon de soudure de la section suivante.
//
// Il est posé juste AVANT la section du Hero, pas dedans (voir Hero.jsx) : la section coupe ce qui
// dépasse sur ses côtés (overflow-x: clip), le fond ne ferait donc pas toute la largeur de l'écran.
function HeroBackground() {
  const rootRef = useRef(null);
  // Le cadre du fond : quand on revient sur le Hero, le sol se rallume (voir useReplayOnReturn).
  // On surveille le cadre et pas la racine, qui a une hauteur de 0.
  const clipRef = useRef(null);
  useReplayOnReturn(clipRef);

  // ResizeObserver nous prévient chaque fois que la hauteur du Hero change
  // (fenêtre redimensionnée, fin de l'intro…).
  useEffect(() => {
    const root = rootRef.current;
    const hero = root.nextElementSibling; // la section du Hero, juste après le fond

    function measure() {
      root.style.setProperty("--hero-bg-height", `${hero.offsetHeight}px`);
    }

    measure(); // une première fois tout de suite, sans attendre que le navigateur nous prévienne
    const observer = new ResizeObserver(measure);
    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  return (
    // aria-hidden : un décor, les lecteurs d'écran l'ignorent
    <div className="hero-bg" ref={rootRef} aria-hidden="true">
      {/* Le cadre : il a la hauteur du Hero et coupe tout ce qui en dépasse */}
      <div className="hero-bg-clip" ref={clipRef}>
        {/* La « vue » reste à l'écran pendant que le Hero est épinglé, comme son contenu */}
        <div className="hero-bg-view">
          {/* Le sol : le premier <span> donne la perspective, le second est le quadrillage */}
          <span className="hero-floor">
            <span />
          </span>
        </div>
      </div>
    </div>
  );
}

export default HeroBackground;
