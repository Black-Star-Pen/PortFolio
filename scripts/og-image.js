// Dessine l'image d'aperçu du site : celle qui s'affiche quand on partage le lien
// (LinkedIn, WhatsApp, Discord…). Format standard : 1200 × 630 pixels.
//
// Le dessin se fait sur un <canvas> (une « toile » sur laquelle le JavaScript peint),
// avec les mêmes polices et les mêmes couleurs que le site. Le « AB » n'est pas dessiné :
// c'est une vraie image du film de l'intro (public/intro), prise en pleine soudure.
//
// Comment s'en servir : avec « npm run dev » lancé, ouvre
// http://localhost:5173/scripts/og-image.html, clique sur « Enregistrer l'image »,
// puis range le fichier dans public/ sous le nom og-image.jpg.
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  background: "#0a0b0f",
  text: "#f2efe9",
  accent: "#d6bf94",
};

const TITLE_FONT = '"Space Grotesk Variable", system-ui, sans-serif';
const BODY_FONT = '"Inter Variable", system-ui, sans-serif';
const MONO_FONT = 'ui-monospace, "SF Mono", Consolas, monospace';

// Les textes de l'image
const TEXTS = {
  label: "PORTFOLIO",
  firstName: "ADAM",
  lastName: "BOULKHEDERT",
  job: "Développeur full stack",
  stack: "React · Node.js · PostgreSQL",
  // « En cours » : sur l'image, la torche est encore en train de souder
  cartouche: ["PLAN N° 01", "ÉCH. 1:1", "CONTRÔLE : EN COURS"],
};

// Le film de l'intro : la même géométrie que dans src/components/intro/Intro.jsx (voir FILM).
// Ses images font 864 × 486 pixels ; x, y, width et height disent où elles se placent dans le dessin,
// en unités du dessin (les lettres vont de 10 à 204 en largeur, et de 10 à 130 en hauteur).
const FILM = {
  // L'image choisie parmi les 152 du film : les deux lettres sont entières, la torche finit le
  // dernier trait du B. Pour en essayer une autre, change ce numéro (de 0 à 151).
  frame: 131,
  x: -411.7 / 5.2,
  y: -176 / 5.2,
  width: 1920 / 5.2,
  height: 1080 / 5.2,
};

// Le cadre : sa distance au bord de l'image, et la largeur de la bande des repères
const FRAME_EDGE = 20;
const FRAME_BAND = 24;
const INNER = FRAME_EDGE + FRAME_BAND; // le bord du cadre intérieur

// Le monogramme : son agrandissement, et la position du coin haut gauche des lettres dans l'image
const MONOGRAM_SCALE = 2.15;
const MONOGRAM_X = 132;
const MONOGRAM_Y = 172;

const canvas = document.querySelector("#og");
const ctx = canvas.getContext("2d");

// Le bleu acier du site, plus ou moins transparent
function steel(alpha) {
  return `rgba(143, 179, 201, ${alpha})`;
}

// Trace un trait droit entre deux points
function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Écrit un texte. spacing = l'espace ajouté entre les lettres.
function write(content, x, y, { font, color, spacing = "0px", align = "left" }) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.letterSpacing = spacing;
  ctx.textAlign = align;
  ctx.fillText(content, x, y);
}

// Cherche la plus grande taille de police pour qu'un texte tienne dans une largeur donnée
function fitFontSize(content, weight, family, maxWidth, startSize) {
  ctx.letterSpacing = "0px";
  let size = startSize;
  while (size > 10) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(content).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

// 1. Le fond : la couleur du site, une lueur chaude derrière le monogramme, puis le quadrillage
function drawBackground() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Le centre de la lueur : le milieu des lettres (97 et 60 unités après leur coin haut gauche)
  const glowX = MONOGRAM_X + 97 * MONOGRAM_SCALE;
  const glowY = MONOGRAM_Y + 60 * MONOGRAM_SCALE;
  const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 460);
  glow.addColorStop(0, "rgba(214, 191, 148, 0.11)");
  glow.addColorStop(1, "rgba(214, 191, 148, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = steel(0.06);
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 30) line(x + 0.5, 0, x + 0.5, HEIGHT);
  for (let y = 0; y <= HEIGHT; y += 30) line(0, y + 0.5, WIDTH, y + 0.5);
}

