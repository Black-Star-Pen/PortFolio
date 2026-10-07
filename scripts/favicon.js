// Dessine l'icône du site (celle de l'onglet du navigateur) : le monogramme « AB » en métal doré,
// sur le fond sombre du site. Les lettres ne sont pas redessinées : c'est la dernière image du film
// de l'intro (public/intro/final.webp), les deux lettres entières, sans la torche.
//
// Trois fichiers sont fabriqués, un par usage :
// - favicon-32.png        : l'onglet du navigateur ;
// - favicon-192.png       : les écrans très nets et les raccourcis sur Android ;
// - apple-touch-icon.png  : l'écran d'accueil d'un iPhone (180 px, sans coins arrondis : iOS les arrondit lui-même).
//
// Comment s'en servir : avec « npm run dev » lancé, ouvre http://localhost:5173/scripts/favicon.html,
// clique sur chaque bouton « Enregistrer », puis range les trois fichiers dans public/.

const BACKGROUND = "#0a0b0f"; // le fond du site

// Où se trouvent les lettres dans l'image du film (864 × 486 pixels), marge transparente retirée
const LETTERS = { x: 184, y: 82, width: 504, height: 322 };

// Les trois icônes.
// size     : le côté de l'image, en pixels
// fill     : la part de la largeur occupée par les lettres (elles sont plus larges que hautes)
// rounded  : des coins arrondis, comme une icône d'application ? (pas pour l'iPhone, voir plus haut)
// bold     : en tout petit, les lettres du film sont fines : on les dessine plusieurs fois, décalées
//            d'une fraction de pixel, pour les épaissir un peu sans perdre leurs reflets
const ICONS = [
  { file: "favicon-32.png", size: 32, fill: 0.9, rounded: true, bold: 0.45 },
  { file: "favicon-192.png", size: 192, fill: 0.8, rounded: true, bold: 0 },
  { file: "apple-touch-icon.png", size: 180, fill: 0.76, rounded: false, bold: 0 },
];

// Charge une image. La promesse se termine quand l'image est arrivée (événement « load »).
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Image introuvable : ${src}`));
    image.src = src;
  });
}

// Réduit les lettres à la largeur voulue, par moitiés successives.
// Réduire une grande image d'un seul coup vers une toute petite donne un résultat granuleux : chaque
// pixel d'arrivée ne « regarde » que quelques pixels de départ. En divisant par deux à chaque étape,
// tous les pixels comptent, et les reflets du métal restent doux.
function shrinkLetters(film, targetWidth) {
  let canvas = document.createElement("canvas");
  canvas.width = LETTERS.width;
  canvas.height = LETTERS.height;
  canvas.getContext("2d").drawImage(film, -LETTERS.x, -LETTERS.y);

  while (canvas.width / 2 >= targetWidth) {
    const half = document.createElement("canvas");
    half.width = Math.round(canvas.width / 2);
    half.height = Math.round(canvas.height / 2);
    const context = half.getContext("2d");
    context.imageSmoothingQuality = "high";
    context.drawImage(canvas, 0, 0, half.width, half.height);
    canvas = half;
  }

  return canvas;
}

function drawIcon(canvas, film, icon) {
  const { size, fill, rounded, bold } = icon;
  const context = canvas.getContext("2d");
  canvas.width = size;
  canvas.height = size;

  // Le fond : un carré aux coins arrondis (22 % du côté), ou plein
  context.fillStyle = BACKGROUND;
  context.beginPath();
  context.roundRect(0, 0, size, size, rounded ? size * 0.22 : 0);
  context.fill();

  // Les lettres, centrées
  const width = size * fill;
  const height = width * (LETTERS.height / LETTERS.width);
  const x = (size - width) / 2;
  const y = (size - height) / 2;
  const letters = shrinkLetters(film, width);

  context.imageSmoothingQuality = "high";
  // Les décalages : aucun (une seule passe), ou la passe normale plus quatre passes autour d'elle
  const offsets = bold
    ? [
        [0, 0],
        [bold, 0],
        [-bold, 0],
        [0, bold],
        [0, -bold],
      ]
    : [[0, 0]];
  offsets.forEach(([offsetX, offsetY]) => {
    context.drawImage(letters, x + offsetX, y + offsetY, width, height);
  });
}

// Le bouton d'une icône : transforme sa toile en fichier PNG et le fait télécharger
function save(canvas, file) {
  canvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file;
    link.click();
    URL.revokeObjectURL(link.href);
  }, "image/png");
}

const film = await loadImage("/intro/final.webp");
const list = document.querySelector("#icons");

ICONS.forEach((icon) => {
  const figure = document.createElement("figure");
  const canvas = document.createElement("canvas");
  canvas.dataset.file = icon.file;
  drawIcon(canvas, film, icon);

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = `Enregistrer ${icon.file}`;
  button.addEventListener("click", () => save(canvas, icon.file));

  const caption = document.createElement("figcaption");
  caption.textContent = `${icon.size} × ${icon.size} pixels`;

  figure.append(canvas, caption, button);
  list.append(figure);
});
