// Convertit les captures des projets en WebP, un format d'image bien plus léger que le PNG.
//
// Comment s'en servir :
//   1. dépose tes captures (PNG ou JPG) dans le dossier images-source/projects/ ;
//   2. lance « npm run images » ;
//   3. les versions WebP sont créées dans public/projects/, là où le site les charge.
//
// Ce script tourne avec Node.js, sur ton ordinateur : il ne fait pas partie du site.
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "images-source/projects";
const OUTPUT_DIR = "public/projects";
const MAX_WIDTH = 1600; // largeur maximale en pixels (une image plus petite n'est pas agrandie)
const QUALITY = 80; // de 1 à 100 : 80 est un bon équilibre entre le poids et la netteté

// Affiche une taille de fichier en kilo-octets : 1094312 → « 1069 Ko »
function inKilobytes(bytes) {
  return `${Math.round(bytes / 1024)} Ko`;
}

// On ne garde que les images (le « i » à la fin de l'expression ignore les majuscules : .PNG marche aussi)
const files = (await readdir(SOURCE_DIR)).filter((file) => /\.(png|jpe?g)$/i.test(file));
await mkdir(OUTPUT_DIR, { recursive: true });

for (const file of files) {
  const source = path.join(SOURCE_DIR, file);
  // Même nom, nouvelle extension : capture.png → capture.webp
  const output = path.join(OUTPUT_DIR, `${path.parse(file).name}.webp`);

  await sharp(source)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(output);

  const before = (await stat(source)).size;
  const after = (await stat(output)).size;
  console.log(`${file} → ${path.basename(output)} : ${inKilobytes(before)} → ${inKilobytes(after)}`);
}

console.log(`${files.length} image(s) convertie(s).`);
