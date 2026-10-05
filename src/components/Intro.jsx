import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

/* =====================================================================
   L'intro « plan qui se soude », pilotée par le défilement.
   À l'arrivée, le plan est déjà là : son cadre, son cartouche, les traits de construction
   et « AB » en pointillés.
   En descendant, une torche soude « AB » : le cordon sort blanc de la torche, passe à l'orange,
   puis refroidit en doré. Les annotations et les cotes apparaissent au fur et à mesure.
   À la fin, le plan s'efface et les deux lettres se séparent : le « A » va se poser sur le A de
   « ADAM » et le « B » sur le B de « BOULKHEDERT », dans le logo de la navbar.

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

// Les deux lettres, et les traits qui les composent, dans l'ordre où ils sont soudés.
// center = le milieu de la lettre (en unités du dessin) ; width = sa largeur.
// Pour chaque trait : d = le chemin SVG ; length = sa longueur ;
// start et end = le moment du défilement (de 0 à 1) où il se soude.
const LETTERS = [
  {
    name: "A",
    center: 55,
    width: 90,
    strokes: [
      { d: "M10 130 L55 10 L100 130", length: 256, start: 0.05, end: 0.27 }, // les deux jambes
      { d: "M28 86 L82 86", length: 54, start: 0.27, end: 0.34 }, // la barre
    ],
  },
  {
    name: "B",
    center: 167,
    width: 74,
    strokes: [
      { d: "M130 130 L130 10 L168 10 Q198 10 198 39 Q198 68 168 68 L130 68", length: 292, start: 0.34, end: 0.51 }, // le fût et la boucle haute
      { d: "M168 68 Q204 68 204 99 Q204 130 168 130 L130 130", length: 147, start: 0.51, end: 0.63 }, // la boucle basse
    ],
  },
];

// Tous les traits à la suite (les 2 du A puis les 2 du B) : flatMap « aplatit » les listes en une seule
const STROKES = LETTERS.flatMap((letter) => letter.strokes);

// Les deux lettres font la même hauteur (de 10 à 130 unités) : leur milieu est donc à 70
const LETTER_HEIGHT = 120;
const LETTER_MIDDLE = 70;
// L'épaisseur du cordon une fois « AB » posé dans la navbar (voir --w dans le CSS : 4 + 18)
const LANDED_WIDTH = 22;

// La chaleur du cordon, juste derrière la torche : 6 calques posés l'un sur l'autre,
// du plus long et plus sombre (le métal qui refroidit) au plus court et plus clair (le métal en fusion).
// length = la longueur de la zone, en unités du dessin.
const HEAT = [
  { length: 80, color: "#b08a58" }, // doré terni : presque refroidi
  { length: 64, color: "#b0602f" }, // rouge sombre
  { length: 48, color: "#de6e28" }, // orange foncé
  { length: 33, color: "#f58f2e" }, // orange
  { length: 20, color: "#ffc356" }, // jaune
  { length: 8, color: "#fff5d6" }, // blanc : en fusion, au ras de la torche
];

// Les étincelles qui jaillissent de la torche : direction (dx, dy) et décalage dans le temps
const SPARKS = [
  { dx: -9, dy: 12, delay: 0 },
  { dx: 7, dy: 15, delay: 0.1 },
  { dx: -3, dy: 19, delay: 0.2 },
  { dx: 12, dy: 8, delay: 0.3 },
  { dx: -14, dy: 5, delay: 0.4 },
  { dx: 3, dy: 22, delay: 0.5 },
];

// Les repères de zones du cadre, comme sur un vrai plan : ils servent à dire « regarde en B3 ».
// Des chiffres en haut et en bas, des lettres sur les côtés.
const ZONE_COLUMNS = ["1", "2", "3", "4", "5", "6"];
const ZONE_ROWS = ["A", "B", "C", "D"];

// Petit raccourci pour écrire le début et la fin d'une animation : timing(0.1, 0.3)
function timing(start, end) {
  return { "--s": start, "--e": end };
}

// Pareil pour un trait de « AB », avec sa longueur en plus
function strokeVars(stroke) {
  return { ...timing(stroke.start, stroke.end), "--len": stroke.length };
}

// Dessine une liste de traits avec la même classe CSS.
// Le cordon est fait de plusieurs calques identiques : ce composant évite de répéter la boucle.
function Strokes({ strokes, className }) {
  return strokes.map((stroke) => <path key={stroke.d} className={className} d={stroke.d} />);
}

// Où une initiale du logo est-elle vraiment dessinée ? On le demande à un <canvas>, qui sait mesurer
// l'« encre » d'un texte : sa largeur réelle et la hauteur de la majuscule.
// Renvoie le centre de la lettre (x, y) et sa taille, en pixels à l'écran.
function measureInk(span, canvas) {
  const rect = span.getBoundingClientRect();
  const style = getComputedStyle(span);
  const context = canvas.getContext("2d");
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const metrics = context.measureText(span.textContent);

  // La ligne de base (là où les lettres sont « posées ») est sous le haut du <span>, à la hauteur de la police
  const baseline = rect.top + metrics.fontBoundingBoxAscent;
  const capitalHeight = metrics.actualBoundingBoxAscent;

  return {
    x: rect.left + (metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft) / 2,
    y: baseline - capitalHeight / 2,
    width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
    height: capitalHeight,
  };
}

// Une rangée de repères du cadre. side = le côté (top, bottom, left ou right).
function Zones({ side, labels }) {
  return (
    <div className={`intro-zones intro-zones-${side}`}>
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}

function Intro() {
  const { pathname } = useLocation();
  const [isEnabled, setIsEnabled] = useState(shouldPlay);
  const introRef = useRef(null);
  const planRef = useRef(null);

  // Si on quitte l'accueil, l'intro ne revient pas pendant cette visite.
  // (Mettre à jour un état pendant le rendu est permis quand c'est conditionnel comme ici :
  // React recalcule aussitôt, sans afficher l'étape intermédiaire.)
  if (isEnabled && pathname !== "/") setIsEnabled(false);

  const isVisible = isEnabled && pathname === "/";

  useEffect(() => {
    if (!isVisible) return;
    const intro = introRef.current;
    const root = document.documentElement;
    const sticky = intro.querySelector(".intro-sticky");
    const torchCores = intro.querySelectorAll(".torch-core");
    const letterGroups = intro.querySelectorAll(".letter");
    const canvas = document.createElement("canvas"); // jamais affiché : il sert seulement à mesurer du texte
    let frameId = null;

    // Le raccord avec la navbar : chaque lettre soudée vient se poser sur son initiale du logo
    // (le « A » de ADAM, le « B » de BOULKHEDERT). On mesure ici, pour chacune, de combien elle doit
    // se déplacer (--mx, --my) et rétrécir (--sx, --sy). Le CSS fait le reste (voir .letter).
    function measure() {
      const plan = planRef.current;
      const initials = document.querySelectorAll(".navbar .logo-initial");
      if (initials.length < LETTERS.length) return;

      const navbar = initials[0].closest(".navbar");
      const navbarTop = navbar.getBoundingClientRect().top;
      // La hauteur de la navbar sert au Hero pour rester épinglé juste en dessous (voir .hero-pin)
      root.style.setProperty("--navbar-h", `${navbar.offsetHeight}px`);

      // Le dessin fait 300 unités de large et commence à -30 (voir viewBox).
      // unit = le nombre de pixels à l'écran pour une unité du dessin.
      const unit = plan.offsetWidth / 300;

      // Pendant le raccord, la navbar n'est pas encore en haut de l'écran : elle remonte avec le défilement.
      // --travel = la distance totale de défilement de l'intro (en unités du dessin). Le CSS s'en sert
      // pour que les lettres visent la navbar là où elle se trouve à chaque instant, et pas sa place finale.
      intro.style.setProperty("--travel", (intro.offsetHeight - window.innerHeight) / unit);

      LETTERS.forEach((letter, index) => {
        // Le centre de la lettre soudée, à l'écran, avant le raccord
        const fromX = plan.offsetLeft + (letter.center + 30) * unit;
        const fromY = plan.offsetTop + (LETTER_MIDDLE + 30) * unit;

        // Le centre et la taille de l'initiale du logo, quand la navbar sera collée en haut de l'écran
        const ink = measureInk(initials[index], canvas);
        const toX = ink.x;
        const toY = ink.y - navbarTop;

        // Le déplacement est donné en unités du dessin (d'où la division par unit).
        // La taille finale tient compte de l'épaisseur du cordon, qui dépasse de chaque côté du tracé.
        const group = letterGroups[index];
        group.style.setProperty("--mx", (toX - fromX) / unit);
        group.style.setProperty("--my", (toY - fromY) / unit);
        group.style.setProperty("--sx", ink.width / ((letter.width + LANDED_WIDTH) * unit));
        group.style.setProperty("--sy", ink.height / ((LETTER_HEIGHT + LANDED_WIDTH) * unit));
      });
    }

    function update() {
      frameId = null;
      const rect = intro.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);

      // Pas de useState ici : on écrit directement la variable CSS, sans nouveau rendu React
      intro.style.setProperty("--p", progress);

      // La lueur de la torche sur le quadrillage : on cherche le trait en cours de soudure…
      const activeIndex = STROKES.findIndex(
        (stroke) => progress >= stroke.start && progress < stroke.end,
      );
      if (activeIndex === -1) {
        intro.style.setProperty("--light", 0);
      } else {
        // … puis où se trouve sa torche à l'écran, pour y centrer la lueur (voir .intro-sticky::after)
        const core = torchCores[activeIndex].getBoundingClientRect();
        const stickyRect = sticky.getBoundingClientRect();
        intro.style.setProperty("--lx", `${core.left + core.width / 2 - stickyRect.left}px`);
        intro.style.setProperty("--ly", `${core.top + core.height / 2 - stickyRect.top}px`);
        intro.style.setProperty("--light", 1);
      }

      // Pendant le raccord final, le bouton « Passer » est invisible : cette classe le désactive vraiment
      // (sinon il resterait cliquable, par-dessus la navbar qui apparaît)
      intro.classList.toggle("is-landing", progress >= 0.8);

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

    // Si la fenêtre change de taille, le logo et le plan bougent : on remesure
    function handleResize() {
      measure();
      handleScroll();
    }

    // Tant que l'intro est là, le Hero « tient » à l'écran après elle (voir has-intro dans le CSS)
    root.classList.add("has-intro");
    measure();
    update();
    // La police du logo peut arriver après le premier affichage : on remesure quand elle est prête
    document.fonts.ready.then(measure);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (frameId) cancelAnimationFrame(frameId);
      root.classList.remove("intro-playing", "has-intro");
    };
  }, [isVisible]);

  // Le bouton « Passer » : on descend directement jusqu'à la fin de l'intro
  // (sa hauteur, moins un écran : le site se trouve sous le dernier écran de l'intro)
  function skipIntro() {
    window.scrollTo({ top: introRef.current.offsetHeight - window.innerHeight, behavior: "smooth" });
  }

  if (!isVisible) return null;

  return (
    <div className="intro" ref={introRef}>
      <div className="intro-sticky">
        {/* Le cadre du plan : la bordure, ses repères de zones et le cartouche en bas à droite */}
        <div className="intro-frame" aria-hidden="true">
          <Zones side="top" labels={ZONE_COLUMNS} />
          <Zones side="bottom" labels={ZONE_COLUMNS} />
          <Zones side="left" labels={ZONE_ROWS} />
          <Zones side="right" labels={ZONE_ROWS} />

          {/* Le cartouche : la « carte d'identité » d'un plan. Chaque case a une étiquette et une valeur. */}
          <div className="intro-cartouche">
            <div className="intro-cartouche-wide">
              <span>Dessiné par</span>
              <strong>Adam Boulkhedert</strong>
            </div>
            <div>
              <span>Plan n°</span>
              <strong>01</strong>
            </div>
            <div>
              <span>Procédé</span>
              <strong>TIG · 141</strong>
            </div>
            <div>
              <span>Échelle</span>
              <strong>1:1</strong>
            </div>
            {/* Le contrôle passe de « En cours » à « Validé » quand « AB » est entièrement soudé */}
            <div className="intro-cartouche-check">
              <span>Contrôle</span>
              <strong className="pending">En cours</strong>
              <strong className="done">Validé ✓</strong>
            </div>
          </div>
        </div>

        <div className="intro-stage" aria-hidden="true">
          <div className="intro-plan" ref={planRef}>
            <svg viewBox="-30 -30 300 210">
              {/* Traits de construction (bleu acier, fins) : déjà tracés à l'arrivée */}
              <g className="construction">
                <line x1="-20" y1="10" x2="250" y2="10" />
                <line x1="-20" y1="130" x2="250" y2="130" />
                <line x1="55" y1="-20" x2="55" y2="150" />
                <circle cx="170" cy="70" r="36" />
              </g>

              {/* L'esquisse : « AB » en pointillés pâles, visible dès l'arrivée
                  (l'écran n'est jamais vide, on voit tout de suite ce qui va être soudé) */}
              <g className="sketch">
                <Strokes strokes={STROKES} />
              </g>

              {/* Les annotations du plan : elles apparaissent au fil de la soudure */}

              {/* Le symbole de soudure (norme ISO 2553) : une flèche vers le joint, un triangle
                  (= soudure d'angle) posé sur la ligne, et « 141 » dans la queue (= le procédé TIG) */}
              <g className="annotation fade" style={timing(0.16, 0.22)}>
                <path d="M49.1 5.2 L30 -10.6 L-4 -10.6 M-9 -15.6 L-4 -10.6 L-9 -5.6" />
                <path d="M8 -10.6 L8 -17.6 L15 -10.6" />
                <polygon className="arrow" points="53,8.3 48.1,6.4 50.2,3.9" />
                <text x="-11" y="-8" textAnchor="end">
                  141
                </text>
              </g>

              {/* L'angle au sommet du A */}
              <g className="annotation fade" style={timing(0.27, 0.33)}>
                <path d="M45.9 34.3 A26 26 0 0 0 64.1 34.3" />
                <text x="55" y="46" textAnchor="middle">
                  41°
                </text>
              </g>

              {/* Le rayon de la boucle basse du B */}
              <g className="annotation fade" style={timing(0.6, 0.66)}>
                <path d="M200 128 L212 142 L221 142" />
                <polygon className="arrow" points="196.7,124.2 201.2,127 198.8,129" />
                <text x="223" y="144.6">R31</text>
              </g>

              {/* Le masque : il décide quelle partie du cordon est visible (ce qui est déjà soudé).
                  Dans un masque, ce qui est blanc laisse voir, le reste cache.
                  pathLength : on donne au navigateur la longueur du trait, pour que le CSS
                  puisse dire « dessine-le jusqu'à tel endroit » (voir .draw). */}
              <mask id="intro-welded" maskUnits="userSpaceOnUse" x="-30" y="-30" width="300" height="210">
                {STROKES.map((stroke) => (
                  <path
                    key={stroke.d}
                    className="draw"
                    pathLength={stroke.length}
                    d={stroke.d}
                    style={strokeVars(stroke)}
                  />
                ))}
              </mask>

              {/* « A » et « B » : le cordon de soudure, qui recouvre l'esquisse au défilement.
                  Chaque lettre a son propre groupe : à la fin, elles se séparent pour aller chacune
                  sur son initiale dans la navbar. --ox = le point fixe de son rétrécissement (son milieu). */}
              {LETTERS.map((letter) => (
                <g key={letter.name} className="letter" style={{ "--ox": `${letter.center}px` }}>
                  {/* Le cordon, en 4 calques : le cœur, les écailles,
                      puis leur relief (une ombre entre deux écailles, un reflet sur chacune) */}
                  <g mask="url(#intro-welded)">
                    <Strokes strokes={letter.strokes} className="bead-core" />
                    <Strokes strokes={letter.strokes} className="bead-scales" />
                    <Strokes strokes={letter.strokes} className="bead-ripples" />
                    <Strokes strokes={letter.strokes} className="bead-ripples bead-ripples-light" />
                  </g>

                  {/* La chaleur : une zone incandescente qui suit la torche, puis glisse hors du trait
                      (le cordon refroidit et retrouve sa couleur dorée) */}
                  {letter.strokes.map((stroke) => (
                    <g key={stroke.d} className="heat" style={strokeVars(stroke)}>
                      {HEAT.map((layer) => (
                        <path
                          key={layer.length}
                          pathLength={stroke.length}
                          d={stroke.d}
                          style={{ "--hot": layer.length, stroke: layer.color }}
                        />
                      ))}
                    </g>
                  ))}
                </g>
              ))}

              {/* La torche : un point lumineux qui suit le bout de chaque trait pendant qu'il se soude.
                  offset-path = le même chemin que le trait ; le CSS place la torche dessus selon --t */}
              {STROKES.map((stroke) => (
                <g
                  key={stroke.d}
                  className="torch"
                  style={{ ...timing(stroke.start, stroke.end), offsetPath: `path("${stroke.d}")` }}
                >
                  <circle className="torch-core" r="2.6" />
                  {SPARKS.map((spark, index) => (
                    <circle
                      key={index}
                      className="torch-spark"
                      r="0.9"
                      style={{ "--dx": `${spark.dx}px`, "--dy": `${spark.dy}px`, animationDelay: `${spark.delay}s` }}
                    />
                  ))}
                </g>
              ))}

              {/* Cotes : trait, petites barres aux extrémités, et la mesure */}
              <g className="dimension fade" style={timing(0.63, 0.71)}>
                <line x1="10" y1="160" x2="204" y2="160" />
                <line x1="10" y1="154" x2="10" y2="166" />
                <line x1="204" y1="154" x2="204" y2="166" />
                <text x="107" y="176">194</text>
              </g>
              <g className="dimension fade" style={timing(0.67, 0.75)}>
                <line x1="230" y1="10" x2="230" y2="130" />
                <line x1="224" y1="10" x2="236" y2="10" />
                <line x1="224" y1="130" x2="236" y2="130" />
                <text x="244" y="74">120</text>
              </g>
            </svg>
          </div>

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
