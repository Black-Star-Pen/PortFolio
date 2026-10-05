import { useEffect } from "react";

// Le titre de l'accueil : le même que la balise <title> de index.html
const DEFAULT_TITLE = "Adam Boulkhedert — Développeur Full Stack";

// Un « hook personnalisé » : une fonction qui regroupe un bout de logique React pour le réutiliser
// dans plusieurs composants. Par convention, son nom commence toujours par « use ».
//
// Celui-ci change le titre de l'onglet tant que la page est affichée :
// usePageTitle("Mentions légales") donne « Mentions légales — Adam Boulkhedert ».
export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} — Adam Boulkhedert`;

    // La fonction renvoyée est le « nettoyage » : React l'appelle quand on quitte la page.
    // On y remet le titre par défaut, pour le retour à l'accueil.
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
