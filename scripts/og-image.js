// Dessine l'image d'aperçu du site : celle qui s'affiche quand on partage le lien
// (LinkedIn, WhatsApp, Discord…). Format standard : 1200 × 630 pixels.
//
// Le dessin se fait sur un <canvas> (une « toile » sur laquelle le JavaScript peint),
// avec les mêmes polices, les mêmes couleurs et les mêmes tracés que l'intro du site.
//
// Comment s'en servir : avec « npm run dev » lancé, ouvre
// http://localhost:5173/scripts/og-image.html, clique sur « Enregistrer l'image »,
// puis range le fichier dans public/ sous le nom og-image.png.
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  background: "#0a0b0f",
  text: "#f2efe9",
  muted: "#b4b6be",
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
  cartouche: ["PLAN N° 01", "ÉCH. 1:1", "CONTRÔLE : VALIDÉ ✓"],
};

// Les tracés de « AB » : les mêmes que dans src/components/Intro.jsx
const STROKES = [
  "M10 130 L55 10 L100 130",
  "M28 86 L82 86",
  "M130 130 L130 10 L168 10 Q198 10 198 39 Q198 68 168 68 L130 68",
  "M168 68 Q204 68 204 99 Q204 130 168 130 L130 130",
];

// Le cadre : sa distance au bord de l'image, et la largeur de la bande des repères
const FRAME_EDGE = 20;
const FRAME_BAND = 24;
const INNER = FRAME_EDGE + FRAME_BAND; // le bord du cadre intérieur

// Le monogramme : son agrandissement, et la position de son coin haut gauche
const MONOGRAM_SCALE = 2.15;
const MONOGRAM_X = 112;
const MONOGRAM_Y = 172;
const BEAD = 5; // l'épaisseur du cordon, en unités du dessin

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

  const glow = ctx.createRadialGradient(340, 300, 0, 340, 300, 460);
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

// 3. Le monogramme « AB », soudé, avec la torche qui vient de finir le dernier trait
function drawMonogram() {
  const paths = STROKES.map((d) => new Path2D(d));

  // Trace les 4 traits de « AB » avec le même style (comme les calques du cordon dans le CSS de l'intro)
  function strokeAll({ color, width, cap = "round", dash = [], offset = 0 }) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = cap;
    ctx.setLineDash(dash);
    ctx.lineDashOffset = offset;
    paths.forEach((path) => ctx.stroke(path));
  }

  // save / restore : tout ce qui est réglé entre les deux (déplacement, agrandissement, ombres…)
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

  // Le cordon : le cœur (avec son halo doré), les écailles, puis leur relief
  ctx.shadowColor = "rgba(214, 191, 148, 0.55)";
  ctx.shadowBlur = 22;
  strokeAll({ color: "#b89f70", width: BEAD - 1.4 });
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  strokeAll({ color: COLORS.accent, width: BEAD, dash: [0.01, 1.99] });
  strokeAll({ color: "rgba(70, 46, 14, 0.36)", width: BEAD - 1, cap: "butt", dash: [0.4, 1.6], offset: -0.8 });
  strokeAll({ color: "rgba(255, 250, 235, 0.4)", width: BEAD - 1.8, cap: "butt", dash: [0.5, 1.5], offset: 0.25 });

  // La fin du dernier trait est encore chaude : du doré au blanc, en passant par l'orange
  const heat = ctx.createLinearGradient(204, 99, 130, 130);
  heat.addColorStop(0, "rgba(176, 96, 47, 0)");
  heat.addColorStop(0.3, "#b0602f");
  heat.addColorStop(0.55, "#de6e28");
  heat.addColorStop(0.75, "#f58f2e");
  heat.addColorStop(0.9, "#ffc356");
  heat.addColorStop(1, "#fff5d6");
  ctx.setLineDash([]);
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(255, 130, 40, 0.85)";
  ctx.shadowBlur = 24;
  ctx.strokeStyle = heat;
  ctx.lineWidth = BEAD + 0.4;
  ctx.stroke(new Path2D("M204 99 Q204 130 168 130 L130 130"));

  // La torche, au bout du trait, et quelques étincelles qui tombent
  ctx.fillStyle = "#fffdf2";
  ctx.shadowColor = "rgba(255, 200, 120, 1)";
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(130, 130, 3.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffe9b0";
  ctx.shadowBlur = 8;
  const sparks = [
    [-8, 9, 1.1],
    [-14, 4, 0.9],
    [-3, 15, 1],
    [6, 12, 0.8],
    [-11, 18, 0.7],
  ];
  sparks.forEach(([dx, dy, radius]) => {
    ctx.beginPath();
    ctx.arc(130 + dx, 130 + dy, radius, 0, Math.PI * 2);
    ctx.fill();
  });

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

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  drawFrame();
  drawMonogram();
  drawTexts();
  drawCartouche();
}

// Le bouton : transforme la toile en fichier PNG et le fait télécharger par le navigateur
document.querySelector("#save").addEventListener("click", () => {
  canvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "og-image.png";
    link.click();
    URL.revokeObjectURL(link.href);
  }, "image/png");
});

// On attend que les polices soient chargées avant de dessiner : sinon le texte sortirait
// dans une police de secours.
await Promise.all([
  document.fonts.load(`700 80px ${TITLE_FONT}`),
  document.fonts.load(`500 34px ${BODY_FONT}`),
]);
draw();
