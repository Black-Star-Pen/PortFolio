import { useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";

// Un « hook personnalisé » : une fonction qui regroupe un bout de logique React pour le réutiliser
// dans plusieurs composants. Par convention, son nom commence toujours par « use ».
//
// Celui-ci donne son titre à l'onglet tant que la page est affichée :
// usePageTitle("Mentions légales") donne « Mentions légales — Adam Boulkhedert ».
// Sans titre (usePageTitle(), sur l'accueil), c'est le titre du site, dans la langue en cours :
// en français, le même que la balise <title> de index.html.
export function usePageTitle(title) {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = title ? `${title} — Adam Boulkhedert` : t.meta.title;
  }, [title, t]);
}
