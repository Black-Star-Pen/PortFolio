// Applique le thème choisi par le visiteur à sa dernière visite (voir src/utils/theme.js), AVANT
// l'affichage de la page : sans ce script, un visiteur en thème clair verrait d'abord le site sombre
// pendant un instant, le temps que le reste du code se charge.
//
// Pourquoi un fichier à part, et pas quelques lignes dans index.html ? La règle de sécurité du site
// (Content-Security-Policy, dans render.yaml) n'autorise que les scripts servis par le site lui-même :
// un script écrit directement dans la page serait refusé par le navigateur.
//
// try/catch : la navigation privée peut interdire localStorage ; on reste alors en thème sombre.
try {
  if (localStorage.getItem("theme") === "light") {
    document.documentElement.dataset.theme = "light";
    // La couleur de la barre du navigateur sur mobile : le fond du thème clair
    document.querySelector('meta[name="theme-color"]').setAttribute("content", "#faf6ee");
  }
} catch {
  // rien à faire
}
