import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

/* =====================================================================
   L'intro « plan qui se trace », pilotée par le défilement.
   En descendant, le plan se dessine : traits de construction, « AB » et ses cotes.
   À la fin, on « plonge » dans le plan et on arrive sur le Hero.

   Le principe (« scrollytelling ») :
   - le bloc .intro est très haut (240 % de l'écran) ;
   - le plan à l'intérieur est « sticky » : il reste collé à l'écran pendant qu'on défile ;
   - le JavaScript calcule l'avancement (de 0 à 1) et l'écrit dans la variable CSS --p ;
   - chaque trait a un début (--s) et une fin (--e) : le CSS calcule seul où il en est.

   Affichée seulement sur l'accueil, une fois par visite (sessionStorage),
   jamais avec « réduire les animations ».
   Pour la REVOIR pendant le développement : localhost:5173/?intro
   ===================================================================== */

const STORAGE_KEY = "intro-seen";

function shouldPlay() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (new URLSearchParams(window.location.search).has("intro")) return true;
  try {
    return !sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

// Petit raccourci pour écrire le début et la fin d'un trait : timing(0.1, 0.3)
function timing(start, end) {
  return { "--s": start, "--e": end };
}

function Intro() {
  const { pathname } = useLocation();
  const [isEnabled, setIsEnabled] = useState(shouldPlay);
  const introRef = useRef(null);

  // Si on quitte l'accueil, l'intro ne revient pas pendant cette visite.
  // (Mettre à jour un état pendant le rendu est permis quand c'est conditionnel comme ici :
  // React recalcule aussitôt, sans afficher l'étape intermédiaire.)
  if (isEnabled && pathname !== "/") setIsEnabled(false);

  const isVisible = isEnabled && pathname === "/";

  useEffect(() => {
    if (!isVisible) return;
    const intro = introRef.current;
    const root = document.documentElement;
    let frameId = null;

    function update() {
      frameId = null;
      const rect = intro.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);

      // Pas de useState ici : on écrit directement la variable CSS, sans nouveau rendu React
      intro.style.setProperty("--p", progress);

      // Les animations du Hero attendent la fin de l'intro
      root.classList.toggle("intro-playing", progress < 0.97);

      if (progress >= 0.97) {
        try {
          sessionStorage.setItem(STORAGE_KEY, "1");
        } catch {
          // Pas grave : l'intro sera simplement rejouée
        }
      }
    }

    // Au plus une mise à jour par image, même si « scroll » se déclenche très souvent
    function handleScroll() {
      if (!frameId) frameId = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frameId) cancelAnimationFrame(frameId);
      root.classList.remove("intro-playing");
    };
  }, [isVisible]);

  // Le bouton « Passer » : on descend directement jusqu'au site
  function skipIntro() {
    window.scrollTo({ top: introRef.current.offsetHeight, behavior: "smooth" });
  }

  if (!isVisible) return null;

  return (
    <div className="intro" ref={introRef}>
      <div className="intro-sticky">
        <div className="intro-stage" aria-hidden="true">
          {/* pathLength="1" : chaque trait « mesure 1 », ce qui permet de tous les dessiner
              avec le même CSS (voir .draw) */}
          <svg className="intro-plan" viewBox="-30 -30 300 210">
            {/* Traits de construction (bleu acier, fins) */}
            <g className="construction">
              <line className="draw" pathLength="1" x1="-20" y1="10" x2="250" y2="10" style={timing(0.02, 0.14)} />
              <line className="draw" pathLength="1" x1="-20" y1="130" x2="250" y2="130" style={timing(0.06, 0.18)} />
              <line className="draw" pathLength="1" x1="55" y1="-20" x2="55" y2="150" style={timing(0.1, 0.22)} />
              <circle className="draw" pathLength="1" cx="170" cy="70" r="36" style={timing(0.14, 0.26)} />
            </g>

            {/* « AB » (doré, épais) */}
            <g className="letter">
              <path className="draw" pathLength="1" d="M10 130 L55 10 L100 130" style={timing(0.2, 0.4)} />
              <path className="draw" pathLength="1" d="M28 86 L82 86" style={timing(0.36, 0.44)} />
              <path
                className="draw"
                pathLength="1"
                d="M130 130 L130 10 L168 10 Q198 10 198 39 Q198 68 168 68 L130 68 M168 68 Q204 68 204 99 Q204 130 168 130 L130 130"
                style={timing(0.4, 0.62)}
              />
            </g>

            {/* Cotes : trait, petites barres aux extrémités, et la mesure */}
            <g className="dimension fade" style={timing(0.6, 0.68)}>
              <line x1="10" y1="160" x2="204" y2="160" />
              <line x1="10" y1="154" x2="10" y2="166" />
              <line x1="204" y1="154" x2="204" y2="166" />
              <text x="107" y="176">194</text>
            </g>
            <g className="dimension fade" style={timing(0.64, 0.72)}>
              <line x1="230" y1="10" x2="230" y2="130" />
              <line x1="224" y1="10" x2="236" y2="10" />
              <line x1="224" y1="130" x2="236" y2="130" />
              <text x="244" y="74">120</text>
            </g>
          </svg>

          <p className="intro-caption">Plan n° 01 · Adam Boulkhedert · Éch. 1:1</p>

          <p className="intro-hint">
            Défiler <span>↓</span>
          </p>
        </div>

        <button type="button" className="intro-skip" onClick={skipIntro}>
          Passer <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}

export default Intro;