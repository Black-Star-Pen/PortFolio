// Le thème du site : « dark » (sombre, celui d'origine, par défaut) ou « light » (clair).
// Le thème clair est simplement l'attribut data-theme="light" posé sur <html> : c'est le CSS qui fait
// tout le reste, en donnant d'autres valeurs aux variables de couleur (voir index.css, section 1).
// Le choix du visiteur est gardé dans le navigateur (localStorage) et retrouvé à sa prochaine visite :
// un petit script dans index.html le relit avant même l'affichage, pour éviter un éclair de thème sombre.

const STORAGE_KEY = "theme";

// La couleur de la barre du navigateur sur mobile (balise theme-color) : le fond du site, dans chaque thème
const BAR_COLORS = { dark: "#0a0b0f", light: "#faf6ee" };

// Le nom de l'événement envoyé à chaque changement de thème. Les dessins faits en JavaScript (la poussière
// d'or, les étincelles) l'écoutent pour reprendre leurs couleurs : le CSS, lui, n'en a pas besoin.
export const THEME_CHANGE = "themechange";

export function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(theme) {
  const root = document.documentElement;

  if (theme === "light") root.dataset.theme = "light";
  else delete root.dataset.theme;

  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BAR_COLORS[theme]);

  // La navigation privée peut interdire localStorage : le thème change quand même, il n'est juste pas retenu
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // rien à faire
  }

  window.dispatchEvent(new Event(THEME_CHANGE));
}

// Lit une couleur du thème en cours, écrite « rouge, vert, bleu » dans le CSS (ex. : "--rgb-accent").
// Pour les dessins sur une toile (<canvas>), qui ne savent pas lire une variable CSS eux-mêmes.
export function themeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
