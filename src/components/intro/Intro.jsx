import { useRef, useState } from "react";
import { useLocation } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { createSparks } from "../../utils/sparks";
import { createWeldSound } from "../../utils/weldSound";
import { scrollToPosition, wantsSmoothScroll } from "../../utils/smoothScroll";
import { useLanguage } from "../../i18n/LanguageContext";

// GSAP est la bibliothèque d'animation ; ScrollTrigger est son module qui relie une animation
// au défilement de la page ; useGSAP est le « hook » qui les fait fonctionner proprement avec React.
// On les déclare une fois, ici, avant de s'en servir.
gsap.registerPlugin(ScrollTrigger, useGSAP);

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
   - une « timeline » GSAP décrit le déroulé de l'intro, étape par étape, sur une durée de 1 ;
   - ScrollTrigger fait avancer cette timeline avec le défilement, en lissant le mouvement ;
   - la timeline ne fait que changer des variables CSS (--t, --u, --land…) : c'est le CSS qui
     décide de l'apparence correspondante (voir intro.css).

   Affichée sur l'accueil à chaque chargement de la page : elle fait partie de la page, tout en haut,
   au-dessus du Hero, et on peut toujours remonter la revoir. Après une actualisation, le navigateur
   remet la page là où on l'avait laissée : l'intro est donc là, au-dessus, sans se rejouer d'elle-même.
   Jamais avec « réduire les animations ».
   ===================================================================== */

function shouldPlay() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// L'épaisseur des lettres, en unités du dessin : c'est elle qui les rend plus ou moins grasses
const BEAD_WIDTH = 14;

// Les deux lettres, et les traits qui les composent, dans l'ordre où ils sont soudés.
// center = le milieu de la lettre (en unités du dessin) ; outerWidth = sa largeur totale, épaisseur comprise
// (elle dépend de BEAD_WIDTH : plus les lettres sont grasses, plus elles sont larges).
// Pour chaque trait : d = le chemin SVG que suit la torche ; length = sa longueur ;
// start et end = le moment de l'intro où il se soude (0 = tout en haut, 1 = la fin).
// shape (facultatif) = le chemin utilisé pour DESSINER le trait, quand il diffère de d : les jambes du A
// sont prolongées vers le bas, puis coupées net à l'horizontale (voir le clipPath), pour des pieds bien plats.
const LETTERS = [
  {
    name: "A",
    center: 55,
    outerWidth: 90 + 1.443 * BEAD_WIDTH,
    strokes: [
      {
        d: "M10 130 L55 10 L100 130",
        shape: "M2.5 150 L55 10 L107.5 150",
        length: 256,
        start: 0.05,
        end: 0.27,
      }, // les deux jambes
      // la barre : dessinée un peu plus courte que le trajet de la torche, pour que ses bouts carrés
      // restent cachés à l'intérieur des jambes (sinon un coin dépasse de la jambe, qui est en biais)
      { d: "M28 86 L82 86", shape: "M32 86 L78 86", length: 54, start: 0.27, end: 0.34 },
    ],
  },
  {
    name: "B",
    center: 167,
    outerWidth: 74 + BEAD_WIDTH,
    strokes: [
      { d: "M130 130 L130 10 L168 10 Q198 10 198 39 Q198 68 168 68 L130 68", length: 292, start: 0.34, end: 0.51 }, // le fût et la boucle haute
      { d: "M168 68 Q204 68 204 99 Q204 130 168 130 L130 130", length: 147, start: 0.51, end: 0.63 }, // la boucle basse
    ],
  },
];

// Tous les traits à la suite (les 2 du A puis les 2 du B) : flatMap « aplatit » les listes en une seule
const STROKES = LETTERS.flatMap((letter) => letter.strokes);

// Les lettres sont coupées net en haut et en bas (sommet et pieds du A bien plats).
// Leurs tracés vont de 10 à 130 unités ; avec l'épaisseur, elles vont donc de LETTER_TOP à LETTER_BOTTOM.
const LETTER_TOP = 10 - BEAD_WIDTH / 2;
const LETTER_BOTTOM = 130 + BEAD_WIDTH / 2;
const LETTER_MIDDLE = 70; // leur milieu, entre les deux
const LETTER_HEIGHT = LETTER_BOTTOM - LETTER_TOP;
// Le masque qui dévoile une lettre est plus large qu'elle, pour être sûr de ne rien rogner
const MASK_WIDTH = BEAD_WIDTH + 16;

// La chaleur du métal, juste derrière la torche : la lettre elle-même change de couleur.
// Blanche au ras de la torche, elle passe au jaune puis à l'orange, et retrouve peu à peu son doré.
// HEAT_LENGTH = la longueur de cette zone chaude, en unités du dessin.
const HEAT_LENGTH = 72;

