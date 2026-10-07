import { createContext, useContext } from "react";

// La langue du site : « fr » (français, par défaut) ou « en » (anglais).
// Un « contexte » React est une valeur mise à disposition de tous les composants, sans la passer de
// parent en enfant : ici, la langue en cours et ses textes. C'est LanguageProvider.jsx qui la fournit.
export const LanguageContext = createContext(null);

// Le hook à utiliser dans un composant :
//   const { lang, t, data, setLang } = useLanguage();
//   lang    : "fr" ou "en"
//   t       : les textes de l'interface dans cette langue (voir texts.js), ex. t.nav.about
//   data    : les contenus dans cette langue (projets, parcours, compétences)
//   setLang : pour changer de langue (utilisé par le bouton de la navbar)
export function useLanguage() {
  return useContext(LanguageContext);
}