// 2. Le cadre du plan : deux bordures, et les repères de zones entre les deux
function drawFrame() {
  ctx.strokeStyle = steel(0.32);
  ctx.lineWidth = 1;
  ctx.strokeRect(FRAME_EDGE + 0.5, FRAME_EDGE + 0.5, WIDTH - 2 * FRAME_EDGE, HEIGHT - 2 * FRAME_EDGE);
  ctx.strokeRect(INNER + 0.5, INNER + 0.5, WIDTH - 2 * INNER, HEIGHT - 2 * INNER);

  const labelStyle = { font: `12px ${MONO_FONT}`, color: steel(0.65), align: "center" };

  // Les chiffres, en haut et en bas
  const columns = ["1", "2", "3", "4", "5", "6"];
  const columnWidth = (WIDTH - 2 * INNER) / columns.length;
  columns.forEach((label, index) => {
    const left = INNER + index * columnWidth;
    if (index > 0) {
      line(left + 0.5, FRAME_EDGE, left + 0.5, INNER);
      line(left + 0.5, HEIGHT - INNER, left + 0.5, HEIGHT - FRAME_EDGE);
    }
    write(label, left + columnWidth / 2, FRAME_EDGE + 16, labelStyle);
    write(label, left + columnWidth / 2, HEIGHT - FRAME_EDGE - 8, labelStyle);
  });

  // Les lettres, à gauche et à droite
  const rows = ["A", "B", "C", "D"];
  const rowHeight = (HEIGHT - 2 * INNER) / rows.length;
  rows.forEach((label, index) => {
    const top = INNER + index * rowHeight;
    if (index > 0) {
      line(FRAME_EDGE, top + 0.5, INNER, top + 0.5);
      line(WIDTH - INNER, top + 0.5, WIDTH - FRAME_EDGE, top + 0.5);
    }
    write(label, FRAME_EDGE + FRAME_BAND / 2, top + rowHeight / 2 + 4, labelStyle);
    write(label, WIDTH - FRAME_EDGE - FRAME_BAND / 2, top + rowHeight / 2 + 4, labelStyle);
  });
}

// 3. Le monogramme « AB » : les traits de construction du plan, puis l'image du film par-dessus
function drawMonogram(film) {
  // save / restore : tout ce qui est réglé entre les deux (déplacement, agrandissement…)
  // est annulé à la fin. Ici, on travaille dans les unités du dessin de l'intro.
  ctx.save();
  ctx.translate(MONOGRAM_X - 10 * MONOGRAM_SCALE, MONOGRAM_Y - 10 * MONOGRAM_SCALE);
  ctx.scale(MONOGRAM_SCALE, MONOGRAM_SCALE);
  ctx.lineJoin = "round";

  // Les traits de construction
  ctx.strokeStyle = steel(0.4);
  ctx.lineWidth = 0.6;
  line(-16, 10, 226, 10);
  line(-16, 130, 226, 130);
  line(55, -16, 55, 150);
  ctx.beginPath();
  ctx.arc(170, 70, 36, 0, Math.PI * 2);
  ctx.stroke();

  // Le symbole de soudure pointé sur le sommet du A, et la cote sous les lettres
  ctx.strokeStyle = steel(0.75);
  ctx.stroke(new Path2D("M49.1 5.2 L30 -10.6 L-4 -10.6 M-9 -15.6 L-4 -10.6 L-9 -5.6 M8 -10.6 L8 -17.6 L15 -10.6"));
  ctx.fillStyle = steel(0.9);
  ctx.fill(new Path2D("M53 8.3 L48.1 6.4 L50.2 3.9 Z"));
  line(10, 160, 204, 160);
  line(10, 154, 10, 166);
  line(204, 154, 204, 166);
  write("141", -11, -8, { font: `8px ${MONO_FONT}`, color: steel(0.9), align: "right" });
  write("194", 107, 176, { font: `9px ${MONO_FONT}`, color: steel(0.9), align: "center" });

  // L'image du film : les lettres en métal, la lumière de la torche et ses étincelles.
  // Son fond est transparent : le quadrillage et les traits de construction restent visibles autour.
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(film, FILM.x, FILM.y, FILM.width, FILM.height);

  ctx.restore();
}

