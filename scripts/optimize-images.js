// Convertit les captures des projets en WebP, un format d'image bien plus léger que le PNG.
//
// Comment s'en servir :
//   1. dépose tes captures (PNG, JPG ou WebP) dans le dossier images-source/projects/ ;
//   2. lance « npm run images » ;
//   3. les versions WebP sont créées dans public/projects/, là où le site les charge.
//
// Chaque capture est fabriquée en plusieurs largeurs. Une carte de la liste des projets fait environ
// 350 pixels de large : lui envoyer l'image de 1600 pixels ferait télécharger bien plus que ce qui est
// affiché. Le navigateur choisit donc lui-même la plus petite version qui suffit à l'écran du visiteur
// (voir src/components/projects/ProjectImage.jsx). Pour qu'il puisse choisir, le script écrit la liste
// des versions fabriquées dans src/data/projectImages.json.
//
// Ce script tourne avec Node.js, sur ton ordinateur : il ne fait pas partie du site.
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "images-source/projects";
const OUTPUT_DIR = "public/projects";
const MANIFEST = "src/data/projectImages.json";
// Les largeurs fabriquées, en pixels, de la plus grande à la plus petite. La plus grande garde le nom
// simple (capture.webp) : c'est celle que citent les fichiers de données. Les autres portent leur
// largeur (capture-960.webp).
const WIDTHS = [1600, 960, 480];
const QUALITY = 90; // de 1 à 100 : à 90, les petits textes d'une capture d'écran restent nets, pour un poids encore léger

// Affiche une taille de fichier en kilo-octets : 1094312 → « 1069 Ko »
function inKilobytes(bytes) {
  return `${Math.round(bytes / 1024)} Ko`;
}

// On ne garde que les images (le « i » à la fin de l'expression ignore les majuscules : .PNG marche aussi)
const files = (await readdir(SOURCE_DIR)).filter((file) => /\.(png|jpe?g|webp)$/i.test(file));
await mkdir(OUTPUT_DIR, { recursive: true });

// La liste des versions de chaque capture : { "/projects/capture.webp": [{ src, width }, …] }
const manifest = {};

// sort() : les captures sont traitées par ordre alphabétique, pour que la liste écrite dans le
// fichier ne change pas d'ordre d'un ordinateur à l'autre
for (const file of files.sort()) {
  const source = path.join(SOURCE_DIR, file);
  const name = path.parse(file).name;
  const sourceWidth = (await sharp(source).metadata()).width;
  const versions = [];

  for (const width of WIDTHS) {
    // Une image n'est jamais agrandie : une capture de 1400 pixels donne une « grande » version de 1400
    const realWidth = Math.min(width, sourceWidth);
    // Si la capture est si petite que cette version serait la même que la précédente, on la saute
    if (versions.some((version) => version.width === realWidth)) continue;

    // Même nom, nouvelle extension : capture.png → capture.webp (et capture-960.webp, capture-480.webp)
    const outputName = width === WIDTHS[0] ? `${name}.webp` : `${name}-${width}.webp`;
    const output = path.join(OUTPUT_DIR, outputName);

    await sharp(source).resize({ width: realWidth }).webp({ quality: QUALITY }).toFile(output);

    versions.push({ src: `/projects/${outputName}`, width: realWidth });
    console.log(`${file} → ${outputName} : ${realWidth} px, ${inKilobytes((await stat(output)).size)}`);
  }

  // Dans la liste, de la plus étroite à la plus large : l'ordre habituel d'un attribut srcset
  manifest[`/projects/${name}.webp`] = versions.reverse();
}

// JSON.stringify(…, null, 2) : un fichier indenté, lisible par un humain
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`${files.length} capture(s) convertie(s), liste écrite dans ${MANIFEST}.`);
