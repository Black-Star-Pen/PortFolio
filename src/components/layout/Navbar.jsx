import { useState, useEffect } from "react";
import { Link } from "react-router";
import { scrollToSiteTop } from "../../utils/siteTop";
import { lockPageScroll, unlockPageScroll } from "../../utils/smoothScroll";
import { useLanguage } from "../../i18n/LanguageContext";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";

// Les liens du menu : leur ancre, et le nom de leur texte dans t.nav (voir src/i18n/texts.js)
const links = [
  { href: "/#about", name: "about" },
  { href: "/#skills", name: "skills" },
  { href: "/#projects", name: "projects" },
  { href: "/#contact", name: "contact" },
];

function Navbar({ onContactClick }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Menu ouvert (petit écran) : la page derrière ne défile plus. On ne débloque qu'à la fermeture
  // du menu, pas à l'arrivée sur la page : une modale peut déjà être ouverte, et c'est elle qui bloque.
  useEffect(() => {
    if (!isOpen) return;

    lockPageScroll();
    return unlockPageScroll;
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  // Le logo ramène toujours au Hero.
  // Le lien seul ne suffit pas : si on est déjà sur « / » sans ancre, l'adresse ne change pas,
  // ScrollToTop ne se déclenche donc pas et rien ne bouge. On fait défiler nous-mêmes.
  function goToHero() {
    closeMenu();
    scrollToSiteTop();
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Les deux initiales ont leur propre <span> : à la fin de l'intro, le « A » et le « B » soudés
            viennent se poser dessus (voir Intro.jsx). data-text sert au reflet qui balaie le nom (CSS). */}
        <Link to="/" className="navbar-logo" data-text="ADAM BOULKHEDERT" onClick={goToHero}>
          <span className="logo-initial">A</span>DAM{" "}
          <span className="accent">
            <span className="logo-initial">B</span>OULKHEDERT
          </span>
        </Link>

        <nav className={`navbar-links ${isOpen ? "open" : ""}`}>
          {links.map((link, index) => (
            <a key={link.href} href={link.href} onClick={closeMenu} style={{ "--i": index }}>
              <span className="navbar-link-number">{String(index + 1).padStart(2, "0")}</span>
              {t.nav[link.name]}
            </a>
          ))}
        </nav>

        {/* À droite : les réglages du site (la langue, le thème), puis le bouton « Me contacter » */}
        <div className="navbar-actions">
          <LanguageToggle />
          <ThemeToggle />

          <button
            type="button"
            className="btn btn-primary btn-small btn-metal navbar-cta"
            onClick={onContactClick}
          >
            {t.nav.cta}
          </button>
        </div>

        <button
          type="button"
          className={`navbar-burger ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={isOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
