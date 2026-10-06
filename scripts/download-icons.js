// Télécharge les logos des technologies dans public/icons/, pour que le site les serve lui-même
// au lieu d'aller les chercher sur un autre site à chaque visite.
//
// Comment s'en servir : après avoir ajouté une techno dans src/data/technoIcons.js,
// lance « npm run icons ». Seuls les logos manquants sont téléchargés.
//
// Ce script tourne avec Node.js, sur ton ordinateur : il ne fait pas partie du site.
import { access, mkdir, writeFile } from "node:fs/promises";
import technoIcons from "../src/data/technoIcons.js";

const OUTPUT_DIR = "public/icons";
const COLOR = "d6bf94"; // le doré du site (--color-accent), sans le #

// Les logos des technos, plus celui du lien GitHub de la section Contact.
// Set retire les doublons : deux technos peuvent partager le même logo.
const slugs = [...new Set([...Object.values(technoIcons), "github"])];

// Le fichier existe-t-il déjà ? access() échoue (et passe dans le catch) quand il n'existe pas.
async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

await mkdir(OUTPUT_DIR, { recursive: true });

let downloaded = 0;
for (const slug of slugs) {
  const file = `${OUTPUT_DIR}/${slug}.svg`;
  if (await exists(file)) continue;

  // Simple Icons renvoie le logo en SVG, déjà coloré dans la couleur demandée
  const response = await fetch(`https://cdn.simpleicons.org/${slug}/${COLOR}`);
  if (!response.ok) {
    console.log(`✗ ${slug} : introuvable sur Simple Icons (code ${response.status})`);
    continue;
  }

  await writeFile(file, await response.text());
  console.log(`✓ ${slug}`);
  downloaded += 1;
}

console.log(`${downloaded} logo(s) téléchargé(s), ${slugs.length} au total.`);
