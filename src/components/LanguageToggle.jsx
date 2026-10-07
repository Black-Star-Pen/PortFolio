import { useLocation, useNavigate } from "react-router";
import { useLanguage } from "../i18n/LanguageContext";

// Le bouton de la navbar qui passe du français à l'anglais, et retour.
// Il montre la langue vers laquelle on ira : « EN » en français, « FR » en anglais.
function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const next = lang === "fr" ? "en" : "fr";

  function toggle() {
    setLang(next);

    // On écrit aussi la langue dans l'adresse (…/?lang=en) : le lien copié depuis la barre d'adresse
    // ouvre ainsi le site en anglais chez la personne qui le reçoit. En français, la langue par défaut,
    // on retire le paramètre. « replace » : ce changement ne compte pas comme une page dans l'historique.
    const params = new URLSearchParams(location.search);
    if (next === "en") params.set("lang", "en");
    else params.delete("lang");

    const search = params.toString();
    navigate({ search: search ? `?${search}` : "", hash: location.hash }, { replace: true });
  }

  return (
    // lang : le texte du bouton est dans l'autre langue, on le dit aux lecteurs d'écran pour qu'ils
    // le prononcent correctement
    <button type="button" className="navbar-tool" onClick={toggle} lang={next} aria-label={t.nav.switchLanguage}>
      {t.nav.otherLanguage}
    </button>
  );
}

export default LanguageToggle;