// Pour obtenir un dégradé continu (et pas des bandes de couleur), chaque couleur est faite de plusieurs
// calques très transparents, de plus en plus courts : là où beaucoup de calques se superposent (près de
// la torche), la couleur est vive ; là où il n'y en a qu'un (loin de la torche), on la devine à peine.
// reach = jusqu'où la couleur s'étend (1 = toute la zone chaude) ; steps = le nombre de calques ;
// opacity = l'opacité de chaque calque.
const HEAT_RAMPS = [
  { color: "#ff7a1a", reach: 1, steps: 12, opacity: 0.17 }, // orange : toute la zone chaude
  { color: "#ffc94d", reach: 0.45, steps: 6, opacity: 0.3 }, // jaune : la moitié la plus proche de la torche
  { color: "#fffaf0", reach: 0.17, steps: 5, opacity: 0.45 }, // blanc : au ras de la torche
];

// La liste de tous les calques, du plus long au plus court pour chaque couleur
const HEAT = HEAT_RAMPS.flatMap((ramp) =>
  Array.from({ length: ramp.steps }, (unused, index) => ({
    length: HEAT_LENGTH * ramp.reach * (1 - index / ramp.steps),
    color: ramp.color,
    opacity: ramp.opacity,
  })),
);

// Les repères de zones du cadre, comme sur un vrai plan : ils servent à dire « regarde en B3 ».
// Des chiffres en haut et en bas, des lettres sur les côtés.
const ZONE_COLUMNS = ["1", "2", "3", "4", "5", "6"];
const ZONE_ROWS = ["A", "B", "C", "D"];

// Les éléments du plan qui apparaissent en fondu : lequel (une classe CSS), quand, et en combien de temps.
// Comme pour les traits, les moments sont des fractions de l'intro (0 = tout en haut, 1 = la fin).
const FADES = [
  { target: ".note-weld", at: 0.16, duration: 0.06 }, // le symbole de soudure, quand la torche passe au sommet du A
  { target: ".note-angle", at: 0.27, duration: 0.06 }, // l'angle du A, une fois ses deux jambes soudées
  { target: ".note-radius", at: 0.6, duration: 0.06 }, // le rayon du B
  { target: ".dimension-width", at: 0.63, duration: 0.08 }, // la cote de largeur
  { target: ".dimension-height", at: 0.67, duration: 0.08 }, // la cote de hauteur
];

// Les grandes étapes de la fin de l'intro
const LANDING_START = 0.8; // le plan commence à s'effacer et les lettres décollent
const LANDING_END = 0.97; // les lettres sont posées sur le logo : le site prend le relais
const SMOOTHING = 0.5; // le lissage : l'animation rattrape le défilement en une demi-seconde
// Quand le défilement fluide est actif (souris ou pavé tactile, voir smoothScroll.js), la page glisse
// déjà d'elle-même : on ne garde qu'un léger lissage. Avec les deux à plein, les retards s'additionnent
// et la soudure traîne derrière la molette.
const SMOOTHING_WITH_GLIDE = 0.2;

// Les étincelles : combien en jaillit par seconde quand la torche est à l'arrêt, et au maximum
// quand on défile vite (plus on défile, plus on « soude » vite, plus il y en a)
const SPARKS_IDLE = 16;
const SPARKS_MAX = 240;

// Le film : la soudure filmée. C'est une vidéo découpée en images au fond transparent (public/intro),
// qu'on fait défiler image par image avec la page. Sur un écran large, il remplace la soudure dessinée
// par le code (lettres, chaleur, torche, étincelles) ; le reste du plan ne change pas.
// Il suit exactement les mêmes tracés que STROKES, dans le même ordre et au même rythme.
const FILM = {
  frames: 152, // le nombre d'images : f-000.webp … f-151.webp (3,8 Mo en tout, 24 images par seconde)
  start: 0.03, // l'avancement de l'intro où le film commence…
  end: 0.7, // … et celui où il est terminé : les lettres sont entières et refroidies
  // Entre ces deux avancements, la lumière de soudure est allumée dans le film (c'est là qu'on entend le son)
  lightFrom: 0.05,
  lightTo: 0.665,
  // Sa place dans le dessin, en unités du dessin. La vidéo fait 1920 × 1080 pixels, à 5,2 pixels par
  // unité, et le point (0 ; 0) du dessin s'y trouve à (411,7 ; 176).
  x: -411.7 / 5.2,
  y: -176 / 5.2,
  width: 1920 / 5.2,
  height: 1080 / 5.2,
  // La taille des images (elles sont plus petites que la vidéo d'origine, pour peser moins lourd)
  pixelWidth: 864,
  pixelHeight: 486,
  // Combien d'images on garde prêtes à dessiner, derrière et devant celle qu'on regarde (voir prepareFilm)
  keepBehind: 8,
  keepAhead: 14,
  // Trop lourd pour un téléphone : en dessous de cette largeur, on garde la soudure dessinée
  screen: "(min-width: 900px)",
};

// La frontière entre le « A » et le « B » dans l'image du film (entre le pied droit du A et le fût du B) :
// elle sert à découper la dernière image en deux lettres, qui partent chacune vers son initiale du logo
const FILM_SPLIT = 118.5;

