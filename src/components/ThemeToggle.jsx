import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { getTheme, setTheme, THEME_CHANGE } from "../utils/theme";

// Le bouton de la navbar qui passe du thème sombre au thème clair, et retour.
// Il montre le thème vers lequel on ira : un soleil en thème sombre, une lune en thème clair.
function ThemeToggle() {
  const { t } = useLanguage();
  const [theme, setCurrentTheme] = useState(getTheme);
  const next = theme === "light" ? "dark" : "light";

  // Le thème peut changer ailleurs que par ce bouton : on écoute l'événement envoyé à chaque
  // changement (voir setTheme), pour que le dessin du bouton reste toujours juste.
  useEffect(() => {
    const sync = () => setCurrentTheme(getTheme());

    window.addEventListener(THEME_CHANGE, sync);
    return () => window.removeEventListener(THEME_CHANGE, sync);
  }, []);

  function toggle() {
    setTheme(next);
    setCurrentTheme(next);
  }

  return (
    <button
      type="button"
      className="navbar-tool"
      onClick={toggle}
      aria-label={next === "light" ? t.nav.toLight : t.nav.toDark}
      title={next === "light" ? t.nav.lightTheme : t.nav.darkTheme}
    >
      {/* aria-hidden : le dessin est un décor, c'est aria-label qui dit ce que fait le bouton */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        {next === "light" ? (
          // Le soleil : un disque et huit rayons
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
          </>
        ) : (
          // La lune : un croissant
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

export default ThemeToggle;