// 4. Les textes, à droite du monogramme
function drawTexts() {
  const left = 640;
  const maxWidth = WIDTH - INNER - 40 - left;

  // L'étiquette, précédée d'un petit trait doré
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2;
  line(left, 207, left + 44, 207);
  write(TEXTS.label, left + 60, 214, { font: `600 20px ${MONO_FONT}`, color: COLORS.accent, spacing: "8px" });

  // Le nom : la taille est calculée pour que le nom de famille tienne dans la largeur disponible
  const size = fitFontSize(TEXTS.lastName, 700, TITLE_FONT, maxWidth, 96);
  const nameFont = `700 ${size}px ${TITLE_FONT}`;
  write(TEXTS.firstName, left - 3, 292, { font: nameFont, color: COLORS.text });
  write(TEXTS.lastName, left - 3, 292 + size * 0.98, { font: nameFont, color: COLORS.accent });

  const afterName = 292 + size * 0.98;
  write(TEXTS.job, left, afterName + 58, { font: `500 34px ${BODY_FONT}`, color: COLORS.text });
  write(TEXTS.stack, left, afterName + 100, { font: `20px ${MONO_FONT}`, color: steel(0.9), spacing: "1px" });
}

// 5. Le cartouche, dans le coin en bas à droite du cadre
function drawCartouche() {
  const widths = [150, 130, 250];
  const height = 40;
  const right = WIDTH - INNER;
  const bottom = HEIGHT - INNER;
  let x = right - widths.reduce((total, width) => total + width, 0);

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, bottom - height, right - x, height);
  ctx.strokeStyle = steel(0.32);
  ctx.lineWidth = 1;

  TEXTS.cartouche.forEach((label, index) => {
    ctx.strokeRect(x + 0.5, bottom - height + 0.5, widths[index], height);
    write(label, x + widths[index] / 2, bottom - 14, {
      font: `13px ${MONO_FONT}`,
      color: COLORS.accent,
      spacing: "2px",
      align: "center",
    });
    x += widths[index];
  });
}

function draw(film) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  drawFrame();
  drawMonogram(film);
  drawTexts();
  drawCartouche();
}

// Charge une image du film. La promesse se termine quand l'image est arrivée (événement « load »),
// ou échoue si le fichier n'existe pas.
function loadFilmFrame(number) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Image du film introuvable : ${image.src}`));
    image.src = `/intro/f-${String(number).padStart(3, "0")}.webp`;
  });
}

// Le bouton : transforme la toile en fichier JPEG et le fait télécharger par le navigateur.
// JPEG et pas PNG : pour une image pleine de dégradés comme celle-ci, le fichier est bien plus léger,
// et tous les services de partage le lisent (ce n'est pas le cas du WebP).
document.querySelector("#save").addEventListener("click", () => {
  canvas.toBlob(
    (blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "og-image.jpg";
      link.click();
      URL.revokeObjectURL(link.href);
    },
    "image/jpeg",
    0.92,
  );
});

// On attend que les polices et l'image du film soient chargées avant de dessiner :
// sinon le texte sortirait dans une police de secours.
const [film] = await Promise.all([
  loadFilmFrame(FILM.frame),
  document.fonts.load(`700 80px ${TITLE_FONT}`),
  document.fonts.load(`500 34px ${BODY_FONT}`),
]);
draw(film);
