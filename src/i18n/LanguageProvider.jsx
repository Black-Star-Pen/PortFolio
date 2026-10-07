import { useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./LanguageContext";
import texts from "./texts";
import projectsFr from "../data/projectsData.json";
import projectsEn from "../data/projectsData.en.json";
import timelineFr from "../data/timelineData.json";
import timelineEn from "../data/timelineData.en.json";
import skillsFr from "../data/skillsData.json";
import skillsEn from "../data/skillsData.en.json";

// Les contenus du site, dans chaque langue. Les fichiers anglais (.en.json) ont exactement la même
// forme que les français : mêmes projets, dans le même ordre, avec les mêmes « slug » et « id ».
const DATA = {
  fr: { projects: projectsFr, timeline: timelineFr, skills: skillsFr },
  en: { projects: projectsEn, timeline: timelineEn, skills: skillsEn },
};

const LANGUAGES = ["fr", "en"];
const STORAGE_KEY = "lang";

// La langue à l'arrivée sur le site, par ordre de priorité :
// 1. celle demandée dans l'adresse (…/?lang=en) : c'est le lien à envoyer à un recruteur anglophone ;
// 2. celle choisie à la dernière visite, gardée dans le navigateur ;
// 3. sinon le français.
function readInitialLanguage() {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (LANGUAGES.includes(fromUrl)) return fromUrl;

  // La navigation privée peut interdire localStorage : on reste alors en français
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.includes(saved)) return saved;
  } catch {
    // rien à faire
  }

  return "fr";
}

// Fournit la langue à toute l'application (voir App dans main.jsx et useLanguage).
function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readInitialLanguage);

  // À chaque changement de langue : on la retient, et on met à jour ce que React n'affiche pas lui-même,
  // la langue déclarée de la page (lue par les lecteurs d'écran) et sa description (lue par Google).
  useEffect(() => {
    document.documentElement.lang = lang;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", texts[lang].meta.description);

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // rien à faire
    }
  }, [lang]);

  // useMemo : le même objet tant que la langue ne change pas, pour ne pas redessiner tout le site pour rien
  const value = useMemo(() => ({ lang, setLang, t: texts[lang], data: DATA[lang] }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export default LanguageProvider;