// L'adresse d'une image du film. BASE_URL = la racine du site (« / » la plupart du temps).
const filmUrl = (name) => `${import.meta.env.BASE_URL}intro/${name}.webp`;

// Le son de la soudure : un crépitement (voir weldSound.js). Son niveau va de 0 à 1 :
// SOUND_IDLE quand la lumière est allumée mais qu'on ne défile pas (un fond discret),
// et la vitesse de défilement s'y ajoute : plus on défile vite, plus ça crépite fort.
const SOUND_IDLE = 0.15;
const SOUND_PER_SPEED = 6;

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
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [isEnabled, setIsEnabled] = useState(shouldPlay);
  // Le film n'est proposé que sur un écran large (décidé une fois, à l'arrivée)
  const [hasFilm] = useState(() => window.matchMedia(FILM.screen).matches);
  // Le son est coupé à l'arrivée : c'est au visiteur de l'activer (bouton « Son »)
  const [isSoundOn, setIsSoundOn] = useState(false);
  const introRef = useRef(null);
  const planRef = useRef(null);
  const filmRef = useRef(null);
  // Le son, pour la boucle d'animation (qui ne peut pas lire l'état React) :
  // le son une fois créé, et le réglage du bouton
  const soundRef = useRef(null);
  const soundOnRef = useRef(false);

  // Si on quitte l'accueil, l'intro ne revient pas pendant cette visite.
  // (Mettre à jour un état pendant le rendu est permis quand c'est conditionnel comme ici :
  // React recalcule aussitôt, sans afficher l'étape intermédiaire.)
  if (isEnabled && pathname !== "/") setIsEnabled(false);

  const isVisible = isEnabled && pathname === "/";

  // useGSAP remplace useEffect pour tout ce qui touche à GSAP : quand le composant disparaît,
  // il arrête et efface tout seul les animations créées ici.
  useGSAP(
    () => {
      if (!isVisible) return;
      const intro = introRef.current;
      const root = document.documentElement;
      const sticky = intro.querySelector(".intro-sticky");
      const drawPaths = intro.querySelectorAll(".draw");
      const heats = intro.querySelectorAll(".heat");
      const torches = intro.querySelectorAll(".torch");
      const torchCores = intro.querySelectorAll(".torch-core");
      const letterGroups = intro.querySelectorAll(".letter");
      const canvas = document.createElement("canvas"); // jamais affiché : il sert seulement à mesurer du texte

      // Les étincelles (voir sparks.js), et ce dont elles ont besoin :
      const sparks = createSparks(intro.querySelector(".intro-sparks"));
      let unit = 1; // la taille d'une unité du dessin à l'écran, en pixels (calculée dans measure)
      let torch = null; // la position de la torche à l'écran quand on soude, sinon null
      let lastProgress = 0; // l'avancement à l'image précédente, pour connaître la vitesse de soudure
      let sparkBudget = 0; // les « fractions d'étincelle » en attente (on ne peut en créer que des entières)
      let soundLevel = 0; // le niveau du son demandé en dernier

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
        unit = plan.offsetWidth / 300;
        sparks.resize();

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
          // Le rétrécissement = la taille de l'initiale du logo divisée par celle de la lettre soudée.
          const group = letterGroups[index];
          group.style.setProperty("--mx", (toX - fromX) / unit);
          group.style.setProperty("--my", (toY - fromY) / unit);
          group.style.setProperty("--sx", ink.width / (letter.outerWidth * unit));
          group.style.setProperty("--sy", ink.height / (LETTER_HEIGHT * unit));
        });
      }

      // La timeline est créée un peu plus bas : on réserve son nom ici, car syncState en a besoin.
      let timeline = null;

      // Le film (voir FILM). Ses images passent par deux états :
      // - filmFiles : les fichiers téléchargés, encore compressés (légers : 3,8 Mo pour tout le film) ;
      // - filmBitmaps : les images « décodées », prêtes à être dessinées d'un coup (lourdes : 1,7 Mo chacune).
      // Décoder une image au moment de l'afficher fait saccader le défilement, et les garder toutes décodées
      // prendrait 250 Mo de mémoire : on ne garde donc décodées que celles autour de l'image qu'on regarde,
      // préparées en avance, en tâche de fond.
      const filmContext = filmRef.current?.getContext("2d");
      const filmFiles = [];
      const filmBitmaps = new Map(); // numéro de l'image → image décodée
      const filmDecoding = new Set(); // les numéros en cours de décodage
      let isFilmOn = false; // le film a-t-il pris la place de la soudure dessinée ?
      let isFilmClosed = false; // l'intro a disparu : on ne garde plus rien
      let filmTarget = 0; // le numéro de l'image qu'on voudrait afficher
      let filmShown = -1; // ce qui est affiché en ce moment : le numéro de l'image, et sa part de la suivante

      // Prépare les images autour du numéro donné, et libère celles qui en sont trop loin
      function prepareFilm(center) {
        const from = Math.max(0, center - FILM.keepBehind);
        const to = Math.min(FILM.frames - 1, center + FILM.keepAhead);

        filmBitmaps.forEach((bitmap, index) => {
          if (index < from - 2 || index > to + 2) {
            bitmap.close();
            filmBitmaps.delete(index);
          }
        });

        for (let index = from; index <= to; index++) {
          if (!filmFiles[index] || filmBitmaps.has(index) || filmDecoding.has(index)) continue;
          filmDecoding.add(index);
          // createImageBitmap décode en tâche de fond, sans bloquer le défilement
          createImageBitmap(filmFiles[index])
            .then((bitmap) => {
              filmDecoding.delete(index);
              if (isFilmClosed) {
                bitmap.close();
                return;
              }
              filmBitmaps.set(index, bitmap);

              // La première image est prête : le film peut prendre la place de la soudure dessinée
              if (index === 0) startFilm();
              // Une image qu'on attendait vient d'arriver : on réaffiche
              if (isFilmOn && Math.abs(index - filmTarget) <= 1) syncState();
            })
            .catch(() => filmDecoding.delete(index));
        }
      }

      // Le film prend la place de la soudure dessinée, mais seulement à un moment où ça ne se voit pas
      // (sinon la soudure changerait d'aspect en cours de route) : tout au début, quand rien n'est encore
      // soudé, ou tout à la fin, quand le plan est effacé (la page s'est ouverte plus bas, après une
      // actualisation par exemple : le film est alors prêt si on remonte revoir l'intro).
      function startFilm() {
        if (isFilmOn || !filmBitmaps.has(0)) return;
        const progress = timeline.progress();
        if (progress > FILM.start && progress < LANDING_END) return;

        isFilmOn = true;
        intro.classList.add("film-on");
      }

      // Affiche l'image du film qui correspond à l'avancement de l'intro.
      // Entre deux images, on les fond l'une dans l'autre : quand on défile lentement, la lumière glisse
      // au lieu d'avancer par à-coups.
      function drawFilm(progress) {
        const position = gsap.utils.clamp(0, 1, (progress - FILM.start) / (FILM.end - FILM.start));
        const exact = position * (FILM.frames - 1);
        const wanted = Math.floor(exact);
        // mix = la part de l'image suivante, de 0 à 1, arrondie au huitième (inutile de redessiner pour moins)
        let mix = Math.round((exact - wanted) * 8) / 8;

        filmTarget = wanted;
        prepareFilm(wanted);

        // L'image voulue n'est pas encore prête : on prend la plus proche qui l'est, d'abord en arrière
        let index = wanted;
        while (index > 0 && !filmBitmaps.has(index)) index -= 1;
        if (!filmBitmaps.has(index)) {
          index = wanted;
          while (index < FILM.frames - 1 && !filmBitmaps.has(index)) index += 1;
        }
        if (!filmBitmaps.has(index)) return;
        if (index !== wanted || !filmBitmaps.has(index + 1)) mix = 0;
        if (index + mix === filmShown) return;

        filmShown = index + mix;
        filmContext.clearRect(0, 0, FILM.pixelWidth, FILM.pixelHeight);
        filmContext.globalCompositeOperation = "source-over";
        filmContext.globalAlpha = 1 - mix;
        filmContext.drawImage(filmBitmaps.get(index), 0, 0);
        if (mix > 0) {
          // « lighter » additionne les deux images : (1 - mix) de la première + mix de la seconde
          filmContext.globalCompositeOperation = "lighter";
          filmContext.globalAlpha = mix;
          filmContext.drawImage(filmBitmaps.get(index + 1), 0, 0);
        }
      }

      // L'avancement de l'intro la dernière fois que syncState est passée (voir animateSparks)
      let syncedProgress = -1;

      // Appelée à chaque image où la timeline avance : met à jour ce que la timeline ne gère pas elle-même.
      function syncState() {
        if (!timeline) return;
        // Où en est l'intro, de 0 à 1 (c'est l'avancement LISSÉ : celui qu'on voit à l'écran)
        const progress = timeline.progress();
        syncedProgress = progress;

        // Le film n'a pas pu démarrer quand sa première image est arrivée (on était en pleine soudure) :
        // on retente à chaque passage
        startFilm();

        if (isFilmOn) {
          drawFilm(progress);
          // Le film est fini : la toile laisse la place aux deux lettres, qui pourront s'envoler
          intro.classList.toggle("film-done", progress >= FILM.end);
        }

        // La lueur de la torche sur le quadrillage : on cherche le trait en cours de soudure…
        // (avec le film, pas de torche dessinée : la lumière et les étincelles sont dans l'image)
        const activeIndex = isFilmOn
          ? -1
          : STROKES.findIndex((stroke) => progress >= stroke.start && progress < stroke.end);
        if (activeIndex === -1) {
          torch = null;
          intro.style.setProperty("--light", 0);
        } else {
          // … puis où se trouve sa torche à l'écran, pour y centrer la lueur (voir .intro-sticky::after)
          // et en faire jaillir les étincelles
          const core = torchCores[activeIndex].getBoundingClientRect();
          const stickyRect = sticky.getBoundingClientRect();
          torch = {
            x: core.left + core.width / 2 - stickyRect.left,
            y: core.top + core.height / 2 - stickyRect.top,
          };
          intro.style.setProperty("--lx", `${torch.x}px`);
          intro.style.setProperty("--ly", `${torch.y}px`);
          intro.style.setProperty("--light", 1);
        }

        // Pendant le raccord final, le bouton « Passer » est invisible : cette classe le désactive vraiment
        // (sinon il resterait cliquable, par-dessus la navbar qui apparaît)
        intro.classList.toggle("is-landing", progress >= LANDING_START);

        // Les animations du Hero attendent la fin de l'intro
        root.classList.toggle("intro-playing", progress < LANDING_END);
      }

      // Qui fait défiler la page ? Tant que le visiteur n'a touché à rien (molette, doigt, clavier, clic),
      // ce n'est pas lui : c'est le navigateur, qui remet la page là où elle était après une actualisation,
      // ou une ancre dans l'adresse (/#contact). Dans ce cas l'intro se place d'un coup au bon endroit,
      // sans lissage : sinon on la verrait se rejouer en accéléré par-dessus le site.
      let hasVisitorMoved = false;
      const gestures = ["wheel", "touchstart", "keydown", "pointerdown"];

      function noteGesture() {
        hasVisitorMoved = true;
        gestures.forEach((type) => window.removeEventListener(type, noteGesture));
      }
      // passive : on promet au navigateur de ne pas bloquer ces gestes, il n'a pas à nous attendre
      gestures.forEach((type) => window.addEventListener(type, noteGesture, { passive: true }));

      // Place l'intro exactement là où en est le défilement, sans attendre le lissage.
      // getTween() donne l'animation de rattrapage de ScrollTrigger : progress(1) la termine tout de suite.
      function placeAtOnce(trigger) {
        if (hasVisitorMoved || !timeline) return;

        const catchUp = trigger.getTween();
        if (catchUp) catchUp.progress(1);
        else timeline.progress(trigger.progress);
      }

      // La timeline : le déroulé complet de l'intro, sur une durée totale de 1.
      // Chaque ligne « timeline.to(quoi, { vers quelles valeurs, duration }, à quel moment) » est une étape.
      measure();
      timeline = gsap.timeline({
        // ease: "none" = vitesse constante. Le mouvement suit le défilement, sans accélération ajoutée.
        defaults: { ease: "none" },
        onUpdate: syncState,
        // ScrollTrigger relie la timeline au défilement : elle commence quand le haut de l'intro
        // touche le haut de l'écran, et finit quand le bas de l'intro touche le bas de l'écran.
        scrollTrigger: {
          trigger: intro,
          start: "top top",
          end: "bottom bottom",
          scrub: wantsSmoothScroll() ? SMOOTHING_WITH_GLIDE : SMOOTHING,
          // --p = l'avancement RÉEL du défilement (non lissé). Le CSS s'en sert pour savoir où se trouve
          // la navbar pendant le raccord (voir --target-y dans .letter).
          onUpdate: (self) => {
            intro.style.setProperty("--p", self.progress);
            placeAtOnce(self);
          },
          // ScrollTrigger refait ses calculs au chargement et quand la fenêtre change de taille :
          // on remesure avec lui
          onRefresh: (self) => {
            measure();
            placeAtOnce(self);
          },
        },
      });

      // 1. L'invitation à défiler s'efface dès qu'on commence
      timeline.to(".intro-hint", { opacity: 0, duration: 0.05 }, 0);

      // 2. La soudure, trait par trait
      STROKES.forEach((stroke, index) => {
        const duration = stroke.end - stroke.start;

        // --t passe de 0 à 1 : le cordon se dévoile et la torche avance le long du trait
        timeline.to([drawPaths[index], torches[index]], { "--t": 1, duration }, stroke.start);

        // --u fait la même chose pour la zone incandescente, mais continue après 1 : une fois le trait fini,
        // la chaleur glisse hors du trait (le métal refroidit). On s'arrête quand la zone la plus longue est
        // entièrement sortie (les 8 unités en plus évitent qu'il en reste un point au bout du trait).
        const cooling = 1 + (HEAT_LENGTH + BEAD_WIDTH) / stroke.length;
        timeline.to(heats[index], { "--u": cooling, duration: duration * cooling }, stroke.start);
      });

      // 3. Les annotations et les cotes apparaissent au fur et à mesure
      FADES.forEach((fade) => {
        timeline.to(fade.target, { "--t": 1, duration: fade.duration }, fade.at);
      });

      // 4. Le contrôle du cartouche passe à « Validé »
      timeline.to(".intro-cartouche-check", { "--done": 1, duration: 0.06 }, 0.72);

      // 5. Le raccord final : le plan s'efface (--land) pendant que les lettres volent vers le logo (--fly).
      //    Le vol se termine un peu avant le plan, pour qu'on voie les lettres posées à leur place.
      timeline.to(intro, { "--land": 1, duration: 1 - LANDING_START }, LANDING_START);
      timeline.to(intro, { "--fly": 1, duration: LANDING_END - LANDING_START }, LANDING_START);

      // Les étincelles vivent leur vie à chaque image, même quand on ne défile pas.
      // gsap.ticker appelle cette fonction environ 60 fois par seconde ; deltaTime = le temps écoulé
      // depuis l'image précédente, en millisecondes.
      function animateSparks(time, deltaTime) {
        const seconds = Math.min(deltaTime / 1000, 0.05);
        // La vitesse de soudure : de combien l'intro a avancé depuis l'image précédente
        const progress = timeline.progress();
        const speed = seconds > 0 ? Math.abs(progress - lastProgress) / seconds : 0;
        lastProgress = progress;

        // Un filet de sécurité : quand la fenêtre change de taille, ScrollTrigger refait ses calculs et peut
        // déplacer la timeline sans nous prévenir (sans appeler syncState). On rattrape ici : sinon le logo
        // pouvait rester sans ses initiales, comme si l'intro était encore en cours.
        if (progress !== syncedProgress) syncState();

        if (torch) {
          const perSecond = Math.min(SPARKS_IDLE + speed * 1400, SPARKS_MAX);
          sparkBudget += perSecond * seconds;
          const count = Math.floor(sparkBudget);
          sparkBudget -= count;
          sparks.emit(torch.x, torch.y, count, unit);
        }

        sparks.update(seconds);

        // Le son suit la soudure : silence hors de la soudure, un fond discret quand la lumière est
        // allumée, plus fort quand on défile. (On ne règle le volume que s'il a vraiment changé.)
        if (soundRef.current) {
          const isWelding = isFilmOn
            ? progress > FILM.lightFrom && progress < FILM.lightTo
            : torch !== null;
          const level =
            soundOnRef.current && isWelding ? Math.min(SOUND_IDLE + speed * SOUND_PER_SPEED, 1) : 0;
          if (Math.abs(level - soundLevel) > 0.02 || (level === 0 && soundLevel !== 0)) {
            soundLevel = level;
            soundRef.current.setLevel(level);
          }
        }
      }
      gsap.ticker.add(animateSparks);

      // Le téléchargement du film, image par image (le navigateur les prend quelques-unes à la fois).
      // Chaque fichier arrivé est gardé tel quel ; prepareFilm décode ceux dont on a besoin.
      if (filmContext) {
        for (let index = 0; index < FILM.frames; index++) {
          fetch(filmUrl(`f-${String(index).padStart(3, "0")}`))
            .then((response) => (response.ok ? response.blob() : Promise.reject(new Error("image absente"))))
            .then((file) => {
              if (isFilmClosed) return;
              filmFiles[index] = file;
              prepareFilm(filmTarget);
            })
            .catch(() => {
              // Une image manquante n'empêche rien : le film affichera sa voisine
            });
        }
      }

      // Tant que l'intro est là, le Hero « tient » à l'écran après elle (voir has-intro dans le CSS)
      root.classList.add("has-intro");
      syncState();
      // La police du logo peut arriver après le premier affichage : on remesure quand elle est prête
      document.fonts.ready.then(measure);

      // Le nettoyage : useGSAP arrête lui-même la timeline, il reste à arrêter les étincelles et le son,
      // à libérer les images du film et à retirer nos classes
      return () => {
        gsap.ticker.remove(animateSparks);
        gestures.forEach((type) => window.removeEventListener(type, noteGesture));
        soundRef.current?.close();
        soundRef.current = null;
        isFilmClosed = true;
        filmBitmaps.forEach((bitmap) => bitmap.close());
        filmBitmaps.clear();
        root.classList.remove("intro-playing", "has-intro");
      };
    },
    // scope : les sélecteurs comme ".intro-hint" ne cherchent qu'à l'intérieur de l'intro.
    // dependencies : on recrée tout si l'intro apparaît ou disparaît.
    { scope: introRef, dependencies: [isVisible] },
  );

  // Le bouton « Son » : active ou coupe le crépitement de la soudure.
  // Au premier clic, on fabrique le son : ce clic est aussi l'autorisation que le navigateur attend.
  function toggleSound() {
    let isOn = !isSoundOn;

    if (isOn && !soundRef.current) {
      try {
        soundRef.current = createWeldSound();
      } catch {
        // Ce navigateur ne sait pas fabriquer de son : le bouton reste sur « non »
        isOn = false;
      }
    }

    setIsSoundOn(isOn);
    soundOnRef.current = isOn;
  }

  // Le bouton « Passer » : on descend directement jusqu'à la fin de l'intro
  // (sa hauteur, moins un écran : le site se trouve sous le dernier écran de l'intro)
  function skipIntro() {
    scrollToPosition(introRef.current.offsetHeight - window.innerHeight);
  }

  if (!isVisible) return null;

  return (
    // --bead : l'épaisseur des lettres, transmise au CSS (voir --w dans intro.css)
    // has-film : sur un écran large, l'intro est plus longue, pour laisser le temps de voir le film (voir le CSS)
    <div className={`intro ${hasFilm ? "has-film" : ""}`} ref={introRef} style={{ "--bead": BEAD_WIDTH }}>
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
              <span>{t.intro.drawnBy}</span>
              <strong>Adam Boulkhedert</strong>
            </div>
            <div>
              <span>{t.intro.planNumber}</span>
              <strong>01</strong>
            </div>
            <div>
              <span>{t.intro.process}</span>
              <strong>TIG · 141</strong>
            </div>
            <div>
              <span>{t.intro.scale}</span>
              <strong>1:1</strong>
            </div>
            {/* Le contrôle passe de « En cours » à « Validé » quand « AB » est entièrement soudé */}
            <div className="intro-cartouche-check">
              <span>{t.intro.check}</span>
              <strong className="pending">{t.intro.pending}</strong>
              <strong className="done">{t.intro.done}</strong>
            </div>
          </div>
        </div>

        <div className="intro-stage" aria-hidden="true">
          <div className="intro-plan" ref={planRef}>
            <svg viewBox="-30 -30 300 210">
              {/* Des éléments définis une fois et réutilisés plus bas grâce à leur id */}
              <defs>
                {/* Un « emporte-pièce » : ce qui dépasse du rectangle n'est pas dessiné.
                    Il coupe les lettres net en haut et en bas (sommet et pieds du A bien plats). */}
                <clipPath id="intro-clip">
                  <rect x="-30" y={LETTER_TOP} width="300" height={LETTER_HEIGHT} />
                </clipPath>
                {/* L'or des lettres : un dégradé du haut (clair, là où tombe la lumière) vers le bas
                    (plus sombre). C'est ce qui leur donne un aspect métallique plutôt qu'un aplat terne. */}
                <linearGradient
                  id="intro-gold"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1={LETTER_TOP}
                  x2="0"
                  y2={LETTER_BOTTOM}
                >
                  <stop offset="0" stopColor="#fbe8b6" />
                  <stop offset="0.4" stopColor="#e2bf78" />
                  <stop offset="1" stopColor="#b08542" />
                </linearGradient>
                {/* Deux emporte-pièces pour la dernière image du film : la moitié gauche (le « A »)
                    et la moitié droite (le « B »), de part et d'autre de FILM_SPLIT */}
                <clipPath id="intro-film-A">
                  <rect x={FILM.x} y={FILM.y} width={FILM_SPLIT - FILM.x} height={FILM.height} />
                </clipPath>
                <clipPath id="intro-film-B">
                  <rect
                    x={FILM_SPLIT}
                    y={FILM.y}
                    width={FILM.x + FILM.width - FILM_SPLIT}
                    height={FILM.height}
                  />
                </clipPath>
              </defs>

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

              {/* Le film de la soudure (voir FILM) : une toile dans laquelle le JavaScript affiche l'image
                  qui correspond au défilement. foreignObject permet de poser un élément HTML dans le dessin :
                  la toile suit donc exactement la position et la taille des lettres, à toutes les tailles d'écran.
                  Placée ici, elle passe au-dessus des traits de construction et sous les annotations. */}
              {hasFilm && (
                <foreignObject className="film" x={FILM.x} y={FILM.y} width={FILM.width} height={FILM.height}>
                  <canvas ref={filmRef} width={FILM.pixelWidth} height={FILM.pixelHeight} />
                </foreignObject>
              )}

              {/* Les annotations du plan : elles apparaissent au fil de la soudure */}

              {/* Le symbole de soudure (norme ISO 2553) : une flèche vers le joint, un triangle
                  (= soudure d'angle) posé sur la ligne, et « 141 » dans la queue (= le procédé TIG) */}
              <g className="annotation fade note-weld">
                <path d="M44.2 1.1 L30 -10.6 L-4 -10.6 M-9 -15.6 L-4 -10.6 L-9 -5.6" />
                <path d="M8 -10.6 L8 -17.6 L15 -10.6" />
                <polygon className="arrow" points="48.1,4.3 43.2,2.3 45.2,-0.2" />
                <text x="-11" y="-8" textAnchor="end">
                  141
                </text>
              </g>

              {/* L'angle entre les deux jambes du A (l'arc est tracé assez bas pour rester visible
                  entre les jambes, maintenant qu'elles sont épaisses) */}
              <g className="annotation fade note-angle">
                <path d="M33.2 68 A62 62 0 0 0 76.8 68" />
                <text x="55" y="64" textAnchor="middle">
                  41°
                </text>
              </g>

              {/* Le rayon de la boucle basse du B */}
              <g className="annotation fade note-radius">
                <path d="M204 132.7 L212 142 L221 142" />
                <polygon className="arrow" points="200.7,128.9 205.2,131.7 202.8,133.8" />
                <text x="223" y="144.6">R31</text>
              </g>

              {/* Les masques : un par trait. Un masque décide quelle partie de la lettre est visible
                  (ce qui est déjà soudé) : ce qui y est blanc laisse voir, le reste cache.
                  Chaque trait a le sien, sinon le début de la barre du A, posé sur la jambe,
                  apparaîtrait dès que la jambe est soudée.
                  pathLength : on donne au navigateur la longueur du trait, pour que le CSS
                  puisse dire « dessine-le jusqu'à tel endroit » (voir .draw). */}
              {STROKES.map((stroke, index) => (
                <mask
                  key={stroke.d}
                  id={`intro-welded-${index}`}
                  maskUnits="userSpaceOnUse"
                  x="-30"
                  y="-30"
                  width="300"
                  height="210"
                >
                  <path
                    className="draw"
                    pathLength={stroke.length}
                    d={stroke.d}
                    style={{ "--len": stroke.length, "--cap": MASK_WIDTH / 2, strokeWidth: MASK_WIDTH }}
                  />
                </mask>
              ))}

              {/* « A » et « B » : les lettres dorées, qui recouvrent l'esquisse au défilement.
                  Chaque lettre a son propre groupe : à la fin, elles se séparent pour aller chacune
                  sur son initiale dans la navbar. --ox = le point fixe de son rétrécissement (son milieu). */}
              {LETTERS.map((letter) => (
                <g key={letter.name} className="letter" style={{ "--ox": `${letter.center}px` }}>
                  {/* Avec le film : la lettre telle qu'elle est sur sa dernière image. Elle prend le relais
                      de la toile quand le film est fini, et c'est elle qui s'envole vers le logo. */}
                  {hasFilm && (
                    <image
                      className="letter-film"
                      href={filmUrl("final")}
                      x={FILM.x}
                      y={FILM.y}
                      width={FILM.width}
                      height={FILM.height}
                      clipPath={`url(#intro-film-${letter.name})`}
                    />
                  )}

                  {/* Tout ce groupe est coupé net en haut et en bas par l'emporte-pièce */}
                  <g clipPath="url(#intro-clip)">
                    {/* Les traits de la lettre : un trait épais et lisse, peint avec le dégradé doré,
                        révélé par son masque */}
                    {letter.strokes.map((stroke) => (
                      <path
                        key={stroke.d}
                        className="letter-solid"
                        stroke="url(#intro-gold)"
                        d={stroke.shape ?? stroke.d}
                        mask={`url(#intro-welded-${STROKES.indexOf(stroke)})`}
                      />
                    ))}

                    {/* La chaleur : derrière la torche, la lettre est blanche, puis jaune, puis orange,
                        avant de retrouver son doré. Elle utilise le même masque que le trait : la couleur
                        chaude ne déborde donc jamais de la lettre. */}
                    {letter.strokes.map((stroke) => (
                      <g
                        key={stroke.d}
                        className="heat"
                        style={{ "--len": stroke.length }}
                        mask={`url(#intro-welded-${STROKES.indexOf(stroke)})`}
                      >
                        {HEAT.map((layer, index) => (
                          <path
                            key={index}
                            pathLength={stroke.length}
                            d={stroke.d}
                            style={{ "--hot": layer.length, stroke: layer.color, strokeOpacity: layer.opacity }}
                          />
                        ))}
                      </g>
                    ))}
                  </g>
                </g>
              ))}

              {/* La torche : un point lumineux qui suit le bout de chaque trait pendant qu'il se soude.
                  offset-path = le même chemin que le trait ; le CSS place la torche dessus selon --t.
                  (Les étincelles, elles, sont dessinées à part, sur le <canvas> plus bas.) */}
              {STROKES.map((stroke) => (
                <g key={stroke.d} className="torch" style={{ offsetPath: `path("${stroke.d}")` }}>
                  <circle className="torch-core" r={BEAD_WIDTH * 0.32} />
                </g>
              ))}

              {/* Cotes : trait, petites barres aux extrémités, et la mesure */}
              <g className="dimension fade dimension-width">
                <line x1="10" y1="160" x2="204" y2="160" />
                <line x1="10" y1="154" x2="10" y2="166" />
                <line x1="204" y1="154" x2="204" y2="166" />
                <text x="107" y="176">194</text>
              </g>
              <g className="dimension fade dimension-height">
                <line x1="230" y1="10" x2="230" y2="130" />
                <line x1="224" y1="10" x2="236" y2="10" />
                <line x1="224" y1="130" x2="236" y2="130" />
                <text x="244" y="74">120</text>
              </g>
            </svg>
          </div>

          <p className="intro-hint">
            {t.intro.scroll} <span>↓</span>
          </p>
        </div>

        {/* La toile des étincelles : elle recouvre tout l'écran, par-dessus le dessin (voir sparks.js) */}
        <canvas className="intro-sparks" aria-hidden="true" />

        {/* Le son de la soudure : coupé au départ, c'est le visiteur qui choisit de l'entendre.
            aria-pressed dit aux lecteurs d'écran si le bouton est enfoncé. */}
        <button type="button" className="intro-sound" aria-pressed={isSoundOn} onClick={toggleSound}>
          {t.intro.sound} · {isSoundOn ? t.intro.on : t.intro.off}
        </button>

        <button type="button" className="intro-skip" onClick={skipIntro}>
          {t.intro.skip} <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}

export default Intro;
